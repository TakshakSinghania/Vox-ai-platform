"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, ArrowDown } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessageItem } from "./ChatMessageItem";
import { AIInputWithLoading } from "./AIInputWithLoading";

export function ChatInterface() {
  const {
    messages,
    isLoading,
    sendMessage,
    retryLastMessage,
    cancelGeneration,
    clearConversation,
  } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isNearBottomRef = useRef(true);

  // Track scroll position for bottom snap
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceToBottom < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }, []);

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
      {/* Chat Workspace Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-transparent shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-xl tracking-normal text-[#EDE4DC] font-normal">
            Conversational Intelligence
          </h1>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[#C3A995] border border-white/10">
            Kimi k2.5
          </span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#8A7968] hover:text-[#C3A995] hover:bg-white/5 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            onClick={clearConversation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#EDE4DC] bg-white/5 hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C3A995]" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area — Spacious Horizontal Width Across Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center max-w-lg mx-auto text-center px-4 py-16 animate-in fade-in duration-300 select-none">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 p-1 mb-5 shadow-sm flex items-center justify-center border border-white/10">
              <Image
                src="/images/vox-logo.png"
                alt="Vox Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <h2 className="font-serif text-2xl font-normal text-[#EDE4DC] mb-2 tracking-wide">
              How can Vox assist you today?
            </h2>
            <p className="text-xs text-[#8A7968] max-w-sm leading-relaxed">
              Explore complex ideas, review technical architectures, or compose documents with streaming conversational intelligence.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-[1400px] mx-auto space-y-4">
            {messages.map((message, index) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onRetry={retryLastMessage}
                isLastAssistant={index === messages.length - 1 && message.role === "assistant"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to newest messages"
          className="absolute right-8 bottom-28 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-[#EDE4DC] text-xs font-medium shadow-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
        >
          {isLoading && (
            <span className="w-2 h-2 rounded-full bg-[#C3A995] animate-ping" />
          )}
          <ArrowDown className="w-3.5 h-3.5 text-[#C3A995]" />
          <span className="font-mono text-[11px]">
            {isLoading ? "Streaming..." : "Scroll to bottom"}
          </span>
        </button>
      )}

      {/* Input Area — Seamless Liquid Glass Bottom Section */}
      <div className="p-4 md:p-6 bg-transparent shrink-0">
        <AIInputWithLoading
          isLoading={isLoading}
          onSend={sendMessage}
          onStop={cancelGeneration}
          placeholder="Message Vox..."
        />
      </div>
    </div>
  );
}
