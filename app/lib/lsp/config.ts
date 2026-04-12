/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description LSP Configuration for Kora AI IDE
 */

import { WorkspaceConfig } from './types';

// Default LSP configuration
export const DEFAULT_LSP_CONFIG: WorkspaceConfig = {
  pythonPath: 'python',
  workspaceRoot: '',
  enableLSP: true,
  formatOnSave: false,
  diagnosticsEnabled: true,
  completionEnabled: true,
  hoverEnabled: true,
  definitionEnabled: true,
};

// LSP server settings
export const LSP_SERVER_CONFIG = {
  // Pyright server command
  serverCommand: 'pyright-langserver',
  serverArgs: ['--stdio'],
  
  // Connection settings
  reconnectAttempts: 3,
  reconnectDelay: 2000, // 2 seconds
  
  // Request timeouts
  completionTimeout: 100, // 100ms
  hoverTimeout: 200, // 200ms
  definitionTimeout: 500, // 500ms
  diagnosticsTimeout: 5000, // 5 seconds
  
  // Performance settings
  maxMemoryMB: 200,
  incrementalAnalysis: true,
  
  // Trigger characters for completion
  completionTriggerCharacters: ['.', '[', '"', "'"],
};

// Django detection patterns
export const DJANGO_PATTERNS = {
  settingsFile: 'settings.py',
  djangoImports: [
    'from django',
    'import django',
    'django.conf',
    'django.db',
    'django.views',
  ],
  djangoFiles: [
    'manage.py',
    'wsgi.py',
    'asgi.py',
  ],
};

// Python file extensions
export const PYTHON_EXTENSIONS = ['.py', '.pyi', '.pyw'];

// LSP storage keys
export const STORAGE_KEYS = {
  lspConfig: 'kora_lsp_config',
  pythonPath: 'kora_python_path',
  enableLSP: 'kora_enable_lsp',
  formatOnSave: 'kora_format_on_save',
};

// Load LSP configuration from localStorage
export function loadLSPConfig(): WorkspaceConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_LSP_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.lspConfig);
    if (stored) {
      return { ...DEFAULT_LSP_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load LSP config:', error);
  }

  return DEFAULT_LSP_CONFIG;
}

// Save LSP configuration to localStorage
export function saveLSPConfig(config: Partial<WorkspaceConfig>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = loadLSPConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.lspConfig, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save LSP config:', error);
  }
}

// Check if file is Python
export function isPythonFile(filename: string): boolean {
  return PYTHON_EXTENSIONS.some(ext => filename.endsWith(ext));
}

// Check if project is Django
export function isDjangoProject(files: string[]): boolean {
  // Check for Django-specific files
  const hasDjangoFiles = DJANGO_PATTERNS.djangoFiles.some(file =>
    files.some(f => f.endsWith(file))
  );

  if (hasDjangoFiles) {
    return true;
  }

  // Check for settings.py with Django imports
  const settingsFile = files.find(f => f.endsWith(DJANGO_PATTERNS.settingsFile));
  if (settingsFile) {
    // This would need to check file content, which we'll implement later
    return true;
  }

  return false;
}

// Get Python path from system
export async function detectPythonPath(): Promise<string> {
  // Try common Python paths
  const commonPaths = [
    'python',
    'python3',
    'python3.11',
    'python3.10',
    'python3.9',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe',
  ];

  // In browser mode, return default
  if (typeof window !== 'undefined' && !(window as any).electron) {
    return 'python';
  }

  // In Electron mode, try to detect Python
  for (const path of commonPaths) {
    try {
      // This would use Electron's child_process to check
      // For now, return the first one
      return path;
    } catch {
      continue;
    }
  }

  return 'python';
}
