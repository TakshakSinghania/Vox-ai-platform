"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onCancel?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  onCancel,
  placeholder = "Message Vox... (Press Enter to send, Shift+Enter for newline)",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSendMessage(input);
        setInput("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  const handleSend = () => {
    if (!isLoading && input.trim()) {
      onSendMessage(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <div className="flex items-end gap-2 p-2 sm:p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg focus-within:border-[var(--vox-primary)]/60 focus-within:ring-1 focus-within:ring-[var(--vox-primary)]/20 transition-all">
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] px-2.5 py-1.5 resize-none outline-none max-h-48 overflow-y-auto leading-relaxed disabled:opacity-60 min-h-[36px]"
      />

      <div className="flex items-center gap-1.5 shrink-0 pb-0.5 pr-0.5">
        {isLoading ? (
          <button
            onClick={onCancel}
            type="button"
            className="w-8 h-8 rounded-xl bg-[var(--surface-elevated)] hover:bg-neutral-800 text-neutral-300 flex items-center justify-center transition-colors border border-[var(--border)]"
            title="Stop generation"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            type="button"
            className="w-8 h-8 rounded-xl bg-[var(--vox-primary)] hover:bg-[var(--vox-secondary)] disabled:bg-neutral-800/80 text-neutral-950 disabled:text-neutral-500 flex items-center justify-center transition-all disabled:opacity-40 shadow-sm"
            title="Send message"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
}
