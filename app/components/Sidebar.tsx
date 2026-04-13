/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description This file is part of Kora AI - Premium Code Editor, a product of the Taskkora ecosystem.
 * Unauthorized copying, modification, or distribution of this file without the
 * explicit branding of "Taskkora" is strictly prohibited.
 */

import React, { RefObject, useState, useEffect } from "react";
import {
  Bot, Plus, X, FilePlus, FolderPlus, Plus as PlusIcon,
  Folder, Search, GitBranch, Zap, FolderOpen, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectTree } from "./ProjectTree";
import { ProjectAnalyzer } from "./ProjectAnalyzer";
import { GitHubPanel } from "./GitHubPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ProjectItem, ChatSession, AIProvider } from "../types";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  createNewChat: () => void;
  projectItems: ProjectItem[];
  toggleFolder: (path: string) => void;
  removeItem: (path: string) => void;
  createNewItem: (type: "file" | "folder", parentPath?: string) => void;
  setActiveFileId: (id: string) => void;
  setReferencedFileIds: (updater: (prev: string[]) => string[]) => void;
  referencedFileIds?: string[];
  activeFileId: string | null;
  sessions: ChatSession[];
  setCurrentSessionId: (id: string) => void;
  currentSessionId: string | null;
  deleteSession: (id: string, e: React.MouseEvent) => void;
  showApiSettings: boolean;
  setShowApiSettings: (show: boolean) => void;
  token: string;
  setToken: (token: string) => void;
  modelId: string;
  setModelId: (modelId: string) => void;
  provider: string;
  setProvider: (provider: string) => void;
  baseUrl: string;
  setBaseUrl: (baseUrl: string) => void;
  saveSettings: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setProjectItems?: (items: ProjectItem[] | ((prev: ProjectItem[]) => ProjectItem[])) => void;
  isElectron?: boolean;
  openFolderFromDisk?: () => void;
  agentMode?: boolean;
  toggleAgentMode?: () => void;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onRename?: (item: ProjectItem) => void;
  onDelete?: (path: string) => void;
  workspaceRoot?: string;
  activeTab?: "explorer" | "analyzer" | "github";
}

