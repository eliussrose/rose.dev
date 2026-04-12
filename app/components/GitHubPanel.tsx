/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GitBranch, RefreshCw, Upload, Download, Check, X,
  Loader2, Plus, Minus, AlertCircle, GitCommit, Link,
} from "lucide-react";
import { ProjectItem, GitFileStatus } from "../types";
import { parseGitStatus } from "../lib/utils/gitUtils";

interface GitHubPanelProps {
  projectItems: ProjectItem[];
  setProjectItems: (items: ProjectItem[] | ((prev: ProjectItem[]) => ProjectItem[])) => void;
  workspaceRoot?: string;
}

const STATUS_COLORS: Record<string, string> = {
  M: "text-yellow-400",
  A: "text-green-400",
  D: "text-red-400",
  "?": "text-gray-400",
  R: "text-blue-400",
};

export function GitHubPanel({ projectItems, setProjectItems, workspaceRoot }: GitHubPanelProps) {
  const [branch, setBranch] = useState<string>("");
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [cloneUrl, setCloneUrl] = useState("");
  const [clonePath, setClonePath] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isElectron = typeof window !== "undefined" && !!(window as any).electron?.isElectron;

  const exec = useCallback(async (command: string): Promise<{ success: boolean; output: string }> => {
    if (!isElectron) return { success: false, output: "Not running in Electron" };
    return (window as any).electron.executeCommand(command, workspaceRoot);
  }, [isElectron, workspaceRoot]);

  const refresh = useCallback(async () => {
    if (!workspaceRoot) return;
    setError(null);
    try {
      const [branchRes, statusRes] = await Promise.all([
        exec("git branch --show-current"),
        exec("git status --porcelain"),
      ]);
      if (branchRes.success) setBranch(branchRes.output.trim());
      else setBranch("(unknown)");
      if (statusRes.success || statusRes.output) {
        setFiles(parseGitStatus(statusRes.output));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to get git status");
    }
  }, [exec, workspaceRoot]);

  useEffect(() => {
    if (!workspaceRoot) return;
    refresh();
    refreshTimerRef.current = setInterval(refresh, 30_000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [workspaceRoot, refresh]);

  const run = async (command: string, label: string) => {
    setIsLoading(true);
    setError(null);
    setOutput(null);
    const res = await exec(command);
    setIsLoading(false);
    if (!res.success) {
      setError(res.output || `${label} failed`);
    } else {
      setOutput(res.output || `${label} succeeded`);
      await refresh();
    }
  };

  const handleStageAll = () => run("git add -A", "Stage All");
  const handleStageFile = (path: string) => run(`git add "${path}"`, `Stage ${path}`);
  const handleCommit = async () => {
    if (!commitMessage.trim()) { setError("Commit message is required"); return; }
    await run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, "Commit");
    setCommitMessage("");
  };
  const handlePush = () => run("git push", "Push");
  const handlePull = () => run("git pull", "Pull");

  const handleClone = async () => {
    if (!cloneUrl.trim() || !clonePath.trim()) {
      setError("URL and local path are required");
      return;
    }
    setIsCloning(true);
    setError(null);
    const res = await exec(`git clone "${cloneUrl}" "${clonePath}"`);
    setIsCloning(false);
    if (!res.success) {
      setError(res.output || "Clone failed");
    } else {
      setOutput(`Cloned to ${clonePath}`);
      setCloneUrl("");
      setClonePath("");
    }
  };

  if (!isElectron) {
    return (
      <div className="p-4 text-xs text-gray-500 text-center">
        Git integration requires the desktop app.
      </div>
    );
  }

  if (!workspaceRoot) {
    return (
      <div className="p-4 text-xs text-gray-500 text-center">
        Open a folder to use Git integration.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      {/* Branch + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold">
          <GitBranch className="w-4 h-4 text-yellow-400" />
          <span>{branch || "—"}</span>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error / Output */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <pre className="whitespace-pre-wrap break-all">{error}</pre>
        </div>
      )}
      {output && !error && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex items-start gap-2">
          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <pre className="whitespace-pre-wrap break-all">{output}</pre>
        </div>
      )}

      {/* Changed Files */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Changes ({files.length})
          </span>
          {files.length > 0 && (
            <button
              onClick={handleStageAll}
              disabled={isLoading}
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> Stage All
            </button>
          )}
        </div>
        {files.length === 0 ? (
          <p className="text-gray-600 italic text-center py-2">No changes</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {files.map((f) => (
              <div key={f.path} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-800/50 group">
                <div className="flex items-center gap-2 truncate">
                  <span className={`font-mono font-bold w-4 text-center ${STATUS_COLORS[f.status] || "text-gray-400"}`}>
                    {f.status}
                  </span>
                  <span className="text-gray-300 truncate">{f.path}</span>
                  {f.staged && <span className="text-[9px] text-green-400 bg-green-400/10 px-1 rounded">staged</span>}
                </div>
                {!f.staged && (
                  <button
                    onClick={() => handleStageFile(f.path)}
                    disabled={isLoading}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-green-400 transition-all"
                    title="Stage file"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commit */}
      <div className="space-y-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-600"
        />
        <button
          onClick={handleCommit}
          disabled={isLoading || !commitMessage.trim()}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
          Commit
        </button>
      </div>

      {/* Push / Pull */}
      <div className="flex gap-2">
        <button
          onClick={handlePush}
          disabled={isLoading}
          className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" /> Push
        </button>
        <button
          onClick={handlePull}
          disabled={isLoading}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Pull
        </button>
      </div>

      {/* Clone */}
      <div className="border-t border-gray-800 pt-4 space-y-2">
        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Link className="w-3 h-3" /> Clone Repository
        </h4>
        <input
          type="text"
          value={cloneUrl}
          onChange={(e) => setCloneUrl(e.target.value)}
          placeholder="https://github.com/user/repo.git"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
        />
        <input
          type="text"
          value={clonePath}
          onChange={(e) => setClonePath(e.target.value)}
          placeholder="Local path (e.g. /home/user/projects/repo)"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
        />
        <button
          onClick={handleClone}
          disabled={isCloning || !cloneUrl.trim() || !clonePath.trim()}
          className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Clone
        </button>
      </div>
    </div>
  );
}
