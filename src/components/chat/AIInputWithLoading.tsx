"use client";

import { CornerRightUp, Square } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  isLoading?: boolean;
  onSend?: (value: string) => void | Promise<void>;
  onStop?: () => void;
  className?: string;
  disabled?: boolean;
}

export function AIInputWithLoading({
  id = "ai-input-with-loading",
  placeholder = "Message Vox...",
  minHeight = 54,
  maxHeight = 180,
  isLoading = false,
  onSend,
  onStop,
  className,
  disabled = false,
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading || disabled) return;
    const textToSend = inputValue.trim();
    setInputValue("");
    adjustHeight(true);
    await onSend?.(textToSend);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full max-w-4xl mx-auto flex items-start flex-col gap-1.5">
        <div className="relative w-full rounded-2xl md:rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_1px_rgba(255,255,255,0.06)] transition-all focus-within:border-[#C3A995]/40 focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(195,169,149,0.08)]">
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-2xl md:rounded-3xl pl-5 pr-14 py-3.5 md:py-4",
              "placeholder:text-white/35",
              "border-none ring-0 focus-visible:ring-0 focus-visible:outline-none",
              "text-white/90 resize-none text-wrap leading-[1.4] text-sm md:text-base",
              "bg-transparent"
            )}
            style={{ minHeight: `${minHeight}px` }}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={disabled}
          />

          <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5">
            {isLoading ? (
              <button
                onClick={onStop}
                type="button"
                aria-label="Stop generating response"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current text-[#C3A995]" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                type="button"
                disabled={!inputValue.trim() || disabled}
                title="Send message"
                data-testid="send-chat-button"
                aria-label="Send message (Enter)"
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                  inputValue.trim()
                    ? "bg-[#C3A995] text-black shadow-md hover:bg-[#D4BEAC] active:scale-95"
                    : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                )}
              >
                <CornerRightUp className="w-4 h-4 transition-transform" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full px-4 flex items-center justify-between text-[11px] text-[#C3A995]/50 font-mono select-none">
          <span>{isLoading ? "Vox is responding..." : "Enter to send • Shift+Enter for newline"}</span>
          <span className="hidden sm:inline">Kimi k2.5 • CallMissed</span>
        </div>
      </div>
    </div>
  );
}
