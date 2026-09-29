"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { formatTime } from "@/lib/utils";
import { StreamingText } from "@/components/ui/streaming-text";
import { TextResponse } from "@/components/ui/text-response";
import { ThinkingState } from "@/components/ui/ThinkingState";

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  isLastAssistant?: boolean;
}

export function ChatMessageItem({
  message,
  onRetry,
  isLastAssistant,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const isStreaming = message.status === "streaming";
  const isError = message.status === "error";
  const [copiedMessage, setCopiedMessage] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className={`w-full flex flex-col ${isUser ? "items-end" : "items-start"} my-2 group`}>
      {/* Label and Timestamp */}
      <div
        className={`flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono ${
          isUser ? "text-[#D4BEAC]" : "text-[#C3A995]"
        }`}
      >
        <span>{isUser ? "YOU" : "VOX"}</span>
        <span className="text-[#8A7968] text-[10px]">• {formatTime(message.timestamp)}</span>
      </div>

      {/* Message Surface */}
      <div
        className={`relative leading-relaxed transition-all ${
          isUser
            ? "max-w-[85%] md:max-w-[70%] rounded-2xl rounded-tr-sm px-5 py-3.5 bg-[#C3A995]/12 border border-[#C3A995]/20 text-[#EDE4DC] text-sm"
            : "max-w-[95%] md:max-w-[85%] rounded-2xl rounded-tl-sm px-6 py-4 bg-white/[0.035] border border-white/8 text-[#EDE4DC] text-sm md:text-base shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        }`}
      >
        {/* Error State */}
        {isError ? (
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-[#EDE4DC] space-y-2">
            <div className="flex items-center gap-2 font-medium text-[#C3A995]">
              <AlertCircle className="w-4 h-4 text-[#C3A995]" />
              <span>Generation Error</span>
            </div>
            <p className="text-[#AB947E] leading-relaxed">
              {message.errorMessage || "Failed to generate AI response. Please verify server connection and try again."}
            </p>
            {onRetry && isLastAssistant && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#EDE4DC] text-xs font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-[#C3A995]" />
                <span>Retry Message</span>
              </button>
            )}
          </div>
        ) : isStreaming && !isUser && !message.content ? (
          /* Real Thinking State: Assistant request started and waiting for first token */
          <div className="py-1">
            <ThinkingState />
          </div>
        ) : isStreaming && !isUser ? (
          /* Real Streaming State */
          <StreamingText text={message.content} isStreaming={true} />
        ) : (
          /* Finished or User Message */
          <TextResponse>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 my-2.5 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2.5 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-[#EDE4DC]/90">{children}</li>,
                h1: ({ children }) => <h1 className="font-serif text-xl font-normal text-[#EDE4DC] mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="font-serif text-lg font-normal text-[#EDE4DC] mt-3.5 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="font-serif text-base font-normal text-[#EDE4DC] mt-3 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#C3A995]/50 pl-3.5 my-2.5 text-[#AB947E] italic">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full text-xs border border-white/10 text-left">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-[#EDE4DC]">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-white/10 px-3 py-1.5 text-[#AB947E]">
                    {children}
                  </td>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !String(children).includes("\n");

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-white/5 text-[#C3A995] font-mono text-xs border border-white/5"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <CodeBlock language={match ? match[1] : "text"}>
                      {String(children).replace(/\n$/, "")}
                    </CodeBlock>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </TextResponse>
        )}

        {/* Copy action for assistant responses */}
        {!isUser && !isStreaming && !isError && message.content && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end">
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 text-[11px] text-[#8A7968] hover:text-[#C3A995] transition-colors cursor-pointer"
              title="Copy message text"
              aria-label="Copy message text"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3 h-3 text-[#C3A995]" />
                  <span className="text-[#C3A995] font-mono">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-2xl border border-white/10 bg-black/60 overflow-hidden font-mono text-xs shadow-lg">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[#8A7968] text-[11px]">
        <span className="uppercase tracking-wider font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[#AB947E] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#C3A995]" />
              <span className="text-[#C3A995]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 overflow-x-auto text-[#EDE4DC] leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}
