/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description Agent System Types
 */

export enum AgentMode {
  Interactive = "interactive", // Ask before each action
  Autonomous = "autonomous",   // Execute without confirmation
}

export enum AgentStatus {
  Idle = "idle",
  Planning = "planning",
  Executing = "executing",
  Paused = "paused",
  Completed = "completed",
  Error = "error",
}

export enum ActionType {
  ReadFile = "read_file",
  WriteFile = "write_file",
  EditFile = "edit_file",
  DeleteFile = "delete_file",
  CreateDirectory = "create_directory",
  ExecuteCommand = "execute_command",
  SearchFiles = "search_files",
  AnalyzeCode = "analyze_code",
}

export interface AgentAction {
  id: string;
  type: ActionType;
  description: string;
  params: Record<string, any>;
  status: "pending" | "executing" | "completed" | "failed" | "skipped";
  result?: any;
  error?: string;
  timestamp: number;
}

export interface AgentTask {
  id: string;
  goal: string;
  mode: AgentMode;
  status: AgentStatus;
  actions: AgentAction[];
  currentActionIndex: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface AgentConfig {
  mode: AgentMode;
  maxActions: number;
  timeout: number; // milliseconds
  autoRetry: boolean;
  maxRetries: number;
  confirmBeforeWrite: boolean;
  confirmBeforeDelete: boolean;
  confirmBeforeCommand: boolean;
}

export interface AgentContext {
  workspaceRoot: string;
  openFiles: string[];
  recentFiles: string[];
  projectStructure: any;
  gitStatus?: any;
}

export interface AgentPlan {
  goal: string;
  reasoning: string;
  steps: {
    description: string;
    action: ActionType;
    params: Record<string, any>;
  }[];
  estimatedTime: number; // seconds
}
