/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description LSP Server Manager - Manages Pyright language server lifecycle
 * @server-only This module should only be used on the server side
 */

// @ts-ignore - Server-only module
import { ChildProcess, spawn } from 'child_process';
// @ts-ignore - Server-only module
import { EventEmitter } from 'events';
import {
  ServerInfo,
  ServerCapabilities,
  LSPMessage,
  LSPResponse,
  ConnectionStatus,
} from './types';

export interface ServerManagerOptions {
  pythonPath?: string;
  workspaceRoot: string;
  serverPath?: string;
  debug?: boolean;
}

export class LSPServerManager extends EventEmitter {
  private serverProcess: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private status: ConnectionStatus = ConnectionStatus.Disconnected;
  private options: ServerManagerOptions;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_DELAY = 2000;
  private readonly REQUEST_TIMEOUT = 5000;

  constructor(options: ServerManagerOptions) {
    super();
    this.options = options;
  }

  /**
   * Start the Pyright language server
   */
  async startServer(): Promise<ServerInfo> {
    if (this.serverProcess) {
      throw new Error('Server is already running');
    }

    this.setStatus(ConnectionStatus.Connecting);

    try {
      // Determine server command
      const serverCommand = this.options.serverPath || 'pyright-langserver';
      const args = ['--stdio'];

      if (this.options.debug) {
        console.log('[LSP] Starting server:', serverCommand, args);
      }

      // Spawn server process
      this.serverProcess = spawn(serverCommand, args, {
        cwd: this.options.workspaceRoot,
        env: {
          ...process.env,
          PYTHONPATH: this.options.pythonPath || process.env.PYTHONPATH,
        },
      });

      // Setup process handlers
      this.setupProcessHandlers();

      // Initialize server
      const initResult = await this.initialize();

      this.setStatus(ConnectionStatus.Connected);
      this.reconnectAttempts = 0;

      const serverInfo: ServerInfo = {
        pid: this.serverProcess.pid!,
        version: initResult.serverInfo?.version || 'unknown',
        capabilities: initResult.capabilities || {},
      };

      this.emit('serverStart', serverInfo);

      return serverInfo;
    } catch (error) {
      this.setStatus(ConnectionStatus.Error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop the language server
   */
  async stopServer(): Promise<void> {
    if (!this.serverProcess) {
      return;
    }

    try {
      // Send shutdown request
      await this.sendRequest('shutdown', {});
      
      // Send exit notification
      this.sendNotification('exit', {});

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.serverProcess?.kill('SIGKILL');
          resolve();
        }, 2000);

        this.serverProcess?.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    } catch (error) {
      console.error('[LSP] Error stopping server:', error);
      this.serverProcess?.kill('SIGKILL');
    } finally {
      this.cleanup();
      this.emit('serverStop');
    }
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.serverProcess !== null && !this.serverProcess.killed;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Send LSP request and wait for response
   */
  async sendRequest(method: string, params: any): Promise<any> {
    if (!this.serverProcess) {
      throw new Error('Server is not running');
    }

    const id = ++this.messageId;
    const message: LSPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.REQUEST_TIMEOUT);

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeout });

      // Send message
      this.sendMessage(message);
    });
  }

  /**
   * Send LSP notification (no response expected)
   */
  sendNotification(method: string, params: any): void {
    if (!this.serverProcess) {
      throw new Error('Server is not running');
    }

    const message: LSPMessage = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.sendMessage(message);
  }

  /**
   * Initialize the language server
   */
  private async initialize(): Promise<any> {
    const initParams = {
      processId: process.pid,
      rootUri: `file://${this.options.workspaceRoot}`,
      capabilities: {
        textDocument: {
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
            },
          },
          hover: {
            contentFormat: ['markdown', 'plaintext'],
          },
          definition: {
            linkSupport: true,
          },
          diagnostic: {
            dynamicRegistration: true,
          },
        },
        workspace: {
          workspaceFolders: true,
          configuration: true,
        },
      },
      workspaceFolders: [
        {
          uri: `file://${this.options.workspaceRoot}`,
          name: 'workspace',
        },
      ],
    };

    const result = await this.sendRequest('initialize', initParams);
    
    // Send initialized notification
    this.sendNotification('initialized', {});

    return result;
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    if (!this.serverProcess) return;

    let buffer = '';

    // Handle stdout (LSP messages)
    this.serverProcess.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      
      // Process complete messages
      while (true) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) break;

        const header = buffer.substring(0, headerEnd);
        const contentLengthMatch = header.match(/Content-Length: (\d+)/);
        
        if (!contentLengthMatch) {
          console.error('[LSP] Invalid message header:', header);
          buffer = buffer.substring(headerEnd + 4);
          continue;
        }

        const contentLength = parseInt(contentLengthMatch[1]);
        const messageStart = headerEnd + 4;
        const messageEnd = messageStart + contentLength;

        if (buffer.length < messageEnd) break;

        const messageContent = buffer.substring(messageStart, messageEnd);
        buffer = buffer.substring(messageEnd);

        try {
          const message = JSON.parse(messageContent);
          this.handleMessage(message);
        } catch (error) {
          console.error('[LSP] Failed to parse message:', error);
        }
      }
    });

    // Handle stderr (logs)
    this.serverProcess.stderr?.on('data', (data: Buffer) => {
      if (this.options.debug) {
        console.error('[LSP Server]', data.toString());
      }
    });

    // Handle process exit
    this.serverProcess.on('exit', (code, signal) => {
      console.log(`[LSP] Server exited with code ${code}, signal ${signal}`);
      this.handleServerExit(code, signal);
    });

    // Handle process errors
    this.serverProcess.on('error', (error) => {
      console.error('[LSP] Server process error:', error);
      this.emit('serverError', error);
      this.handleServerCrash();
    });
  }

  /**
   * Send message to server
   */
  private sendMessage(message: LSPMessage): void {
    if (!this.serverProcess?.stdin) {
      throw new Error('Server stdin is not available');
    }

    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    
    this.serverProcess.stdin.write(header + content);

    if (this.options.debug) {
      console.log('[LSP] Sent:', message.method, message.id);
    }
  }

  /**
   * Handle incoming message from server
   */
  private handleMessage(message: any): void {
    if (this.options.debug) {
      console.log('[LSP] Received:', message.method || `response ${message.id}`);
    }

    // Handle response
    if ('id' in message && typeof message.id !== 'undefined') {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
      return;
    }

    // Handle notification
    if (message.method) {
      this.emit('notification', message.method, message.params);
    }
  }

  /**
   * Handle server exit
   */
  private handleServerExit(code: number | null, signal: string | null): void {
    this.cleanup();

    if (code !== 0 && code !== null) {
      this.handleServerCrash();
    }
  }

  /**
   * Handle server crash and attempt reconnection
   */
  private async handleServerCrash(): Promise<void> {
    this.setStatus(ConnectionStatus.Error);

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`[LSP] Attempting reconnection (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);

      setTimeout(async () => {
        try {
          await this.startServer();
          console.log('[LSP] Reconnection successful');
        } catch (error) {
          console.error('[LSP] Reconnection failed:', error);
        }
      }, this.RECONNECT_DELAY);
    } else {
      console.error('[LSP] Max reconnection attempts reached');
      this.emit('serverError', new Error('Server crashed and failed to reconnect'));
    }
  }

  /**
   * Set connection status
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChange', status);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Server stopped'));
    }
    this.pendingRequests.clear();

    // Clear server process
    this.serverProcess = null;
    this.setStatus(ConnectionStatus.Disconnected);
  }
}
