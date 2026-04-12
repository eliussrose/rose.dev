/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { HfInference } from "@huggingface/inference";
import { Sidebar } from "./components/Sidebar";
import { EditorSection } from "./components/EditorSection";
import { ChatSection } from "./components/ChatSection";
import { Terminal } from "./components/Terminal";
import { ProjectAnalyzer } from "./components/ProjectAnalyzer";
import { GitHubPanel } from "./components/GitHubPanel";
import AdvancedFeaturesPanel from "./components/AdvancedFeaturesPanel";
import { ProjectItem, ChatSession, Message, PendingEdit } from "./types";
import { IMAGE_MODEL_ID, SYSTEM_PROMPT, AGENT_SYSTEM_PROMPT, MONACO_LANGUAGE_MAPPING } from "./constants";
import { callAI } from "./lib/ai";
import { estimateTokens } from "./lib/utils/tokenEstimator";

export default function ChatApp() {
  const [provider, setProvider] = useState<string>("huggingface");
  const [token, setToken] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [chatMode, setChatMode] = useState<"chat" | "image">("chat");
  const [agentMode, setAgentMode] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [referencedFileIds, setReferencedFileIds] = useState<string[]>([]);
  const [savedContents, setSavedContents] = useState<Record<string, string>>({});
  const [contextTokenCount, setContextTokenCount] = useState<number>(0);
  const [showApiSettings, setShowApiSettings] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokensState, setMaxTokensState] = useState<number>(4000);
  const [mobileView, setMobileView] = useState<"chat" | "editor">("chat");
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [showAnalyzer, setShowAnalyzer] = useState<boolean>(false);
  const [showGitHub, setShowGitHub] = useState<boolean>(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState<boolean>(false);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | undefined>(undefined);
  const terminalFixAppliedRef = useRef<(() => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const activeFile = projectItems.find(item => item.id === activeFileId);

  const isElectron = typeof window !== "undefined" && !!(window as any).electron?.isElectron;

  const setActiveFileHandler = (id: string) => {
    setActiveFileId(id);
    if (!openFileIds.includes(id)) setOpenFileIds(prev => [...prev, id]);
    if (window.innerWidth < 768) { setMobileView("editor"); setIsSidebarOpen(false); }
  };

  const closeFileHandler = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenFileIds(prev => {
      const next = prev.filter(fid => fid !== id);
      if (activeFileId === id) setActiveFileId(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  useEffect(() => {
    const savedProvider = localStorage.getItem("api_provider") || "huggingface";
    const savedToken = localStorage.getItem("api_token") || "";
    const savedModel = localStorage.getItem("api_model") || "";
    const savedBaseUrl = localStorage.getItem("api_base_url") || "";
    const savedSessions = localStorage.getItem("hf_sessions");
    const savedItems = localStorage.getItem("hf_project_items");
    const savedTemp = localStorage.getItem("hf_temp");
    const savedMaxTokens = localStorage.getItem("hf_max_tokens");
    const savedAgentMode = localStorage.getItem("agent_mode");

    setProvider(savedProvider);
    setToken(savedToken);
    setModelId(savedModel);
    setBaseUrl(savedBaseUrl);
    if (savedTemp) setTemperature(parseFloat(savedTemp));
    if (savedMaxTokens) setMaxTokensState(parseInt(savedMaxTokens));
    if (savedItems) setProjectItems(JSON.parse(savedItems));
    if (savedAgentMode) setAgentMode(savedAgentMode === "true");

    if (savedSessions) {
      const parsed = JSON.parse(savedSessions) as ChatSession[];
      if (parsed.length > 0) {
        const updated = parsed.map(s => ({ ...s, pendingEdits: s.pendingEdits || [] }));
        setSessions(updated);
        setCurrentSessionId(updated[0].id);
        return;
      }
    }
    createNewChat();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem("hf_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("hf_project_items", JSON.stringify(projectItems));
  }, [projectItems]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMonacoLanguage = (ext: string | undefined) =>
    ext ? MONACO_LANGUAGE_MAPPING[ext.toLowerCase()] || "plaintext" : "plaintext";

  const saveSettings = () => {
    if (provider !== "ollama" && !token) { alert("Please provide the API Token!"); return; }
    if (!modelId) { alert("Please provide the Model ID!"); return; }
    localStorage.setItem("api_provider", provider);
    localStorage.setItem("api_token", token);
    localStorage.setItem("api_model", modelId);
    localStorage.setItem("api_base_url", baseUrl);
    localStorage.setItem("hf_temp", temperature.toString());
    localStorage.setItem("hf_max_tokens", maxTokensState.toString());
    alert("Settings saved!");
  };

  const toggleAgentMode = () => {
    const next = !agentMode;
    setAgentMode(next);
    localStorage.setItem("agent_mode", String(next));
  };

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId, title: "New Chat", messages: [], pendingEdits: [], createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setReferencedFileIds([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
  };

  // Open folder from disk via Electron native dialog
  const openFolderFromDisk = async () => {
    if (!isElectron) return;
    const result = await (window as any).electron.openFolder();
    if (!result.success || result.canceled) return;
    setProjectItems(result.items);
    setWorkspaceRoot(result.folderPath);
    // Track saved contents for all files opened from disk
    const initialSaved: Record<string, string> = {};
    result.items.forEach((i: ProjectItem) => {
      if (i.type === "file") initialSaved[i.id] = i.content ?? "";
    });
    setSavedContents(initialSaved);
    const firstFile = result.items.find((i: ProjectItem) => i.type === "file");
    if (firstFile) setActiveFileHandler(firstFile.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const relativePath = (file as any).webkitRelativePath || file.name;
        const extension = file.name.split('.').pop() || 'txt';
        const pathParts = relativePath.split('/');
        let currentPath = "";
        pathParts.forEach((part: string, index: number) => {
          const isLast = index === pathParts.length - 1;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          setProjectItems(prev => {
            const exists = prev.some(item => item.path === currentPath);
            if (!exists) {
              return [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                name: part, type: isLast ? "file" : "folder",
                path: currentPath, content: isLast ? content : undefined,
                language: isLast ? extension : undefined, isOpen: true,
              }];
            } else if (isLast) {
              return prev.map(item => item.path === currentPath ? { ...item, content } : item);
            }
            return prev;
          });
        });
      };
      reader.readAsText(file);
    });
  };

  const createNewItem = (type: "file" | "folder", parentPath?: string) => {
    const name = prompt(`Enter name for new ${type}:`);
    if (!name) return;
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    setProjectItems(prev => {
      if (prev.some(i => i.path === fullPath)) { alert("Already exists!"); return prev; }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name, type, path: fullPath,
        content: type === "file" ? "" : undefined,
        language: type === "file" ? name.split('.').pop() : undefined,
        isOpen: true,
      }];
    });
  };

  const removeItem = (path: string) => {
    if (!confirm("Delete this?")) return;
    setProjectItems(prev => prev.filter(item => !item.path.startsWith(path)));
  };

  // ── Disk-synced file operations (Electron) ────────────────────────────────

  const handleCreateFile = async (parentPath: string) => {
    const name = prompt("Enter file name:");
    if (!name) return;
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    if (projectItems.some(i => i.path === fullPath)) { alert("Already exists!"); return; }

    if (isElectron && workspaceRoot) {
      const diskPath = `${workspaceRoot}/${fullPath}`;
      const result = await (window as any).electron.writeFile(diskPath, "");
      if (!result?.success) { alert(result?.error || "Failed to create file"); return; }
      const newItem: ProjectItem = {
        id: Math.random().toString(36).substr(2, 9),
        name, type: "file", path: fullPath, content: "",
        language: name.split(".").pop(), isOpen: true, diskPath,
      };
      setProjectItems(prev => [...prev, newItem]);
      setSavedContents(prev => ({ ...prev, [newItem.id]: "" }));
    } else {
      createNewItem("file", parentPath || undefined);
    }
  };

  const handleCreateFolder = async (parentPath: string) => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    if (projectItems.some(i => i.path === fullPath)) { alert("Already exists!"); return; }

    if (isElectron && workspaceRoot) {
      const diskPath = `${workspaceRoot}/${fullPath}`;
      const result = await (window as any).electron.createDirectory(diskPath);
      if (!result?.success) { alert(result?.error || "Failed to create folder"); return; }
      setProjectItems(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name, type: "folder", path: fullPath, isOpen: true,
      }]);
    } else {
      createNewItem("folder", parentPath || undefined);
    }
  };

  const handleRenameItem = async (item: ProjectItem) => {
    const newName = prompt("Enter new name:", item.name);
    if (!newName || newName === item.name) return;

    const oldPath = item.path;
    const parentDir = oldPath.includes("/") ? oldPath.substring(0, oldPath.lastIndexOf("/")) : "";
    const newPath = parentDir ? `${parentDir}/${newName}` : newName;

    if (isElectron && workspaceRoot && item.diskPath) {
      const oldDisk = item.diskPath;
      const newDisk = oldDisk.substring(0, oldDisk.lastIndexOf("/") + 1) + newName;
      const result = await (window as any).electron.renamePath(oldDisk, newDisk);
      if (!result?.success) { alert(result?.error || "Failed to rename"); return; }
      setProjectItems(prev => prev.map(i => {
        if (i.path === oldPath) {
          return { ...i, name: newName, path: newPath, diskPath: newDisk };
        }
        // Update descendants
        if (i.path.startsWith(oldPath + "/")) {
          const rest = i.path.slice(oldPath.length);
          const newDescPath = newPath + rest;
          const newDescDisk = i.diskPath
            ? newDisk + i.diskPath.slice(oldDisk.length)
            : undefined;
          return { ...i, path: newDescPath, diskPath: newDescDisk };
        }
        return i;
      }));
    } else {
      setProjectItems(prev => prev.map(i => {
        if (i.path === oldPath) return { ...i, name: newName, path: newPath };
        if (i.path.startsWith(oldPath + "/")) {
          return { ...i, path: newPath + i.path.slice(oldPath.length) };
        }
        return i;
      }));
    }
  };

  const handleDeleteItem = async (path: string) => {
    if (!confirm(`Delete "${path}"?`)) return;
    const item = projectItems.find(i => i.path === path);

    if (isElectron && item?.diskPath) {
      const result = await (window as any).electron.deleteFile(item.diskPath);
      if (!result?.success) { alert(result?.error || "Failed to delete"); return; }
    }
    setProjectItems(prev => prev.filter(i => !i.path.startsWith(path)));
  };

  const toggleFolder = (path: string) => {
    setProjectItems(prev => prev.map(item => item.path === path ? { ...item, isOpen: !item.isOpen } : item));
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFileId) return;
    setProjectItems(prev => prev.map(item => item.id === activeFileId ? { ...item, content: value || "" } : item));
  };

  // Save active file to disk (Electron only)
  const saveFileToDisk = async () => {
    if (!isElectron || !activeFile?.diskPath) return;
    const result = await (window as any).electron.saveFileToDisk(activeFile.diskPath, activeFile.content || "");
    if (result?.success) {
      setSavedContents(prev => ({ ...prev, [activeFile.id]: activeFile.content || "" }));
    }
  };

  const handleAcceptEdit = (editId: string) => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const edit = (session.pendingEdits || []).find(e => e.id === editId);
    if (!edit) return;
    setProjectItems(prev => prev.map(item => item.id === edit.fileId ? { ...item, content: edit.newContent } : item));
    // Auto-save to disk if Electron
    if (isElectron) {
      const file = projectItems.find(f => f.id === edit.fileId);
      if (file?.diskPath) {
        (window as any).electron.saveFileToDisk(file.diskPath, edit.newContent);
      }
    }
    setSessions(prev => prev.map(s => s.id !== currentSessionId ? s : {
      ...s,
      pendingEdits: (s.pendingEdits || []).map(e => e.id === editId ? { ...e, status: "accepted" } : e),
    }));
  };

  const handleRejectEdit = (editId: string) => {
    setSessions(prev => prev.map(s => s.id !== currentSessionId ? s : {
      ...s,
      pendingEdits: (s.pendingEdits || []).map(e => e.id === editId ? { ...e, status: "rejected" } : e),
    }));
  };

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Your browser does not support voice input."); return; }
    if (isListening) { setIsListening(false); return; }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setInput(prev => prev + event.results[0][0].transcript);
    recognition.start();
  };

  // Parse AI response for EDIT blocks and return messages + edits
  const parseAIResponse = (rawContent: string, currentProjectItems: ProjectItem[]) => {
    const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const editRegex = /<<<<EDIT_START:?\s*(.*?)\s*>>>>([\s\S]*?)<<<<EDIT_END>>>>/gi;
    let match;
    const parsedMessages: Message[] = [];
    const newEdits: PendingEdit[] = [];
    let lastIndex = 0;

    while ((match = editRegex.exec(cleanContent)) !== null) {
      const textBefore = cleanContent.substring(lastIndex, match.index).trim();
      if (textBefore) parsedMessages.push({ role: "assistant", content: textBefore });

      const filePath = match[1].trim();
      const newFileContent = match[2].trim();
      const file = currentProjectItems.find(item => item.path === filePath || item.name === filePath);

      if (file) {
        const editId = Math.random().toString(36).substr(2, 9);
        newEdits.push({ id: editId, fileId: file.id, originalContent: file.content || "", newContent: newFileContent, status: "pending" });
        parsedMessages.push({ role: "assistant", content: `Suggested edit for ${file.path}`, type: "diff", editId });
        setActiveFileId(file.id);
      }
      lastIndex = editRegex.lastIndex;
    }

    const remaining = cleanContent.substring(lastIndex).trim();
    if (remaining || parsedMessages.length === 0) {
      parsedMessages.push({ role: "assistant", content: remaining || cleanContent, isTyping: true });
    }

    return { parsedMessages, newEdits };
  };

  // Ref to track the streaming message id to avoid stale closure issues
  const streamingMsgIdRef = useRef<string | null>(null);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !modelId || !currentSessionId) {
      if (!modelId) { setShowApiSettings(true); alert("Please save Model ID from API Settings!"); }
      return;
    }
    if (provider !== "ollama" && !token) {
      setShowApiSettings(true); alert("Please save Token from API Settings!"); return;
    }

    const currentInput = input;
    const sessionId = currentSessionId;
    setInput("");
    const userMsg: Message = { role: "user", content: currentInput };
    const newMessages = [...messages, userMsg];

    setSessions(prev => prev.map(s => s.id !== sessionId ? s : {
      ...s,
      messages: newMessages,
      title: s.messages.length === 0 ? currentInput.slice(0, 30) + (currentInput.length > 30 ? "..." : "") : s.title,
    }));

    setIsLoading(true);

    try {
      // ── Image generation ──────────────────────────────────────────────────
      if (chatMode === "image") {
        if (provider !== "huggingface") {
          setSessions(prev => prev.map(s => s.id !== sessionId ? s : {
            ...s, messages: [...s.messages, { role: "assistant", content: "Image generation is only available with Hugging Face provider." }],
          }));
          return;
        }
        const hf = new HfInference(token);
        const blocked = ["nude","naked","porn","sex","sexy","nsfw","bikini","lingerie","hentai","xxx","trump","biden","putin","obama","modi","musk","zuckerberg"];
        if (blocked.some(w => currentInput.toLowerCase().includes(w))) {
          setSessions(prev => prev.map(s => s.id !== sessionId ? s : {
            ...s, messages: [...s.messages, { role: "assistant", content: "Sorry, I cannot generate this type of image." }],
          }));
          return;
        }
        const blob = await hf.textToImage({ model: IMAGE_MODEL_ID, inputs: currentInput });
        const reader = new FileReader();
        reader.readAsDataURL(blob as any);
        reader.onloadend = () => {
          setSessions(prev => prev.map(s => s.id !== sessionId ? s : {
            ...s, messages: [...s.messages, { role: "assistant", content: `Generated: "${currentInput}"`, type: "image", imageUrl: reader.result as string }],
          }));
        };
        return;
      }

      // ── Build context ─────────────────────────────────────────────────────
      const openFiles = projectItems.filter(item => item.type === "file" && openFileIds.includes(item.id));
      let contextFiles: ProjectItem[];
      if (referencedFileIds.length > 0) {
        contextFiles = projectItems.filter(item => referencedFileIds.includes(item.id));
      } else {
        contextFiles = openFiles;
      }

      const contextBlock = contextFiles.length > 0
        ? `\n\n<context>\n${contextFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join("\n\n")}\n</context>`
        : "";

      const contextTokenCount = estimateTokens(contextBlock);
      setContextTokenCount(contextTokenCount);

      const projectFileContext = contextBlock;

      const referencedFileContext = referencedFileIds.length > 0
        ? "\n\nUser is specifically referring to these files:\n" +
          projectItems.filter(item => referencedFileIds.includes(item.id)).map(f => f.path).join(", ")
        : "";

      const systemPromptToUse = agentMode ? AGENT_SYSTEM_PROMPT : SYSTEM_PROMPT;
      const fullSystemPrompt = projectFileContext + referencedFileContext + "\n\n" + systemPromptToUse;

      // ── Streaming onChunk callback ────────────────────────────────────────
      // Reset streaming ref for this new request
      streamingMsgIdRef.current = null;

      const onChunk = (chunk: string) => {
        setSessions(prev => {
          const session = prev.find(s => s.id === sessionId);
          if (!session) return prev;

          // First chunk: create the streaming message
          if (streamingMsgIdRef.current === null) {
            const msgId = Date.now().toString() + Math.random().toString(36).slice(2);
            streamingMsgIdRef.current = msgId;
            const streamingMsg: Message = {
              role: "assistant",
              content: chunk,
              isStreaming: true,
            };
            return prev.map(s => s.id !== sessionId ? s : {
              ...s,
              messages: [...s.messages, streamingMsg],
            });
          }

          // Subsequent chunks: append to the last assistant message
          return prev.map(s => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant" && msgs[lastIdx].isStreaming) {
              msgs[lastIdx] = { ...msgs[lastIdx], content: msgs[lastIdx].content + chunk };
            }
            return { ...s, messages: msgs };
          });
        });
      };

      // ── Call AI with streaming ────────────────────────────────────────────
      const rawContent = await callAI({
        provider: provider as any,
        token,
        modelId,
        baseUrl,
        temperature,
        maxTokens: maxTokensState,
        systemPrompt: fullSystemPrompt,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        onChunk,
      });

      if (!rawContent) throw new Error("No response received from the model.");

      // ── Streaming complete: parse EDIT blocks and finalize message ─────────
      const { parsedMessages, newEdits } = parseAIResponse(rawContent, projectItems);

      // If we streamed, replace the streaming message with parsed output
      // If no chunks arrived (e.g. provider fell back to non-streaming), just append
      const didStream = streamingMsgIdRef.current !== null;

      if (agentMode && newEdits.length > 0) {
        newEdits.forEach(edit => {
          setProjectItems(prev => prev.map(item => item.id === edit.fileId ? { ...item, content: edit.newContent } : item));
          if (isElectron) {
            const file = projectItems.find(f => f.id === edit.fileId);
            if (file?.diskPath) (window as any).electron.saveFileToDisk(file.diskPath, edit.newContent);
          }
        });
        const autoAccepted = newEdits.map(e => ({ ...e, status: "accepted" as const }));
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          const msgs = didStream
            // Remove the in-progress streaming message, replace with parsed
            ? [...s.messages.slice(0, -1), ...parsedMessages]
            : [...s.messages, ...parsedMessages];
          return { ...s, messages: msgs, pendingEdits: [...(s.pendingEdits || []), ...autoAccepted] };
        }));
      } else {
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          const msgs = didStream
            ? [...s.messages.slice(0, -1), ...parsedMessages]
            : [...s.messages, ...parsedMessages];
          return { ...s, messages: msgs, pendingEdits: [...(s.pendingEdits || []), ...newEdits] };
        }));
      }

      streamingMsgIdRef.current = null;
      setReferencedFileIds([]);
    } catch (error: any) {      // On network error mid-stream: append error notice to partial message or add new error message
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s;
        const msgs = [...s.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant" && msgs[lastIdx].isStreaming) {
          // Append error notice to partial streaming message and stop streaming
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: msgs[lastIdx].content + `\n\n⚠️ Stream interrupted: ${error?.message || "Network error"}`,
            isStreaming: false,
          };
          return { ...s, messages: msgs };
        }
        return { ...s, messages: [...msgs, { role: "assistant", content: error?.message || "Unknown error" }] };
      }));
      streamingMsgIdRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans overflow-hidden bg-[#0d1117] text-white transition-colors duration-300 dark">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        projectItems={projectItems}
        toggleFolder={toggleFolder}
        removeItem={removeItem}
        createNewItem={createNewItem}
        setActiveFileId={setActiveFileHandler}
        setReferencedFileIds={setReferencedFileIds}
        referencedFileIds={referencedFileIds}
        activeFileId={activeFileId}
        sessions={sessions}
        setCurrentSessionId={setCurrentSessionId}
        currentSessionId={currentSessionId}
        deleteSession={deleteSession}
        showApiSettings={showApiSettings}
        setShowApiSettings={setShowApiSettings}
        token={token}
        setToken={setToken}
        modelId={modelId}
        setModelId={setModelId}
        provider={provider}
        setProvider={setProvider}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        saveSettings={saveSettings}
        fileInputRef={fileInputRef}
        folderInputRef={folderInputRef}
        handleFileUpload={handleFileUpload}
        setProjectItems={setProjectItems}
        isElectron={isElectron}
        openFolderFromDisk={openFolderFromDisk}
        agentMode={agentMode}
        toggleAgentMode={toggleAgentMode}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onRename={handleRenameItem}
        onDelete={handleDeleteItem}
        workspaceRoot={workspaceRoot}
      />

      <div className={`flex-1 overflow-hidden relative ${mobileView === "editor" ? "flex" : "hidden"} md:flex`}>
        <EditorSection
          activeFile={activeFile}
          openFiles={projectItems.filter(f => openFileIds.includes(f.id))}
          setActiveFileId={setActiveFileHandler}
          closeFile={closeFileHandler}
          getMonacoLanguage={getMonacoLanguage}
          handleEditorChange={handleEditorChange}
          pendingEdits={currentSession?.pendingEdits || []}
          handleAcceptEdit={handleAcceptEdit}
          handleRejectEdit={handleRejectEdit}
          isElectron={isElectron}
          saveFileToDisk={saveFileToDisk}
          savedContents={savedContents}
          setSavedContents={setSavedContents}
        />

        <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
          <button onClick={() => setShowAdvancedFeatures(true)}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors" title="Advanced Features">
            <span className="text-xl">🚀</span>
          </button>
          <button onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors" title="Toggle Terminal">
            <span className="text-xl">⌨️</span>
          </button>
          <button onClick={() => setMobileView("chat")}
            className="md:hidden bg-yellow-500 text-[#0a233b] p-3 rounded-full shadow-lg">
            <span className="text-xl">💬</span>
          </button>
        </div>
      </div>

      <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex w-full md:w-80 lg:w-96 flex-shrink-0 h-full`}>
        <ChatSection
          messages={messages}
          currentSession={currentSession}
          handleAcceptEdit={handleAcceptEdit}
          handleRejectEdit={handleRejectEdit}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          referencedFileIds={referencedFileIds}
          projectItems={projectItems}
          setReferencedFileIds={setReferencedFileIds}
          sendMessage={sendMessage}
          chatMode={chatMode}
          setChatMode={setChatMode}
          toggleListening={toggleListening}
          isListening={isListening}
          input={input}
          setInput={setInput}
          createNewChat={createNewChat}
          setIsSidebarOpen={setIsSidebarOpen}
          agentMode={agentMode}
          toggleAgentMode={toggleAgentMode}
          contextTokenCount={contextTokenCount}
        />
      </div>

      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        workspaceRoot={workspaceRoot}
        agentMode={agentMode}
        projectItems={projectItems}
        onFixRequest={async (errorOutput, filePaths) => {
          // Build a fix message and send to AI
          const referencedFiles = projectItems.filter(f =>
            filePaths.some(fp => f.diskPath === fp || f.path === fp || f.name === fp)
          );
          const fileContext = referencedFiles.length > 0
            ? "\n\nReferenced files:\n" + referencedFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join("\n\n")
            : "";
          const fixPrompt = `Fix the error shown in this terminal output:\n\n${errorOutput}${fileContext}`;
          // Inject as a user message and send
          setInput(fixPrompt);
          // Trigger send programmatically
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          // We need to call sendMessage with the fix prompt directly
          // Use a small workaround: set input then dispatch
          setTimeout(() => {
            const form = document.querySelector('form[data-terminal-fix]') as HTMLFormElement;
            if (form) form.requestSubmit();
          }, 50);
        }}
        onFixApplied={() => {
          if (terminalFixAppliedRef.current) terminalFixAppliedRef.current();
        }}
      />

      {showAnalyzer && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setShowAnalyzer(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#0d1117] rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <ProjectAnalyzer projectItems={projectItems} token={token} modelId={modelId} provider={provider} />
          </div>
        </div>
      )}

      {showGitHub && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setShowGitHub(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#0d1117] rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <GitHubPanel projectItems={projectItems} setProjectItems={setProjectItems} />
          </div>
        </div>
      )}

      {showAdvancedFeatures && (
        <AdvancedFeaturesPanel onClose={() => setShowAdvancedFeatures(false)} />
      )}
    </div>
  );
}
