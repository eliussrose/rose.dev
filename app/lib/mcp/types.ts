/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description MCP (Model Context Protocol) Types
 */

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  autoApprove?: string[]; // Tool names to auto-approve
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  serverId: string;
}

export interface MCPToolCall {
  id: string;
  tool: string;
  serverId: string;
  arguments: Record<string, any>;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: number;
}

export interface MCPConfig {
  servers: MCPServer[];
  globalAutoApprove: boolean;
  timeout: number;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
