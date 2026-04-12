/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 */

"use client";

import { useState } from "react";
import {
  Search, AlertCircle, AlertTriangle, Info, CheckCircle,
  Loader2, Package, Wrench, List,
} from "lucide-react";
import { ProjectItem } from "../types";
import { callAI } from "../lib/ai";

interface ProjectAnalyzerProps {
  projectItems: ProjectItem[];
  token: string;
  modelId: string;
  provider: string;
  workspaceRoot?: string;
  onOpenFile?: (id: string) => void;
}

interface AnalysisSection {
  errors: string[];
  warnings: string[];
  suggestions: string[];
  dependencies: string[];
}

function parseAnalysis(raw: string): AnalysisSection {
  const section = (tag: string) => {
    const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (!m) return [];
    return m[1].split("\n").map(l => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
  };
  return {
    errors: section("errors"),
    warnings: section("warnings"),
    suggestions: section("suggestions"),
    dependencies: section("dependencies"),
  };
}

export function ProjectAnalyzer({
  projectItems,
  token,
  modelId,
  provider,
  workspaceRoot,
  onOpenFile,
}: ProjectAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisSection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReqs, setIsGeneratingReqs] = useState(false);
  const [pipOutput, setPipOutput] = useState<string | null>(null);

  const isElectron = typeof window !== "undefined" && !!(window as any).electron?.isElectron;

  const djangoDetected = projectItems.some(i => i.name === "manage.py");
  const hasRequirements = projectItems.some(
    i => i.name === "requirements.txt" || i.name === "pyproject.toml"
  );
  const pyFiles = projectItems.filter(i => i.type === "file" && i.name.endsWith(".py"));

  const analyzeProject = async () => {
    if (!modelId) { setError("Configure a model first"); return; }
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    const fileContext = pyFiles
      .map(f => `--- FILE: ${f.path} ---\n${f.content || ""}`)
      .join("\n\n");

    const prompt = `Analyze this ${djangoDetected ? "Django" : "Python"} project and respond ONLY with XML in this exact format:

<errors>
- list each error on its own line
</errors>
<warnings>
- list each warning on its own line
</warnings>
<suggestions>
- list each suggestion on its own line
</suggestions>
<dependencies>
- list each detected dependency on its own line
</dependencies>

Project files:
${fileContext}`;

    try {
      const raw = await callAI({
        provider: provider as any,
        token,
        modelId,
        baseUrl: "",
        temperature: 0.3,
        maxTokens: 2048,
        systemPrompt: "You are a Python code analysis assistant. Respond only with the requested XML format.",
        messages: [{ role: "user", content: prompt }],
      });
      setAnalysis(parseAnalysis(raw || ""));
    } catch (e: any) {
      setError(e?.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRequirements = async () => {
    if (!modelId) { setError("Configure a model first"); return; }
    setIsGeneratingReqs(true);
    setError(null);

    const imports = pyFiles
      .flatMap(f => (f.content || "").split("\n").filter(l => l.startsWith("import ") || l.startsWith("from ")))
      .join("\n");

    try {
      const raw = await callAI({
        provider: provider as any,
        token,
        modelId,
        baseUrl: "",
        temperature: 0.1,
        maxTokens: 512,
        systemPrompt: "You are a Python dependency expert. Output only a valid requirements.txt file, no explanation.",
        messages: [{ role: "user", content: `Generate requirements.txt from these imports:\n${imports}` }],
      });

      if (isElectron && workspaceRoot && raw) {
        await (window as any).electron.writeFile(`${workspaceRoot}/requirements.txt`, raw.trim());
      }
      setError(null);
      setPipOutput("requirements.txt generated!");
    } catch (e: any) {
      setError(e?.message || "Failed to generate requirements.txt");
    } finally {
      setIsGeneratingReqs(false);
    }
  };

  const checkInstalled = async () => {
    if (!isElectron) { setError("Requires desktop app"); return; }
    const res = await (window as any).electron.executeCommand("pip list --format=columns");
    const reqFile = projectItems.find(i => i.name === "requirements.txt");
    if (!reqFile?.content) { setPipOutput(res.output); return; }

    const required = reqFile.content
      .split("\n")
      .map(l => l.split(/[>=<!=]/)[0].trim().toLowerCase())
      .filter(Boolean);
    const installed = res.output
      .split("\n")
      .slice(2)
      .map((l: string) => l.split(/\s+/)[0]?.toLowerCase())
      .filter(Boolean);

    const missing = required.filter(r => !installed.includes(r));
    setPipOutput(
      missing.length === 0
        ? "All dependencies installed ✓"
        : `Missing: ${missing.join(", ")}`
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-yellow-400" />
          Project Analyzer
          {djangoDetected && (
            <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
              Django
            </span>
          )}
        </h3>
        <button
          onClick={analyzeProject}
          disabled={isAnalyzing || pyFiles.length === 0}
          className="px-3 py-1.5 bg-yellow-400 text-[#0a233b] rounded-lg text-xs font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
          ) : (
            <><Search className="w-3 h-3" /> Analyze</>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          {/* Errors */}
          {analysis.errors.length > 0 && (
            <Section
              icon={<AlertCircle className="w-3.5 h-3.5 text-red-400" />}
              title={`Errors (${analysis.errors.length})`}
              items={analysis.errors}
              color="text-red-300"
            />
          )}
          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <Section
              icon={<AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
              title={`Warnings (${analysis.warnings.length})`}
              items={analysis.warnings}
              color="text-yellow-300"
            />
          )}
          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <Section
              icon={<Info className="w-3.5 h-3.5 text-blue-400" />}
              title={`Suggestions (${analysis.suggestions.length})`}
              items={analysis.suggestions}
              color="text-blue-300"
            />
          )}
          {/* Dependencies */}
          {analysis.dependencies.length > 0 && (
            <Section
              icon={<Package className="w-3.5 h-3.5 text-purple-400" />}
              title={`Dependencies (${analysis.dependencies.length})`}
              items={analysis.dependencies}
              color="text-purple-300"
            />
          )}
          {analysis.errors.length === 0 && analysis.warnings.length === 0 &&
            analysis.suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              No issues found!
            </div>
          )}
        </div>
      )}

      {/* Requirements helpers */}
      <div className="border-t border-gray-800 pt-3 space-y-2">
        {!hasRequirements && (
          <button
            onClick={generateRequirements}
            disabled={isGeneratingReqs || pyFiles.length === 0}
            className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGeneratingReqs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <List className="w-3.5 h-3.5" />}
            Generate requirements.txt
          </button>
        )}
        <button
          onClick={checkInstalled}
          disabled={!isElectron}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          title={!isElectron ? "Requires desktop app" : undefined}
        >
          <Wrench className="w-3.5 h-3.5" /> Check Installed
        </button>
        {pipOutput && (
          <div className="p-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 whitespace-pre-wrap">
            {pipOutput}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon, title, items, color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
        {icon} {title}
      </h4>
      <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
        {items.map((item, i) => (
          <div key={i} className={`text-xs ${color} p-1.5 bg-gray-900/50 rounded`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
