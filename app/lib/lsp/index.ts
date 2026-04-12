/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description LSP Module Exports for Kora AI IDE
 */

// Export types
export * from './types';

// Export configuration
export * from './config';

// Export utilities
export * from './utils';

// Export server manager (server-side only)
export { LSPServerManager } from './server-manager';
export type { ServerManagerOptions } from './server-manager';

// Version
export const LSP_VERSION = '1.0.0';

// Feature flags
export const LSP_FEATURES = {
  completion: true,
  hover: true,
  definition: true,
  diagnostics: true,
  formatting: true,
  symbols: true,
  django: true,
};
