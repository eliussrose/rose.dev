/**
 * @copyright Copyright (c) 2026 rose.dev. All rights reserved.
 * @license AGPL-3.0
 * @description Context Manager - Intelligent context management for AI
 */

import { EventEmitter } from 'events';

export interface ContextFile {
  path: string;
  content: string;
  tokens: number;
  relevance: number; // 0-1
  lastAccessed: number;
  inContext: boolean;
}

export interface ContextStats {
  totalFiles: number;
  filesInContext: number;
  totalTokens: number;
  maxTokens: number;
  utilizationPercent: number;
}

export class ContextManager extends EventEmitter {
  private files: Map<string, ContextFile> = new Map();
  private maxTokens: number;
  private readonly TOKEN_BUFFER = 1000; // Reserve for system prompt

  constructor(maxTokens = 8000) {
    super();
    this.maxTokens = maxTokens;
  }

  /**
   * Add a file to context pool
   */
  addFile(path: string, content: string, relevance = 0.5): void {
    const tokens = this.estimateTokens(content);
    
    const file: ContextFile = {
      path,
      content,
      tokens,
      relevance,
      lastAccessed: Date.now(),
      inContext: false,
    };

    this.files.set(path, file);
    this.emit('fileAdded', file);
    
    // Auto-optimize context
    this.optimizeContext();
  }

  /**
   * Remove a file from context pool
   */
  removeFile(path: string): void {
    const file = this.files.get(path);
    if (file) {
      this.files.delete(path);
      this.emit('fileRemoved', file);
    }
  }

  /**
   * Update file relevance score
   */
  updateRelevance(path: string, relevance: number): void {
    const file = this.files.get(path);
    if (file) {
      file.relevance = Math.max(0, Math.min(1, relevance));
      this.emit('relevanceUpdated', file);
      this.optimizeContext();
    }
  }

  /**
   * Mark file as accessed
   */
  markAccessed(path: string): void {
    const file = this.files.get(path);
    if (file) {
      file.lastAccessed = Date.now();
      file.relevance = Math.min(1, file.relevance + 0.1);
      this.optimizeContext();
    }
  }

  /**
   * Optimize context based on token limits and relevance
   */
  private optimizeContext(): void {
    // Sort files by relevance score
    const sortedFiles = Array.from(this.files.values()).sort(
      (a, b) => b.relevance - a.relevance
    );

    let currentTokens = 0;
    const availableTokens = this.maxTokens - this.TOKEN_BUFFER;

    // Reset all files
    for (const file of this.files.values()) {
      file.inContext = false;
    }

    // Add files until token limit
    for (const file of sortedFiles) {
      if (currentTokens + file.tokens <= availableTokens) {
        file.inContext = true;
        currentTokens += file.tokens;
      }
    }

    this.emit('contextOptimized', this.getStats());
  }

  /**
   * Get files currently in context
   */
  getContextFiles(): ContextFile[] {
    return Array.from(this.files.values()).filter((f) => f.inContext);
  }

  /**
   * Get all files in pool
   */
  getAllFiles(): ContextFile[] {
    return Array.from(this.files.values());
  }

  /**
   * Build context string for AI
   */
  buildContextString(): string {
    const contextFiles = this.getContextFiles();
    
    if (contextFiles.length === 0) {
      return '';
    }

    let context = '# Project Context\n\n';
    
    for (const file of contextFiles) {
      context += `## File: ${file.path}\n`;
      context += '```\n';
      context += file.content;
      context += '\n```\n\n';
    }

    return context;
  }

  /**
   * Get context statistics
   */
  getStats(): ContextStats {
    const allFiles = Array.from(this.files.values());
    const contextFiles = allFiles.filter((f) => f.inContext);
    const totalTokens = contextFiles.reduce((sum, f) => sum + f.tokens, 0);

    return {
      totalFiles: allFiles.length,
      filesInContext: contextFiles.length,
      totalTokens,
      maxTokens: this.maxTokens,
      utilizationPercent: (totalTokens / this.maxTokens) * 100,
    };
  }

  /**
   * Estimate tokens in text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Smart file selection based on query
   */
  async selectRelevantFiles(query: string, maxFiles = 10): Promise<string[]> {
    const scores = new Map<string, number>();

    // Calculate relevance scores
    for (const [path, file] of this.files) {
      let score = file.relevance;

      // Boost score if query mentions file name
      if (query.toLowerCase().includes(path.toLowerCase())) {
        score += 0.5;
      }

      // Boost score if query mentions file extension
      const ext = path.split('.').pop();
      if (ext && query.toLowerCase().includes(ext)) {
        score += 0.2;
      }

      // Boost score for recently accessed files
      const hoursSinceAccess = (Date.now() - file.lastAccessed) / (1000 * 60 * 60);
      if (hoursSinceAccess < 1) {
        score += 0.3;
      } else if (hoursSinceAccess < 24) {
        score += 0.1;
      }

      // Simple keyword matching
      const keywords = query.toLowerCase().split(/\s+/);
      const contentLower = file.content.toLowerCase();
      const matchCount = keywords.filter((kw) => contentLower.includes(kw)).length;
      score += (matchCount / keywords.length) * 0.3;

      scores.set(path, score);
    }

    // Sort by score and return top N
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxFiles)
      .map(([path]) => path);
  }

  /**
   * Auto-include files based on patterns
   */
  autoIncludeByPattern(patterns: string[]): void {
    for (const [path, file] of this.files) {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(path)) {
          file.relevance = Math.max(file.relevance, 0.8);
        }
      }
    }
    this.optimizeContext();
  }

  /**
   * Decay relevance over time
   */
  decayRelevance(decayRate = 0.1): void {
    for (const file of this.files.values()) {
      file.relevance = Math.max(0, file.relevance - decayRate);
    }
    this.optimizeContext();
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.files.clear();
    this.emit('contextCleared');
  }

  /**
   * Set max tokens
   */
  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens;
    this.optimizeContext();
  }

  /**
   * Export context state
   */
  exportState(): any {
    return {
      files: Array.from(this.files.entries()),
      maxTokens: this.maxTokens,
      stats: this.getStats(),
    };
  }

  /**
   * Import context state
   */
  importState(state: any): void {
    this.files.clear();
    this.maxTokens = state.maxTokens || 8000;
    
    for (const [path, file] of state.files) {
      this.files.set(path, file);
    }
    
    this.optimizeContext();
  }
}
