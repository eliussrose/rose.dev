/**
 * @copyright Copyright (c) 2026 Prosinres. All rights reserved.
 * @license AGPL-3.0
 */

"use client";

import React from "react";
import {
  Files, Settings, Terminal, GitBranch, Search, Zap, Bot, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolbarView = "files" | "settings" | "terminal" | "github" | "analyzer" | "advanced" | null;

interface VerticalToolbarProps {
  activeView: ToolbarView;
  onViewChange: (view: ToolbarView) => void;
  agentMode?: boolean;
}

export const VerticalToolbar = ({ activeView, onViewChange, agentMode }: VerticalToolbarProps) => {
  const tools = [
    { id: "files" as const, icon: Files, label: "Explorer", color: "text-blue-400" },
    { id: "analyzer" as const, icon: Search, label: "Analyzer", color: "text-purple-400" },
    { id: "github" as const, icon: GitBranch, label: "GitHub", color: "text-orange-400" },
    { id: "advanced" as const, icon: Zap, label: "Advanced", color: "text-yellow-400" },
    { id: "terminal" as const, icon: Terminal, label: "Terminal", color: "text-green-400" },
    { id: "settings" as const, icon: Settings, label: "Settings", color: "text-gray-400" },
  ];

  return (
    <div className="w-14 bg-[#0a1929] border-r border-gray-800 flex flex-col items-center py-4 gap-2 flex-shrink-0">
      {/* Logo */}
      <div className="mb-4 p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
        <Bot className="w-6 h-6 text-white" />
      </div>

      {/* Agent Mode Indicator */}
      {agentMode && (
        <div className="mb-2 p-1.5 rounded-lg bg-yellow-400/20 border border-yellow-400/50 animate-pulse">
          <Layers className="w-5 h-5 text-yellow-400" />
        </div>
      )}

      {/* Tool Buttons */}
      <div className="flex-1 flex flex-col gap-1 w-full px-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeView === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => onViewChange(isActive ? null : tool.id)}
              className={cn(
                "relative group p-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? `bg-gray-800 ${tool.color} shadow-lg`
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
              )}
              title={tool.label}
            >
              <Icon className="w-5 h-5" />
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-r-full" />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {tool.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Spacer */}
      <div className="mt-auto" />
    </div>
  );
};