export const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  createNewChat,
  projectItems,
  toggleFolder,
  removeItem,
  createNewItem,
  setActiveFileId,
  setReferencedFileIds,
  referencedFileIds = [],
  activeFileId,
  sessions,
  setCurrentSessionId,
  currentSessionId,
  deleteSession,
  showApiSettings,
  setShowApiSettings,
  token,
  setToken,
  modelId,
  setModelId,
  provider,
  setProvider,
  baseUrl,
  setBaseUrl,
  saveSettings,
  fileInputRef,
  folderInputRef,
  handleFileUpload,
  setProjectItems,
  isElectron,
  openFolderFromDisk,
  agentMode,
  toggleAgentMode,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  workspaceRoot,
  activeTab: initialActiveTab = "explorer",
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<"explorer" | "analyzer" | "github">(initialActiveTab);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Update activeTab when prop changes
  React.useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "w-64 bg-[#0a233b] text-white flex flex-col h-full border-r border-gray-800 shadow-2xl transition-all duration-300 ease-in-out flex-shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-yellow-400 tracking-wider flex items-center gap-2">
              <Bot className="w-6 h-6" /> rose.dev
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-gray-600 hover:border-yellow-400 hover:text-yellow-400 transition-all py-2 rounded-xl text-xs font-medium group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> New Chat
          </button>

          {/* Agent Mode Toggle */}
          <button
            onClick={toggleAgentMode}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all border",
              agentMode
                ? "bg-yellow-400 text-[#0a233b] border-yellow-400 shadow-lg shadow-yellow-400/20"
                : "bg-transparent border-gray-600 text-gray-400 hover:border-yellow-400 hover:text-yellow-400"
            )}
            title="Agent Mode: AI auto-applies edits without confirmation"
          >
            <Zap className="w-4 h-4" />
            {agentMode ? "Agent Mode ON" : "Agent Mode OFF"}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-[#071829]/30">
          {(["explorer", "analyzer", "github"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1",
                activeTab === tab
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab === "explorer" && <Folder className="w-3.5 h-3.5" />}
              {tab === "analyzer" && <Search className="w-3.5 h-3.5" />}
              {tab === "github" && <GitBranch className="w-3.5 h-3.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "explorer" && (
          <>
            <div className="p-4 border-b border-gray-700 flex flex-col gap-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Files</h2>
                <div className="flex items-center gap-1">
                  {isElectron && openFolderFromDisk && (
                    <button onClick={openFolderFromDisk} className="p-1 text-gray-400 hover:text-yellow-400 transition-colors" title="Open Folder from Disk">
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => createNewItem("file")} className="p-1 text-gray-400 hover:text-blue-400 transition-colors" title="New File">
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => createNewItem("folder")} className="p-1 text-gray-400 hover:text-yellow-400 transition-colors" title="New Folder">
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-1 text-gray-400 hover:text-green-400 transition-colors" title="Upload File">
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => folderInputRef.current?.click()} className="p-1 text-gray-400 hover:text-orange-400 transition-colors" title="Upload Folder">
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden"
                  accept=".js,.ts,.jsx,.tsx,.py,.html,.css,.json,.md,.txt,.c,.cpp,.java,.go,.php,.rb" />
                <input type="file" ref={folderInputRef} onChange={handleFileUpload} className="hidden"
                  // @ts-ignore
                  webkitdirectory=""
                  // @ts-ignore
                  directory=""
                />
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar -ml-2">
                {projectItems.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-2">Empty</p>
                ) : (
                  <ProjectTree
                    items={projectItems}
                    onToggle={toggleFolder}
                    onRemove={removeItem}
                    onCreate={createNewItem}
                    onFileSelect={setActiveFileId}
                    onAddToContext={(id) => setReferencedFileIds(prev => prev.includes(id) ? prev : [...prev, id])}
                    onRemoveFromContext={(id) => setReferencedFileIds(prev => prev.filter(fid => fid !== id))}
                    onCreateFile={onCreateFile}
                    onCreateFolder={onCreateFolder}
                    onRename={onRename}
                    onDelete={onDelete}
                    activeFileId={activeFileId}
                    referencedFileIds={referencedFileIds}
                  />
                )}
              </div>
            </div>

            {/* Recent Chats */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Recent</h2>
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setCurrentSessionId(s.id)}
                    className={cn(
                      "group p-2 rounded-lg cursor-pointer truncate transition-all flex items-center justify-between",
                      currentSessionId === s.id
                        ? "bg-gray-700/50 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    )}
                  >
                    <span className="truncate text-[11px]">{s.title}</span>
                    <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "analyzer" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ProjectAnalyzer
              projectItems={projectItems}
              token={token}
              modelId={modelId}
              provider={provider}
            />
          </div>
        )}

        {activeTab === "github" && setProjectItems && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <GitHubPanel
              projectItems={projectItems}
              setProjectItems={setProjectItems}
              workspaceRoot={workspaceRoot}
            />
          </div>
        )}

        {/* Footer: active provider + gear icon */}
        <div className="p-3 border-t border-gray-700 bg-[#071829]/50 flex items-center justify-between">
          <div className="text-[10px] text-gray-500 truncate flex-1 mr-2">
            <span className="text-yellow-400">{provider}</span>
            {modelId && <span className="ml-1 text-gray-400">· {modelId.split("/").pop()}</span>}
          </div>
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="p-1.5 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-gray-800 flex-shrink-0"
            title="Provider Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettingsPanel && (
        <SettingsPanel
          activeProvider={provider as AIProvider}
          activeModelId={modelId}
          onClose={() => setShowSettingsPanel(false)}
          onApply={(newProvider, settings) => {
            setProvider(newProvider);
            setToken(settings.token);
            setModelId(settings.modelId);
            setBaseUrl(settings.baseUrl);
            localStorage.setItem("api_provider", newProvider);
            localStorage.setItem("api_token", settings.token);
            localStorage.setItem("api_model", settings.modelId);
            localStorage.setItem("api_base_url", settings.baseUrl);
            localStorage.setItem("hf_temp", settings.temperature.toString());
            localStorage.setItem("hf_max_tokens", settings.maxTokens.toString());
            setShowSettingsPanel(false);
          }}
        />
      )}
    </>
  );
};
