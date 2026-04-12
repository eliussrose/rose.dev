/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description LSP Type Definitions for Kora AI IDE
 */

// Position in a text document
export interface Position {
  line: number;
  character: number;
}

// Range in a text document
export interface Range {
  start: Position;
  end: Position;
}

// Completion item kinds
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

// Completion item
export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkupContent;
  insertText?: string;
  sortText?: string;
  filterText?: string;
}

// Markup content
export interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}

// Diagnostic severity
export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

// Diagnostic
export interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  code?: string | number;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}

// Diagnostic related information
export interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}

// Location
export interface Location {
  uri: string;
  range: Range;
}

// Hover
export interface Hover {
  contents: MarkupContent | MarkupContent[];
  range?: Range;
}

// Symbol kind
export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

// Document symbol
export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

// Workspace symbol
export interface WorkspaceSymbol {
  name: string;
  kind: SymbolKind;
  location: Location;
  containerName?: string;
}

// Server capabilities
export interface ServerCapabilities {
  completionProvider?: {
    triggerCharacters?: string[];
    resolveProvider?: boolean;
  };
  hoverProvider?: boolean;
  definitionProvider?: boolean;
  documentSymbolProvider?: boolean;
  workspaceSymbolProvider?: boolean;
  documentFormattingProvider?: boolean;
  diagnosticProvider?: boolean;
}

// Server info
export interface ServerInfo {
  pid: number;
  version: string;
  capabilities: ServerCapabilities;
}

// LSP message
export interface LSPMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: any;
}

// LSP response
export interface LSPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: LSPError;
}

// LSP error
export interface LSPError {
  code: number;
  message: string;
  data?: any;
}

// Workspace configuration
export interface WorkspaceConfig {
  pythonPath: string;
  workspaceRoot: string;
  enableLSP: boolean;
  formatOnSave: boolean;
  lspServerPath?: string;
  diagnosticsEnabled: boolean;
  completionEnabled: boolean;
  hoverEnabled: boolean;
  definitionEnabled: boolean;
}

// LSP connection status
export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

// LSP client events
export interface LSPClientEvents {
  onDiagnostics: (uri: string, diagnostics: Diagnostic[]) => void;
  onServerError: (error: Error) => void;
  onConnectionStatusChange: (status: ConnectionStatus) => void;
}
