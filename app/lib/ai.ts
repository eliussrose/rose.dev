/**
 * Central AI provider utility.
 * All provider-specific fetch logic lives here so page.tsx stays clean.
 */

import { HfInference } from "@huggingface/inference";
import type { AIProvider } from "../types";

export interface AICallOptions {
  provider: AIProvider;
  token: string;
  modelId: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
  messages: { role: string; content: string }[];
  onChunk?: (chunk: string) => void; // called for each token chunk when streaming
}

/** Strip <think>...</think> blocks from a response string. */
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export async function callAI(opts: AICallOptions): Promise<string> {
  const {
    provider,
    token,
    modelId,
    baseUrl = "",
    temperature = 0.7,
    maxTokens = 4000,
    systemPrompt,
    messages,
    onChunk,
  } = opts;

  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // ── HuggingFace ────────────────────────────────────────────────────────────
  if (provider === "huggingface") {
    if (onChunk) {
      // HuggingFace streaming via SSE inference API
      try {
        const hf = new HfInference(token);
        let full = "";
        const stream = hf.chatCompletionStream({
          model: modelId,
          messages: chatMessages,
          max_tokens: maxTokens,
          temperature,
        });
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            onChunk(text);
            full += text;
          }
        }
        return stripThinkTags(full);
      } catch {
        // Fallback: non-streaming
      }
    }

    // Non-streaming (or fallback)
    const hf = new HfInference(token);
    try {
      const res = await hf.chatCompletion({
        model: modelId,
        messages: chatMessages,
        max_tokens: maxTokens,
        temperature,
      });
      return stripThinkTags(res.choices[0].message.content || "");
    } catch {
      const prompt =
        systemPrompt +
        "\n" +
        messages.map((m) => `${m.role}: ${m.content}`).join("\n") +
        "\nassistant: ";
      const res = await hf.textGeneration({
        model: modelId,
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature,
          stop: ["user:", "\nuser"],
          // @ts-ignore
          wait_for_model: true,
        },
      });
      return stripThinkTags(
        res.generated_text.split("assistant:").pop()?.trim() || res.generated_text
      );
    }
  }

  // ── OpenAI / DeepSeek / GLM / Custom ──────────────────────────────────────
  if (["openai", "deepseek", "glm", "custom"].includes(provider)) {
    const urlMap: Record<string, string> = {
      openai: "https://api.openai.com/v1/chat/completions",
      deepseek: baseUrl
        ? `${baseUrl.replace(/\/$/, "")}/chat/completions`
        : "https://api.deepseek.com/chat/completions",
      glm: baseUrl
        ? `${baseUrl.replace(/\/$/, "")}/chat/completions`
        : "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      custom: `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    };
    const apiUrl = urlMap[provider];

    if (onChunk) {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: chatMessages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body for streaming");
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") break;
          try {
            const json = JSON.parse(payload);
            const text: string = json.choices?.[0]?.delta?.content ?? "";
            if (text) {
              onChunk(text);
              full += text;
            }
          } catch {
            // skip malformed lines
          }
        }
      }
      return stripThinkTags(full);
    }

    // Non-streaming
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: chatMessages,
        max_tokens: maxTokens,
        temperature,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API Error");
    return stripThinkTags(data.choices[0].message.content);
  }

  // ── Anthropic ──────────────────────────────────────────────────────────────
  if (provider === "anthropic") {
    if (onChunk) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerously-allow-browser": "true",
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          stream: true,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body for Anthropic streaming");
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          try {
            const json = JSON.parse(payload);
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
              const text: string = json.delta.text ?? "";
              if (text) {
                onChunk(text);
                full += text;
              }
            }
          } catch {
            // skip malformed lines
          }
        }
      }
      return stripThinkTags(full);
    }

    // Non-streaming
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": token,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerously-allow-browser": "true",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Anthropic API Error");
    return stripThinkTags(data.content[0].text);
  }

  // ── Gemini ─────────────────────────────────────────────────────────────────
  if (provider === "gemini") {
    if (onChunk) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${token}&alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages.map((m) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }],
            })),
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature, maxOutputTokens: maxTokens },
          }),
        }
      );

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body for Gemini streaming");
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          try {
            const json = JSON.parse(payload);
            if (json.error) throw new Error(json.error.message || "Gemini API Error");
            const text: string =
              json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) {
              onChunk(text);
              full += text;
            }
          } catch (e: any) {
            if (e.message?.includes("Gemini")) throw e;
            // skip malformed lines
          }
        }
      }
      return stripThinkTags(full);
    }

    // Non-streaming
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Gemini API Error");
    return stripThinkTags(data.candidates[0].content.parts[0].text);
  }

  // ── Ollama ─────────────────────────────────────────────────────────────────
  if (provider === "ollama") {
    const apiUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/api/chat`
      : "http://localhost:11434/api/chat";

    if (onChunk) {
      // Use proxy with stream: true; proxy returns streaming NDJSON via ReadableStream
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: apiUrl,
          method: "POST",
          stream: true,
          body: {
            model: modelId,
            messages: chatMessages,
            stream: true,
            options: { temperature, num_predict: maxTokens },
          },
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body for Ollama streaming");
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json = JSON.parse(trimmed);
            if (json.error) throw new Error(json.error || "Ollama API Error");
            const text: string = json.message?.content ?? "";
            if (text) {
              onChunk(text);
              full += text;
            }
            if (json.done) break;
          } catch (e: any) {
            if (e.message?.includes("Ollama")) throw e;
            // skip malformed lines
          }
        }
      }
      return stripThinkTags(full);
    }

    // Non-streaming
    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUrl: apiUrl,
        method: "POST",
        body: {
          model: modelId,
          messages: chatMessages,
          stream: false,
          options: { temperature, num_predict: maxTokens },
        },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error || "Ollama API Error");
    return stripThinkTags(data.message?.content || "");
  }

  throw new Error(`Unknown provider: ${provider}`);
}
