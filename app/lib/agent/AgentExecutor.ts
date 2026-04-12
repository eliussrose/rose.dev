/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description Agent Executor - Executes autonomous tasks
 */

import { EventEmitter } from 'events';
import {
  AgentTask,
  AgentAction,
  AgentStatus,
  AgentMode,
  AgentConfig,
  AgentContext,
  ActionType,
} from './types';
import { callAI } from '../ai';
import type { AIProvider } from '@/app/types';

export class AgentExecutor extends EventEmitter {
  private task: AgentTask | null = null;
  private config: AgentConfig;
  private context: AgentContext;
  private abortController: AbortController | null = null;

  constructor(config: AgentConfig, context: AgentContext) {
    super();
    this.config = config;
    this.context = context;
  }

  /**
   * Start executing a task
   */
  async executeTask(
    goal: string,
    aiProvider: AIProvider,
    aiToken: string,
    aiModel: string
  ): Promise<AgentTask> {
    if (this.task && this.task.status === AgentStatus.Executing) {
      throw new Error('Agent is already executing a task');
    }

    // Create new task
    this.task = {
      id: `task_${Date.now()}`,
      goal,
      mode: this.config.mode,
      status: AgentStatus.Planning,
      actions: [],
      currentActionIndex: 0,
      createdAt: Date.now(),
    };

    this.emit('taskStart', this.task);

    try {
      // Step 1: Plan the task
      await this.planTask(aiProvider, aiToken, aiModel);

      // Step 2: Execute actions
      this.task.status = AgentStatus.Executing;
      this.task.startedAt = Date.now();
      this.emit('taskStatusChange', this.task);

      await this.executeActions();

      // Step 3: Complete
      this.task.status = AgentStatus.Completed;
      this.task.completedAt = Date.now();
      this.emit('taskComplete', this.task);

      return this.task;
    } catch (error: any) {
      this.task.status = AgentStatus.Error;
      this.task.error = error.message;
      this.emit('taskError', this.task, error);
      throw error;
    }
  }

