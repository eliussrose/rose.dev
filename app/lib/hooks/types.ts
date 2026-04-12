/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description Hook System Types
 */

export enum HookEventType {
  // File events
  FileCreated = 'file:created',
  FileEdited = 'file:edited',
  FileDeleted = 'file:deleted',
  FileSaved = 'file:saved',
  
  // Agent events
  AgentStart = 'agent:start',
  AgentStop = 'agent:stop',
  AgentError = 'agent:error',
  
  // Tool events
  ToolBefore = 'tool:before',
  ToolAfter = 'tool:after',
  
  // Build events
  BuildStart = 'build:start',
  BuildComplete = 'build:complete',
  BuildError = 'build:error',
  
  // Custom events
  Custom = 'custom',
}

export enum HookActionType {
  RunCommand = 'run_command',
  CallAgent = 'call_agent',
  ExecuteScript = 'execute_script',
  SendNotification = 'send_notification',
  CallAPI = 'call_api',
}

export interface HookCondition {
  type: 'pattern' | 'extension' | 'path' | 'custom';
  value: string | RegExp;
}

export interface Hook {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  eventType: HookEventType;
  conditions?: HookCondition[];
  actionType: HookActionType;
  actionConfig: Record<string, any>;
  debounce?: number; // milliseconds
  maxExecutions?: number; // per session
  priority?: number; // 0-100, higher = earlier
}

export interface HookExecution {
  id: string;
  hookId: string;
  eventType: HookEventType;
  eventData: any;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface HookEvent {
  type: HookEventType;
  data: any;
  timestamp: number;
}
