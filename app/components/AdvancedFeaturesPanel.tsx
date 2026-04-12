"use client";

/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description Advanced Features Panel - Simplified for Electron
 */

import { useState } from 'react';

interface AdvancedFeaturesPanelProps {
  onClose: () => void;
}

export default function AdvancedFeaturesPanel({ onClose }: AdvancedFeaturesPanelProps) {
  const [activeTab, setActiveTab] = useState<'agent' | 'mcp' | 'hooks' | 'context'>('agent');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-gray-700 rounded-lg w-[90%] h-[90%] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">🚀 Advanced Features</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl px-3"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {['agent', 'mcp', 'hooks', 'context'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'agent' && <AgentTab />}
          {activeTab === 'mcp' && <MCPTab />}
          {activeTab === 'hooks' && <HooksTab />}
          {activeTab === 'context' && <ContextTab />}
        </div>
      </div>
    </div>
  );
}

// Agent Tab - Simplified
function AgentTab() {
  const [goal, setGoal] = useState('');
  const [mode, setMode] = useState<'interactive' | 'autonomous'>('interactive');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">🤖 Agent System</h3>
        <p className="text-gray-400 mb-4">
          Autonomous AI agent for complex multi-step tasks
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent Mode
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setMode('interactive')}
            className={`px-4 py-2 rounded ${
              mode === 'interactive'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Interactive
          </button>
          <button
            onClick={() => setMode('autonomous')}
            className={`px-4 py-2 rounded ${
              mode === 'autonomous'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Autonomous
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Task Goal
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="E.g., Create a login system with authentication"
          className="w-full h-32 bg-gray-800 text-white border border-gray-600 rounded p-3"
        />
      </div>

      <div className="bg-yellow-900/30 border border-yellow-700 rounded p-4">
        <p className="text-yellow-300 text-sm">
          ⚠️ Agent system is currently in development. Use the existing Agent Mode toggle in the sidebar for basic autonomous behavior.
        </p>
      </div>
    </div>
  );
}

// MCP Tab - Simplified
function MCPTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">🔌 MCP Integration</h3>
        <p className="text-gray-400 mb-4">
          Model Context Protocol for external tools
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-8 text-center">
        <p className="text-gray-400 mb-4">No MCP servers configured</p>
        <p className="text-sm text-gray-500 mb-6">
          MCP allows you to connect external tools and services to the IDE
        </p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Add MCP Server
        </button>
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded p-4">
        <p className="text-blue-300 text-sm">
          💡 MCP support is available. You can configure servers in the Electron main process.
        </p>
      </div>
    </div>
  );
}

// Hooks Tab - Simplified
function HooksTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">⚡ Hook System</h3>
        <p className="text-gray-400 mb-4">
          Event-driven automation for repetitive tasks
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-8 text-center">
        <p className="text-gray-400 mb-4">No hooks configured</p>
        <p className="text-sm text-gray-500 mb-6">
          Hooks let you automate actions based on IDE events like file saves, builds, etc.
        </p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Create Hook
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Example Hooks:</h4>
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <p className="text-white text-sm">Auto-format on save</p>
          <p className="text-gray-400 text-xs mt-1">Run prettier when .js files are saved</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <p className="text-white text-sm">Run tests on commit</p>
          <p className="text-gray-400 text-xs mt-1">Execute test suite before git commits</p>
        </div>
      </div>
    </div>
  );
}

// Context Tab - Simplified
function ContextTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">📊 Context Management</h3>
        <p className="text-gray-400 mb-4">
          Smart context optimization for AI interactions
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-sm text-gray-400">Files in Context</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-sm text-gray-400">Total Tokens</div>
        </div>
      </div>

      <div className="bg-green-900/30 border border-green-700 rounded p-4">
        <p className="text-green-300 text-sm">
          ✅ Context is automatically managed. Open files are included in AI conversations.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Context Features:</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Automatic file context from open tabs</li>
          <li>• Token estimation and limits</li>
          <li>• Smart context pruning</li>
          <li>• Referenced file tracking</li>
        </ul>
      </div>
    </div>
  );
}
