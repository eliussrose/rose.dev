/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description LSP Utility Functions for Kora AI IDE
 */

import { Position, Range, Diagnostic, DiagnosticSeverity } from './types';

// Convert Monaco position to LSP position
export function monacoToLSPPosition(position: { lineNumber: number; column: number }): Position {
  return {
    line: position.lineNumber - 1, // LSP is 0-based
    character: position.column - 1,
  };
}

// Convert LSP position to Monaco position
export function lspToMonacoPosition(position: Position): { lineNumber: number; column: number } {
  return {
    lineNumber: position.line + 1, // Monaco is 1-based
    column: position.character + 1,
  };
}

// Convert Monaco range to LSP range
export function monacoToLSPRange(range: {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}): Range {
  return {
    start: {
      line: range.startLineNumber - 1,
      character: range.startColumn - 1,
    },
    end: {
      line: range.endLineNumber - 1,
      character: range.endColumn - 1,
    },
  };
}

// Convert LSP range to Monaco range
export function lspToMonacoRange(range: Range): {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
} {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

// Convert LSP diagnostic severity to Monaco marker severity
export function lspToMonacoSeverity(severity: DiagnosticSeverity): number {
  // Monaco severity: 1=Hint, 2=Info, 4=Warning, 8=Error
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 8;
    case DiagnosticSeverity.Warning:
      return 4;
    case DiagnosticSeverity.Information:
      return 2;
    case DiagnosticSeverity.Hint:
      return 1;
    default:
      return 2;
  }
}

// Convert LSP diagnostics to Monaco markers
export function lspDiagnosticsToMonacoMarkers(diagnostics: Diagnostic[]): any[] {
  return diagnostics.map(diagnostic => ({
    severity: lspToMonacoSeverity(diagnostic.severity),
    startLineNumber: diagnostic.range.start.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    endColumn: diagnostic.range.end.character + 1,
    message: diagnostic.message,
    source: diagnostic.source || 'LSP',
    code: diagnostic.code,
  }));
}

// Generate unique request ID
let requestIdCounter = 0;
export function generateRequestId(): number {
  return ++requestIdCounter;
}

// Create LSP request message
export function createLSPRequest(method: string, params?: any): any {
  return {
    jsonrpc: '2.0',
    id: generateRequestId(),
    method,
    params,
  };
}

// Create LSP notification (no response expected)
export function createLSPNotification(method: string, params?: any): any {
  return {
    jsonrpc: '2.0',
    method,
    params,
  };
}

// Parse LSP message
export function parseLSPMessage(data: string): any {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse LSP message:', error);
    return null;
  }
}

// Format LSP message for sending
export function formatLSPMessage(message: any): string {
  const content = JSON.stringify(message);
  return `Content-Length: ${content.length}\r\n\r\n${content}`;
}

// Extract file URI from path
export function pathToUri(path: string): string {
  // Normalize path separators
  const normalized = path.replace(/\\/g, '/');
  
  // Add file:// protocol if not present
  if (!normalized.startsWith('file://')) {
    return `file:///${normalized}`;
  }
  
  return normalized;
}

// Extract path from URI
export function uriToPath(uri: string): string {
  if (uri.startsWith('file://')) {
    return uri.substring(7);
  }
  return uri;
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Promise with timeout
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    ),
  ]);
}

// Retry function with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Check if running in Electron
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electron;
}

// Check if running in browser
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && !(window as any).electron;
}

// Get workspace root
export function getWorkspaceRoot(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  // In Electron, we can get the actual workspace path
  if (isElectron()) {
    // This would be implemented with Electron IPC
    return '/workspace';
  }

  // In browser, use a virtual path
  return '/virtual-workspace';
}

// Log LSP message (for debugging)
export function logLSPMessage(direction: 'send' | 'receive', message: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[LSP ${direction}]`, message);
  }
}
