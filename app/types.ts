export interface ProjectItem {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  path: string;
  diskPath?: string; // Absolute path on disk (Electron only)
  isOpen?: boolean;
  inContext?: boolean;    // included in AI context window
  savedContent?: string; // last-saved disk content for unsaved indicator
}

export interface PendingEdit {
  id: string;
  fileId: string;
  originalContent: string;
  newContent: string;
  status: "pending" | "accepted" | "rejected";
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  isTyping?: boolean;
  isStreaming?: boolean; // token stream in progress
  type?: "text" | "image" | "diff" | "code-action";
  imageUrl?: string;
  editId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  pendingEdits: PendingEdit[];
  createdAt: number;
}

export type AIProvider =
  | "huggingface"
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "glm"
  | "ollama"
  | "custom";

export interface TerminalSession {
  currentDirectory: string;
  commandHistory: string[];   // max 100
  historyIndex: number;       // -1 = not browsing
  lastFailedCommand: string | null;
  lastErrorOutput: string | null;
  autoFixRetryCount: number;  // max 1
}

export interface ProviderSettings {
  token: string;
  modelId: string;
  baseUrl: string;
  temperature: number; // 0.0–2.0
  maxTokens: number;   // 256–32768
}

export interface GitFileStatus {
  path: string;
  status: "M" | "A" | "D" | "?" | "R"; // Modified, Added, Deleted, Untracked, Renamed
  staged: boolean;
}

export interface GitStatus {
  branch: string;
  files: GitFileStatus[];
  lastRefreshed: number;
}

// Keyed by file URI (file:///absolute/path)
export type DiagnosticsMap = Record<string, any[]>;

export interface SpecMeta {
  name: string;            // kebab-case feature name
  dirPath: string;         // .kiro/specs/<name>/
  hasRequirements: boolean;
  hasDesign: boolean;
  hasTasks: boolean;
}
