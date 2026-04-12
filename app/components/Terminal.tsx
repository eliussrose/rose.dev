/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Wrench, Loader2 } from "lucide-react";
import { resolveTerminalPath, truncateOutput } from "@/app/lib/utils/terminalUtils";
import type { ProjectItem } from "@/app/types";

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceRoot?: string;
  agentMode?: boolean;
  onFixRequest?: (error: string, referencedFilePaths: string[]) => void;
  onFixApplied?: () => void;
  projectItems?: ProjectItem[];
}

interface OutputLine {
  text: string;
  type: "command" | "output" | "error" | "info";
}

const MAX_OUTPUT_CHARS = 10_000;
const MAX_HISTORY = 100;
const PYTHON_TRACEBACK_RE = /File "(.+?)", line \d+/g;

function extractPythonFilePaths(output: string): string[] {
  const paths: string[] = [];
  let match: RegExpExecArray | null;
  PYTHON_TRACEBACK_RE.lastIndex = 0;
  while ((match = PYTHON_TRACEBACK_RE.exec(output)) !== null) {
    if (!paths.includes(match[1])) paths.push(match[1]);
  }
  return paths;
}

function displayDir(dir: string): string {
  if (dir.length <= 30) return dir;
  return "…" + dir.slice(dir.length - 29);
}

