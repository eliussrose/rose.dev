/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 */

"use client";

import { useState, useEffect } from "react";
import { Settings, Check, X, Loader2, RefreshCw } from "lucide-react";
import { AIProvider, ProviderSettings } from "../types";
import { callAI } from "../lib/ai";

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "huggingface", label: "Hugging Face" },
  { value: "openai", label: "OpenAI (ChatGPT)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "gemini", label: "Google Gemini" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "glm", label: "GLM (ZhipuAI)" },
  { value: "ollama", label: "Ollama (Local)" },
  { value: "custom", label: "Custom (OpenAI Compatible)" },
];

const DEFAULT_SETTINGS: ProviderSettings = {
  token: "",
  modelId: "",
  baseUrl: "",
  temperature: 0.7,
  maxTokens: 4000,
};

function loadSettings(provider: AIProvider): ProviderSettings {
  try {
    const raw = localStorage.getItem(`provider_settings_${provider}`);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(provider: AIProvider, settings: ProviderSettings) {
  localStorage.setItem(`provider_settings_${provider}`, JSON.stringify(settings));
}

interface SettingsPanelProps {
  activeProvider: AIProvider;
  activeModelId: string;
  onClose: () => void;
  onApply: (provider: AIProvider, settings: ProviderSettings) => void;
}

export function SettingsPanel({ activeProvider, activeModelId, onClose, onApply }: SettingsPanelProps) {
  const [provider, setProvider] = useState<AIProvider>(activeProvider);
  const [settings, setSettings] = useState<ProviderSettings>(() => loadSettings(activeProvider));
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings(provider));
    setTestResult(null);
    setSaved(false);
  }, [provider]);

  const update = (patch: Partial<ProviderSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const handleSave = () => {
    saveSettings(provider, settings);
    onApply(provider, settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await callAI({
        provider,
        token: settings.token,
        modelId: settings.modelId,
        baseUrl: settings.baseUrl,
        temperature: settings.temperature,
        maxTokens: 64,
        systemPrompt: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Hello" }],
      });
      setTestResult({ ok: true, msg: result ? "Connected ✓" : "No response" });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e?.message || "Connection failed" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshOllama = async () => {
    setIsRefreshing(true);
    try {
      const url = settings.baseUrl
        ? `${settings.baseUrl.replace(/\/$/, "")}/api/tags`
        : "http://localhost:11434/api/tags";
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: url, method: "GET" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.models) {
          const names: string[] = data.models.map((m: any) => m.name);
          setOllamaModels(names);
          if (names.length > 0 && !settings.modelId) update({ modelId: names[0] });
        }
      }
    } catch {}
    setIsRefreshing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a233b] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-yellow-400" />
            Provider Settings
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Provider */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              className="w-full p-2.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          {provider !== "ollama" && (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">API Key / Token</label>
              <input
                type="password"
                value={settings.token}
                onChange={(e) => update({ token: e.target.value })}
                placeholder={provider === "huggingface" ? "hf_..." : "sk-..."}
                className="w-full p-2.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 placeholder-gray-600"
              />
            </div>
          )}

          {/* Model ID */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">Model ID</label>
              {provider === "ollama" && (
                <button
                  onClick={handleRefreshOllama}
                  disabled={isRefreshing}
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh Models
                </button>
              )}
            </div>
            {provider === "ollama" && ollamaModels.length > 0 ? (
              <select
                value={settings.modelId}
                onChange={(e) => update({ modelId: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
              >
                {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={settings.modelId}
                onChange={(e) => update({ modelId: e.target.value })}
                placeholder="e.g. gpt-4o, claude-3-5-sonnet-20241022"
                className="w-full p-2.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 placeholder-gray-600"
              />
            )}
          </div>

          {/* Base URL */}
          {(provider === "custom" || provider === "ollama" || provider === "glm" || provider === "deepseek") && (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">Base URL</label>
              <input
                type="text"
                value={settings.baseUrl}
                onChange={(e) => update({ baseUrl: e.target.value })}
                placeholder={
                  provider === "ollama" ? "http://localhost:11434" :
                  provider === "deepseek" ? "https://api.deepseek.com" :
                  "https://api.example.com/v1"
                }
                className="w-full p-2.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 placeholder-gray-600"
              />
            </div>
          )}

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">Temperature</label>
              <span className="text-xs text-yellow-400 font-mono">{settings.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>0.0 (precise)</span>
              <span>2.0 (creative)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Max Tokens</label>
            <input
              type="number"
              min={256}
              max={32768}
              step={256}
              value={settings.maxTokens}
              onChange={(e) => update({ maxTokens: parseInt(e.target.value) || 4000 })}
              className="w-full p-2.5 text-xs rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            />
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
              testResult.ok
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {testResult.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {testResult.msg}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !settings.modelId}
              className="flex-1 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Test Connection
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-xs bg-yellow-500 hover:bg-yellow-400 text-[#0a233b] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : null}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>

        {/* Footer: active provider + model */}
        <div className="px-4 py-3 border-t border-gray-700 bg-[#071829]/50 text-[10px] text-gray-500 flex items-center justify-between">
          <span>Active: <span className="text-yellow-400">{activeProvider}</span></span>
          <span className="truncate max-w-[160px] text-gray-400">{activeModelId || "—"}</span>
        </div>
      </div>
    </div>
  );
}
