"use client";

import { useState, useRef, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { generateId } from "@/lib/utils";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: generateId("msg_user"),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      status: "sent",
    };

    const assistantPlaceholderId = generateId("msg_asst");
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build conversation history for API
      const historyPayload = messages
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errorMsg = "Chat service error.";
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          errorMsg = `Server error (${response.status})`;
        }
        throw new Error(errorMsg);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Unable to initialize response stream.");
      }

      let accumulatedContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") {
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.replace("data: ", "").trim();
            try {
              const parsed = JSON.parse(jsonStr);
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.text ||
                parsed.delta?.text ||
                "";
              if (delta) {
                accumulatedContent += delta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantPlaceholderId
                      ? { ...msg, content: accumulatedContent, status: "streaming" }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore non-json or split SSE chunks
            }
          }
        }
      }

      // Mark finished
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? { ...msg, content: accumulatedContent, status: "sent" }
            : msg
        )
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholderId
              ? { ...msg, status: "sent" }
              : msg
          )
        );
      } else {
        const errText = err instanceof Error ? err.message : "Error generating AI response.";
        setError(errText);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholderId
              ? { ...msg, status: "error", errorMessage: errText }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading]);

  const retryLastMessage = useCallback(() => {
    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    // Remove last failed assistant message and re-send
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].role === "assistant") {
        copy.pop();
      }
      return copy;
    });

    sendMessage(lastUserMsg.content);
  }, [messages, sendMessage]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearConversation = useCallback(() => {
    cancelGeneration();
    setMessages([]);
    setError(null);
  }, [cancelGeneration]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    cancelGeneration,
    clearConversation,
  };
}
