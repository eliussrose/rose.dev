export interface ElectronAPI {
  isElectron: true;
  platform: string;

  executeCommand: (command: string, cwd?: string) => Promise<{ success: boolean; output: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  renamePath: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  openFolder: () => Promise<{
    success: boolean;
    canceled?: boolean;
    folderPath?: string;
    items?: import("../app/types").ProjectItem[];
  }>;
  saveFileToDisk: (diskPath: string, content: string) => Promise<{ success: boolean; error?: string }>;

  lsp: {
    start: (options: { workspaceRoot?: string; serverPath?: string; pythonPath?: string }) => Promise<any>;
    stop: () => Promise<any>;
    request: (method: string, params: any) => Promise<any>;
    notification: (method: string, params: any) => Promise<any>;
    status: () => Promise<{ success: boolean; isRunning: boolean }>;
    onNotification: (callback: (method: string, params: any) => void) => void;
    onServerExit: (callback: (code: number) => void) => void;
    onServerError: (callback: (error: string) => void) => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