  /**
   * Plan the task using AI
   */
  private async planTask(
    provider: AIProvider,
    token: string,
    model: string
  ): Promise<void> {
    if (!this.task) return;

    const planningPrompt = this.buildPlanningPrompt();

    const response = await callAI({
      provider,
      token,
      modelId: model,
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: AGENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: planningPrompt }],
    });

    // Parse AI response to extract actions
    const actions = this.parseActionsFromResponse(response);
    this.task.actions = actions;

    this.emit('taskPlanned', this.task);
  }

  /**
   * Execute all planned actions
   */
  private async executeActions(): Promise<void> {
    if (!this.task) return;

    for (let i = 0; i < this.task.actions.length; i++) {
      this.task.currentActionIndex = i;
      const action = this.task.actions[i];

      // Check if task was aborted
      if (this.abortController?.signal.aborted) {
        action.status = 'skipped';
        continue;
      }

      // Interactive mode: ask for confirmation
      if (this.config.mode === AgentMode.Interactive) {
        const confirmed = await this.requestConfirmation(action);
        if (!confirmed) {
          action.status = 'skipped';
          continue;
        }
      }

      // Execute action
      await this.executeAction(action);
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: AgentAction): Promise<void> {
    action.status = 'executing';
    action.timestamp = Date.now();
    this.emit('actionStart', action);

    try {
      let result: any;

      switch (action.type) {
        case ActionType.ReadFile:
          result = await this.readFile(action.params.path);
          break;

        case ActionType.WriteFile:
          result = await this.writeFile(
            action.params.path,
            action.params.content
          );
          break;

        case ActionType.EditFile:
          result = await this.editFile(
            action.params.path,
            action.params.changes
          );
          break;

        case ActionType.DeleteFile:
          result = await this.deleteFile(action.params.path);
          break;

        case ActionType.CreateDirectory:
          result = await this.createDirectory(action.params.path);
          break;

        case ActionType.ExecuteCommand:
          result = await this.executeCommand(action.params.command);
          break;

        case ActionType.SearchFiles:
          result = await this.searchFiles(action.params.pattern);
          break;

        case ActionType.AnalyzeCode:
          result = await this.analyzeCode(action.params.path);
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      action.result = result;
      action.status = 'completed';
      this.emit('actionComplete', action);
    } catch (error: any) {
      action.error = error.message;
      action.status = 'failed';
      this.emit('actionError', action, error);

      // Retry logic
      if (this.config.autoRetry && action.params.retryCount < this.config.maxRetries) {
        action.params.retryCount = (action.params.retryCount || 0) + 1;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.executeAction(action);
      }
    }
  }

  /**
   * Build planning prompt for AI
   */
  private buildPlanningPrompt(): string {
    return `
Goal: ${this.task?.goal}

Context:
- Workspace: ${this.context.workspaceRoot}
- Open Files: ${this.context.openFiles.join(', ') || 'None'}
- Recent Files: ${this.context.recentFiles.join(', ') || 'None'}

Available Actions:
- read_file: Read a file's content
- write_file: Create or overwrite a file
- edit_file: Modify specific parts of a file
- delete_file: Delete a file
- create_directory: Create a directory
- execute_command: Run a terminal command
- search_files: Search for files matching a pattern
- analyze_code: Analyze code for issues

Please create a step-by-step plan to achieve the goal. For each step, specify:
1. Description: What this step does
2. Action: Which action to use
3. Params: Parameters for the action

Format your response as JSON:
{
  "reasoning": "Why this plan will work",
  "steps": [
    {
      "description": "Step description",
      "action": "action_type",
      "params": { "key": "value" }
    }
  ]
}
`;
  }

  /**
   * Parse actions from AI response
   */
  private parseActionsFromResponse(response: string): AgentAction[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const plan = JSON.parse(jsonMatch[0]);
      
      return plan.steps.map((step: any, index: number) => ({
        id: `action_${Date.now()}_${index}`,
        type: step.action as ActionType,
        description: step.description,
        params: step.params || {},
        status: 'pending' as const,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  /**
   * Request user confirmation for an action
   */
  private async requestConfirmation(action: AgentAction): Promise<boolean> {
    return new Promise((resolve) => {
      this.emit('confirmationRequired', action, resolve);
    });
  }

  /**
   * Action implementations
   */
  private async readFile(path: string): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.readFile(path);
      if (!result.success) throw new Error(result.error);
      return result.content;
    }
    throw new Error('File operations only available in Electron');
  }

  private async writeFile(path: string, content: string): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.writeFile(path, content);
      if (!result.success) throw new Error(result.error);
      return;
    }
    throw new Error('File operations only available in Electron');
  }

  private async editFile(path: string, changes: any): Promise<void> {
    // Read current content
    const content = await this.readFile(path);
    
    // Apply changes (simple implementation)
    let newContent = content;
    if (changes.search && changes.replace) {
      newContent = content.replace(
        new RegExp(changes.search, 'g'),
        changes.replace
      );
    }
    
    // Write back
    await this.writeFile(path, newContent);
  }

  private async deleteFile(path: string): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.deleteFile(path);
      if (!result.success) throw new Error(result.error);
      return;
    }
    throw new Error('File operations only available in Electron');
  }

  private async createDirectory(path: string): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.createDirectory(path);
      if (!result.success) throw new Error(result.error);
      return;
    }
    throw new Error('File operations only available in Electron');
  }

  private async executeCommand(command: string): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.executeCommand(command);
      if (!result.success) throw new Error(result.output);
      return result.output;
    }
    throw new Error('Command execution only available in Electron');
  }

  private async searchFiles(pattern: string): Promise<string[]> {
    // Simple implementation - can be enhanced
    return [];
  }

  private async analyzeCode(path: string): Promise<any> {
    // Placeholder for code analysis
    return { issues: [] };
  }

  /**
   * Pause task execution
   */
  pause(): void {
    if (this.task) {
      this.task.status = AgentStatus.Paused;
      this.emit('taskPaused', this.task);
    }
  }

  /**
   * Resume task execution
   */
  async resume(): Promise<void> {
    if (this.task && this.task.status === AgentStatus.Paused) {
      this.task.status = AgentStatus.Executing;
      this.emit('taskResumed', this.task);
      await this.executeActions();
    }
  }

  /**
   * Abort task execution
   */
  abort(): void {
    this.abortController?.abort();
    if (this.task) {
      this.task.status = AgentStatus.Error;
      this.task.error = 'Task aborted by user';
      this.emit('taskAborted', this.task);
    }
  }

  /**
   * Get current task
   */
  getCurrentTask(): AgentTask | null {
    return this.task;
  }
}

const AGENT_SYSTEM_PROMPT = `You are an autonomous coding agent. Your job is to break down user goals into actionable steps.

You have access to these actions:
- read_file: Read file content
- write_file: Create/overwrite files
- edit_file: Modify files
- delete_file: Remove files
- create_directory: Create folders
- execute_command: Run commands
- search_files: Find files
- analyze_code: Check code quality

Always respond with a JSON plan containing reasoning and steps.
Be specific with file paths and parameters.
Think step-by-step and be thorough.`;
