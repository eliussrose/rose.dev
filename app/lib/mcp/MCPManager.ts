/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description MCP Manager - Manages Model Context Protocol servers and tools
 */

import { EventEmitter } from 'events';
import { MCPServer, MCPTool, MCPToolCall, MCPConfig, MCPMessage } from './types';

export class MCPManager extends EventEmitter {
  private config: MCPConfig;
  private servers: Map<string, any> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private messageId = 0;

  constructor(config: MCPConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize all enabled MCP servers
   */
  async initialize(): Promise<void> {
    for (const serverConfig of this.config.servers) {
      if (serverConfig.enabled) {
        try {
          await this.startServer(serverConfig);
        } catch (error) {
          console.error(`Failed to start MCP server ${serverConfig.name}:`, error);
        }
      }
    }
  }

  /**
   * Start an MCP server
   */
  private async startServer(serverConfig: MCPServer): Promise<void> {
    // In Electron, spawn the server process
    if (typeof window !== 'undefined' && (window as any).electron) {
      // Server will be managed by Electron main process
      const result = await (window as any).electron.mcpStartServer?.({
        id: serverConfig.id,
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
      });

      if (result?.success) {
        this.servers.set(serverConfig.id, { config: serverConfig, pid: result.pid });
        
        // Discover tools from this server
        await this.discoverTools(serverConfig.id);
        
        this.emit('serverStarted', serverConfig.id);
      }
    }
  }

  /**
   * Discover available tools from a server
   */
  private async discoverTools(serverId: string): Promise<void> {
    try {
      const response = await this.sendRequest(serverId, 'tools/list', {});
      
      if (response.tools) {
        for (const tool of response.tools) {
          const mcpTool: MCPTool = {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            serverId,
          };
          
          this.tools.set(`${serverId}:${tool.name}`, mcpTool);
        }
        
        this.emit('toolsDiscovered', serverId, response.tools.length);
      }
    } catch (error) {
      console.error(`Failed to discover tools from ${serverId}:`, error);
    }
  }

  /**
   * Get all available tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools from a specific server
   */
  getServerTools(serverId: string): MCPTool[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.serverId === serverId
    );
  }

  /**
   * Execute an MCP tool
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    autoApprove = false
  ): Promise<MCPToolCall> {
    // Find the tool
    const toolKey = Array.from(this.tools.keys()).find((key) =>
      key.endsWith(`:${toolName}`)
    );
    
    if (!toolKey) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const tool = this.tools.get(toolKey)!;
    
    // Create tool call
    const toolCall: MCPToolCall = {
      id: `call_${Date.now()}`,
      tool: toolName,
      serverId: tool.serverId,
      arguments: args,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.emit('toolCallCreated', toolCall);

    // Check if auto-approve
    const serverConfig = this.config.servers.find((s) => s.id === tool.serverId);
    const shouldAutoApprove =
      autoApprove ||
      this.config.globalAutoApprove ||
      serverConfig?.autoApprove?.includes(toolName);

    if (!shouldAutoApprove) {
      // Request approval
      const approved = await this.requestApproval(toolCall);
      if (!approved) {
        toolCall.status = 'failed';
        toolCall.error = 'User denied approval';
        this.emit('toolCallDenied', toolCall);
        return toolCall;
      }
    }

    toolCall.status = 'approved';
    this.emit('toolCallApproved', toolCall);

    // Execute the tool
    try {
      toolCall.status = 'executing';
      this.emit('toolCallExecuting', toolCall);

      const result = await this.sendRequest(
        tool.serverId,
        'tools/call',
        {
          name: toolName,
          arguments: args,
        }
      );

      toolCall.result = result;
      toolCall.status = 'completed';
      this.emit('toolCallCompleted', toolCall);

      return toolCall;
    } catch (error: any) {
      toolCall.status = 'failed';
      toolCall.error = error.message;
      this.emit('toolCallFailed', toolCall, error);
      throw error;
    }
  }

  /**
   * Send a request to an MCP server
   */
  private async sendRequest(
    serverId: string,
    method: string,
    params: any
  ): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const message: MCPMessage = {
        jsonrpc: '2.0',
        id: ++this.messageId,
        method,
        params,
      };

      const result = await (window as any).electron.mcpSendRequest?.({
        serverId,
        message,
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }

      return result?.result;
    }

    throw new Error('MCP only available in Electron');
  }

  /**
   * Request user approval for a tool call
   */
  private async requestApproval(toolCall: MCPToolCall): Promise<boolean> {
    return new Promise((resolve) => {
      this.emit('approvalRequired', toolCall, resolve);
    });
  }

  /**
   * Stop an MCP server
   */
  async stopServer(serverId: string): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      await (window as any).electron.mcpStopServer?.({ serverId });
      this.servers.delete(serverId);
      
      // Remove tools from this server
      for (const [key, tool] of this.tools.entries()) {
        if (tool.serverId === serverId) {
          this.tools.delete(key);
        }
      }
      
      this.emit('serverStopped', serverId);
    }
  }

  /**
   * Stop all servers
   */
  async shutdown(): Promise<void> {
    for (const serverId of this.servers.keys()) {
      await this.stopServer(serverId);
    }
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): 'running' | 'stopped' {
    return this.servers.has(serverId) ? 'running' : 'stopped';
  }

  /**
   * Reload configuration
   */
  async reloadConfig(newConfig: MCPConfig): Promise<void> {
    // Stop all servers
    await this.shutdown();
    
    // Update config
    this.config = newConfig;
    
    // Restart servers
    await this.initialize();
  }
}
