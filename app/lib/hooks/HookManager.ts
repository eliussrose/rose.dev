/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description Hook Manager - Event-driven automation system
 */

import { EventEmitter } from 'events';
import {
  Hook,
  HookEvent,
  HookExecution,
  HookEventType,
  HookActionType,
  HookCondition,
} from './types';

export class HookManager extends EventEmitter {
  private hooks: Map<string, Hook> = new Map();
  private executions: HookExecution[] = [];
  private executionCounts: Map<string, number> = new Map();
  private lastExecutionTime: Map<string, number> = new Map();

  /**
   * Register a hook
   */
  registerHook(hook: Hook): void {
    this.hooks.set(hook.id, hook);
    this.emit('hookRegistered', hook);
  }

  /**
   * Unregister a hook
   */
  unregisterHook(hookId: string): void {
    this.hooks.delete(hookId);
    this.emit('hookUnregistered', hookId);
  }

  /**
   * Get all hooks
   */
  getHooks(): Hook[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Get hooks for a specific event type
   */
  getHooksForEvent(eventType: HookEventType): Hook[] {
    return Array.from(this.hooks.values())
      .filter((hook) => hook.enabled && hook.eventType === eventType)
      .sort((a, b) => (b.priority || 50) - (a.priority || 50));
  }

  /**
   * Trigger an event
   */
  async triggerEvent(event: HookEvent): Promise<void> {
    const hooks = this.getHooksForEvent(event.type);

    for (const hook of hooks) {
      // Check conditions
      if (!this.checkConditions(hook, event)) {
        continue;
      }

      // Check debounce
      if (hook.debounce) {
        const lastExecution = this.lastExecutionTime.get(hook.id) || 0;
        if (Date.now() - lastExecution < hook.debounce) {
          continue;
        }
      }

      // Check max executions
      if (hook.maxExecutions) {
        const count = this.executionCounts.get(hook.id) || 0;
        if (count >= hook.maxExecutions) {
          continue;
        }
      }

      // Execute hook
      await this.executeHook(hook, event);
    }
  }

  /**
   * Check if hook conditions are met
   */
  private checkConditions(hook: Hook, event: HookEvent): boolean {
    if (!hook.conditions || hook.conditions.length === 0) {
      return true;
    }

    for (const condition of hook.conditions) {
      switch (condition.type) {
        case 'pattern':
          if (event.data.path) {
            const regex = new RegExp(condition.value as string);
            if (!regex.test(event.data.path)) return false;
          }
          break;

        case 'extension':
          if (event.data.path) {
            const ext = event.data.path.split('.').pop();
            if (ext !== condition.value) return false;
          }
          break;

        case 'path':
          if (event.data.path !== condition.value) return false;
          break;

        case 'custom':
          // Custom condition evaluation
          break;
      }
    }

    return true;
  }

  /**
   * Execute a hook
   */
  private async executeHook(hook: Hook, event: HookEvent): Promise<void> {
    const execution: HookExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hookId: hook.id,
      eventType: event.type,
      eventData: event.data,
      status: 'pending',
      startTime: Date.now(),
    };

    this.executions.push(execution);
    this.emit('hookExecutionStart', execution);

    try {
      execution.status = 'executing';

      let result: any;

      switch (hook.actionType) {
        case HookActionType.RunCommand:
          result = await this.runCommand(hook.actionConfig, event);
          break;

        case HookActionType.CallAgent:
          result = await this.callAgent(hook.actionConfig, event);
          break;

        case HookActionType.ExecuteScript:
          result = await this.executeScript(hook.actionConfig, event);
          break;

        case HookActionType.SendNotification:
          result = await this.sendNotification(hook.actionConfig, event);
          break;

        case HookActionType.CallAPI:
          result = await this.callAPI(hook.actionConfig, event);
          break;

        default:
          throw new Error(`Unknown action type: ${hook.actionType}`);
      }

      execution.result = result;
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      // Update counters
      this.executionCounts.set(
        hook.id,
        (this.executionCounts.get(hook.id) || 0) + 1
      );
      this.lastExecutionTime.set(hook.id, Date.now());

      this.emit('hookExecutionComplete', execution);
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.emit('hookExecutionError', execution, error);
    }
  }

  /**
   * Action implementations
   */
  private async runCommand(
    config: Record<string, any>,
    event: HookEvent
  ): Promise<string> {
    const command = this.interpolateVariables(config.command, event);

    if (typeof window !== 'undefined' && (window as any).electron) {
      const result = await (window as any).electron.executeCommand(command);
      if (!result.success) throw new Error(result.output);
      return result.output;
    }

    throw new Error('Command execution only available in Electron');
  }

  private async callAgent(
    config: Record<string, any>,
    event: HookEvent
  ): Promise<any> {
    const prompt = this.interpolateVariables(config.prompt, event);
    
    // Emit event for agent to handle
    this.emit('agentCallRequested', {
      prompt,
      mode: config.mode || 'interactive',
      event,
    });

    return { requested: true };
  }

  private async executeScript(
    config: Record<string, any>,
    event: HookEvent
  ): Promise<any> {
    const script = this.interpolateVariables(config.script, event);
    
    // Execute JavaScript in sandboxed environment
    try {
      const func = new Function('event', 'window', script);
      return func(event, typeof window !== 'undefined' ? window : {});
    } catch (error: any) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }

  private async sendNotification(
    config: Record<string, any>,
    event: HookEvent
  ): Promise<void> {
    const message = this.interpolateVariables(config.message, event);
    
    this.emit('notification', {
      title: config.title || 'Hook Notification',
      message,
      type: config.type || 'info',
    });
  }

  private async callAPI(
    config: Record<string, any>,
    event: HookEvent
  ): Promise<any> {
    const url = this.interpolateVariables(config.url, event);
    const body = config.body
      ? JSON.parse(this.interpolateVariables(JSON.stringify(config.body), event))
      : undefined;

    const response = await fetch(url, {
      method: config.method || 'POST',
      headers: config.headers || { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Interpolate variables in strings
   */
  private interpolateVariables(template: string, event: HookEvent): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const keys = path.split('.');
      let value: any = event.data;

      for (const key of keys) {
        value = value?.[key];
      }

      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get execution history
   */
  getExecutions(hookId?: string): HookExecution[] {
    if (hookId) {
      return this.executions.filter((exec) => exec.hookId === hookId);
    }
    return this.executions;
  }

  /**
   * Clear execution history
   */
  clearExecutions(): void {
    this.executions = [];
    this.executionCounts.clear();
  }

  /**
   * Enable/disable a hook
   */
  setHookEnabled(hookId: string, enabled: boolean): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.enabled = enabled;
      this.emit('hookUpdated', hook);
    }
  }

  /**
   * Update hook configuration
   */
  updateHook(hookId: string, updates: Partial<Hook>): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      Object.assign(hook, updates);
      this.emit('hookUpdated', hook);
    }
  }
}
