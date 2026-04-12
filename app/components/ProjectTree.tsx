import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, File, MessageSquare, FilePlus, FolderPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectItem } from "../types";

interface ContextMenuState {
  x: number;
  y: number;
  item: ProjectItem;
}

interface ProjectTreeProps {
  items: ProjectItem[];
  onToggle: (path: string) => void;
  onRemove: (path: string) => void;
  onCreate: (type: "file" | "folder", parentPath?: string) => void;
  onFileSelect: (id: string) => void;
  onAddToContext: (id: string) => void;
  onRemoveFromContext?: (id: string) => void;
  onCreateFile?: (parentPath: string) => void;
  onCreateFolder?: (parentPath: string) => void;
  onRename?: (item: ProjectItem) => void;
  onDelete?: (path: string) => void;
  activeFileId: string | null;
  referencedFileIds?: string[];
  parentPath?: string;
}

export const ProjectTree = ({
  items,
  onToggle,
  onRemove,
  onCreate,
  onFileSelect,
  onAddToContext,
  onRemoveFromContext,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  activeFileId,
  referencedFileIds = [],
  parentPath = "",
}: ProjectTreeProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => closeMenu();
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleKeyDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick);
    };
  }, [contextMenu, closeMenu]);

  const handleContextMenu = (e: React.MouseEvent, item: ProjectItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const currentLevelItems = items.filter(item => {
    const relativePath = parentPath ? item.path.replace(`${parentPath}/`, "") : item.path;
    return !relativePath.includes("/");
  }).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });

  return (
    <div className="space-y-1 ml-2">
      {currentLevelItems.map((item) => {
        const inContext = referencedFileIds.includes(item.id);
        return (
          <div key={item.path} className="group">
            <div
              data-file-id={item.id}
              draggable={item.type === "file"}
              onDragStart={(e) => {
                if (item.type === "file") {
                  e.dataTransfer.setData("text/plain", `file_id:${item.id}`);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, item)}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors group/item",
                item.type === "file" && activeFileId === item.id
                  ? "bg-blue-500/20 text-blue-400"
                  : "hover:bg-gray-800/50"
              )}
            >
              <div
                className="flex items-center gap-2 flex-1 truncate"
                onClick={() => {
                  if (item.type === "folder") {
                    onToggle(item.path);
                  } else {
                    onFileSelect(item.id);
                  }
                }}
              >
                {item.type === "folder" ? (
                  <>
                    {item.isOpen ? (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                    <Folder className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                  </>
                ) : (
                  <>
                    <div className="w-3" />
                    <File className="w-4 h-4 text-blue-400 fill-blue-400/10" />
                  </>
                )}
                <span className="text-[11px] truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {item.type === "file" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inContext && onRemoveFromContext) {
                        onRemoveFromContext(item.id);
                      } else {
                        onAddToContext(item.id);
                      }
                    }}
                    className={cn(
                      "p-1 transition-colors",
                      inContext ? "text-yellow-400 opacity-100" : "hover:text-green-400"
                    )}
                    title={inContext ? "Remove from context" : "Add to context"}
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                )}
                {item.type === "folder" && (
                  <>
                    <button
                      onClick={() => onCreate("file", item.path)}
                      className="p-1 hover:text-blue-400"
                      title="New File"
                    >
                      <FilePlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onCreate("folder", item.path)}
                      className="p-1 hover:text-yellow-400"
                      title="New Folder"
                    >
                      <FolderPlus className="w-3 h-3" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onRemove(item.path)}
                  className="p-1 hover:text-red-400"
                  title="Delete"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {item.type === "folder" && item.isOpen && (
              <ProjectTree
                items={items.filter((i) => i.path.startsWith(`${item.path}/`))}
                onToggle={onToggle}
                onRemove={onRemove}
                onCreate={onCreate}
                onFileSelect={onFileSelect}
                onAddToContext={onAddToContext}
                onRemoveFromContext={onRemoveFromContext}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onRename={onRename}
                onDelete={onDelete}
                activeFileId={activeFileId}
                referencedFileIds={referencedFileIds}
                parentPath={item.path}
              />
            )}
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
          className="bg-[#1e1e2e] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            onClick={() => {
              closeMenu();
              const parentPath = contextMenu.item.type === "folder"
                ? contextMenu.item.path
                : contextMenu.item.path.includes("/")
                  ? contextMenu.item.path.substring(0, contextMenu.item.path.lastIndexOf("/"))
                  : "";
              if (onCreateFile) onCreateFile(parentPath);
              else onCreate("file", parentPath || undefined);
            }}
          >
            New File
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            onClick={() => {
              closeMenu();
              const parentPath = contextMenu.item.type === "folder"
                ? contextMenu.item.path
                : contextMenu.item.path.includes("/")
                  ? contextMenu.item.path.substring(0, contextMenu.item.path.lastIndexOf("/"))
                  : "";
              if (onCreateFolder) onCreateFolder(parentPath);
              else onCreate("folder", parentPath || undefined);
            }}
          >
            New Folder
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            onClick={() => {
              closeMenu();
              if (onRename) onRename(contextMenu.item);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            onClick={() => {
              closeMenu();
              if (onDelete) onDelete(contextMenu.item.path);
              else onRemove(contextMenu.item.path);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