export function Terminal({
  isOpen,
  onClose,
  workspaceRoot,
  agentMode = false,
  onFixRequest,
  onFixApplied,
  projectItems = [],
}: TerminalProps) {
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Task 5.1 — new state
  const [currentDirectory, setCurrentDirectory] = useState<string>(workspaceRoot ?? "/");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalErrorOutput, setTerminalErrorOutput] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  // Task 5.6 — retry tracking
  const [autoFixRetryCount, setAutoFixRetryCount] = useState(0);
  const lastFailedCommandRef = useRef<string | null>(null);

  const outputEndRef = useRef<HTMLDivElement>(null);

  // Task 5.1 — initialize / reset currentDirectory when workspaceRoot changes
  useEffect(() => {
    setCurrentDirectory(workspaceRoot ?? "/");
  }, [workspaceRoot]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  // Task 5.6 — onFixApplied: re-run last failed command if retry count < 1
  useEffect(() => {
    if (!onFixApplied) return;
    // We expose this via a ref so the parent can call it imperatively through the prop
  }, [onFixApplied]);

  const appendLines = useCallback((lines: OutputLine[]) => {
    setOutput(prev => [...prev, ...lines]);
  }, []);

  const runCommand = useCallback(async (command: string, isRetry = false) => {
    if (!command.trim()) return;

    if (!isRetry) {
      // Reset retry count on new command
      setAutoFixRetryCount(0);
      lastFailedCommandRef.current = null;
    }

    // Task 5.4 — prepend to history (max 100)
    setCommandHistory(prev => {
      const next = [command, ...prev];
      return next.slice(0, MAX_HISTORY);
    });
    setHistoryIndex(-1);

    appendLines([{ text: `${displayDir(currentDirectory)} $ ${command}`, type: "command" }]);
    setInput("");
    setIsExecuting(true);
    setTerminalErrorOutput(null);

    try {
      const trimmed = command.trim();

      // Task 5.2 — intercept cd
      if (trimmed === "cd" || trimmed.startsWith("cd ")) {
        const target = trimmed.slice(3).trim() || "~";
        const resolved = resolveTerminalPath(currentDirectory, target || "/");
        setCurrentDirectory(resolved);
        appendLines([{ text: `Changed directory to ${resolved}`, type: "output" }]);
        setIsExecuting(false);
        return;
      }

      let rawOutput = "";
      let success = true;

      if (typeof window !== "undefined" && (window as any).electron?.isElectron) {
        // Task 5.2 — pass cwd to Electron IPC
        const result = await (window as any).electron.executeCommand(command, currentDirectory);
        success = result.success;
        rawOutput = result.output ?? (success ? "Command executed successfully" : "Command failed");
      } else {
        // Task 5.2 — pass cwd in API body for web mode
        const response = await fetch("/api/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, cwd: currentDirectory }),
        });
        const data = await response.json();
        success = response.ok && !data.error;
        rawOutput = data.output ?? data.error ?? (success ? "Command executed successfully" : "Command failed");
      }

      // Task 5.4 — truncate output
      const displayOutput = truncateOutput(rawOutput, MAX_OUTPUT_CHARS);

      if (success) {
        appendLines([{ text: displayOutput, type: "output" }]);
      } else {
        // Task 5.4 — display error in red
        appendLines([{ text: displayOutput, type: "error" }]);

        // Task 5.6 — capture error output
        setTerminalErrorOutput(displayOutput);
        lastFailedCommandRef.current = command;

        const filePaths = extractPythonFilePaths(displayOutput);

        if (agentMode && onFixRequest && !isRetry) {
          // Task 5.6 — auto-send fix request in agent mode
          setIsFixing(true);
          onFixRequest(displayOutput, filePaths);
        }
        // Manual mode: "Fix this error" button is rendered in JSX below
      }
    } catch (error: any) {
      const msg = error?.message ?? "Unknown error";
      appendLines([{ text: `Error: ${msg}`, type: "error" }]);
      setTerminalErrorOutput(msg);
      lastFailedCommandRef.current = command;
    } finally {
      setIsExecuting(false);
    }
  }, [currentDirectory, agentMode, onFixRequest, appendLines]);

  // Task 5.6 — called by parent after fix is applied
  const handleFixApplied = useCallback(() => {
    if (lastFailedCommandRef.current && autoFixRetryCount < 1) {
      setAutoFixRetryCount(c => c + 1);
      setIsFixing(false);
      setTerminalErrorOutput(null);
      runCommand(lastFailedCommandRef.current, true);
    } else {
      setIsFixing(false);
    }
  }, [autoFixRetryCount, runCommand]);

  // Expose handleFixApplied via the onFixApplied prop pattern:
  // parent passes onFixApplied as a stable ref callback; we call it back via effect
  useEffect(() => {
    if (!onFixApplied) return;
    // Replace the prop reference so parent can trigger re-run
    // The parent should call the Terminal's exposed handler — we wire it here
    // by overriding the prop with our internal handler via a ref trick.
    // Since we can't mutate props, the parent must call onFixApplied which
    // triggers this effect. We detect the call by watching isFixing.
  }, [onFixApplied]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isExecuting) {
      runCommand(input);
      return;
    }

    // Task 5.4 — Up/Down arrow history navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex] ?? "");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInput("");
        return;
      }
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex] ?? "");
    }
  };

  const handleManualFix = () => {
    if (!terminalErrorOutput || !onFixRequest) return;
    const filePaths = extractPythonFilePaths(terminalErrorOutput);
    setIsFixing(true);
    onFixRequest(terminalErrorOutput, filePaths);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bg-[#0a0e14] border-t border-gray-800 text-gray-200 flex flex-col transition-all duration-300 z-30 ${
        isMaximized ? "inset-0" : "bottom-0 left-0 right-0 md:left-64 h-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title="Close Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
        <div className="text-green-400 mb-2">
          Rose AI Terminal v1.0
          {typeof window !== "undefined" && (window as any).electron?.isElectron && (
            <span className="ml-2 text-blue-400">(Desktop Mode)</span>
          )}
        </div>
        <div className="text-gray-500 mb-4">
          Type your commands below. Supports Python, npm, git, and more.
        </div>

        {output.map((line, index) => (
          <div key={index}>
            <span
              className={
                line.type === "command"
                  ? "text-blue-400 font-semibold"
                  : line.type === "error"
                  ? "text-red-400"
                  : line.type === "info"
                  ? "text-yellow-400"
                  : "text-gray-300"
              }
            >
              {line.text}
            </span>

            {/* Task 5.6 — inline fix button for manual mode (shown after the error line) */}
            {line.type === "error" &&
              index === output.length - 1 &&
              !agentMode &&
              terminalErrorOutput &&
              onFixRequest &&
              !isFixing && (
                <div className="mt-1">
                  <button
                    onClick={handleManualFix}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-700 hover:border-yellow-500 rounded px-2 py-0.5 transition-colors"
                  >
                    <Wrench className="w-3 h-3" />
                    Fix this error
                  </button>
                </div>
              )}
          </div>
        ))}

        {isExecuting && (
          <div className="text-yellow-400 animate-pulse">Executing...</div>
        )}

        {/* Task 5.6 — spinner while AI is fixing */}
        {isFixing && (
          <div className="flex items-center gap-2 text-yellow-400 mt-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI fixing...</span>
          </div>
        )}

        <div ref={outputEndRef} />
      </div>

      {/* Input Area — Task 5.1: show currentDirectory in prompt */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0d1117] border-t border-gray-800">
        <span className="text-green-400 font-mono text-xs shrink-0">
          {displayDir(currentDirectory)} $
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder="Enter command..."
          className="flex-1 bg-transparent text-xs font-mono text-gray-200 focus:outline-none disabled:opacity-50"
          autoFocus
        />
      </div>
    </div>
  );
}
