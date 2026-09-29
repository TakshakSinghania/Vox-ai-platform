"use client";

import React, { useRef, useEffect, useState } from "react";
import { Trash2, Copy, Check, Radio } from "lucide-react";
import { VoiceTranscriptSegment } from "@/types/voice";
import { formatTime } from "@/lib/utils";

interface VoiceTranscriptProps {
  transcripts: VoiceTranscriptSegment[];
  livePartial: { speaker: "user" | "agent"; text: string } | null;
  onClearTranscripts: () => void;
  className?: string;
}

export function VoiceTranscript({
  transcripts,
  livePartial,
  onClearTranscripts,
  className = "",
}: VoiceTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, livePartial]);

  const handleCopyTranscript = async () => {
    if (transcripts.length === 0) return;
    const textToCopy = transcripts
      .map((t) => `[${formatTime(t.timestamp)}] ${t.speaker === "user" ? "You" : "Vox"}: ${t.text}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex flex-col h-full rounded-2xl md:rounded-3xl bg-black/25 backdrop-blur-2xl border border-white/5 overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Transcript Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-serif text-sm tracking-wide text-[#EDE4DC]">Conversation Ledger</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#AB947E] border border-white/5">
            {transcripts.length} turns
          </span>
        </div>

        <div className="flex items-center gap-2">
          {transcripts.length > 0 && (
            <>
              <button
                onClick={handleCopyTranscript}
                aria-label="Copy transcript to clipboard"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-[#AB947E] hover:text-white bg-white/4 hover:bg-white/8 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#C3A995]" />
                    <span className="text-[#C3A995] font-mono text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={onClearTranscripts}
                aria-label="Clear conversation transcript"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#8A7968] hover:text-[#C3A995] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript Turn Stream — Distinct Human (RIGHT) vs Agent (LEFT) Separation */}
      <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-5">
        {transcripts.length === 0 && !livePartial ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-8 space-y-3 select-none">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-[#8A7968]">
              <Radio className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="font-serif text-sm text-[#AB947E] tracking-wide">Live transcript ledger will appear here</p>
            <p className="text-xs text-[#8A7968] max-w-sm leading-relaxed">
              When a voice session begins, turn-by-turn dialogue between you and Vox will be recorded in real time.
            </p>
          </div>
        ) : (
          <>
            {transcripts.map((turn) => {
              const isUser = turn.speaker === "user";

              return (
                <div
                  key={turn.id}
                  className={`w-full flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Speaker Label */}
                  <div
                    className={`flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono ${
                      isUser ? "text-[#D4BEAC]" : "text-[#C3A995]"
                    }`}
                  >
                    <span>{isUser ? "YOU" : "VOX"}</span>
                    <span className="text-[#8A7968] text-[10px]">• {formatTime(turn.timestamp)}</span>
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? "bg-[#C3A995]/12 border border-[#C3A995]/20 text-[#EDE4DC] rounded-tr-sm"
                        : "bg-white/[0.04] border border-white/8 text-[#EDE4DC] rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    }`}
                  >
                    <p className="font-normal whitespace-pre-wrap">{turn.text}</p>
                  </div>
                </div>
              );
            })}

            {/* In-Flight Live Partial Speech Bubble */}
            {livePartial && (
              <div
                className={`w-full flex flex-col animate-in fade-in duration-150 ${
                  livePartial.speaker === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-center gap-2 mb-1.5 px-1 text-[11px] font-mono ${
                    livePartial.speaker === "user" ? "text-[#D4BEAC]" : "text-[#C3A995]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C3A995] animate-ping" />
                  <span>{livePartial.speaker === "user" ? "YOU (speaking...)" : "VOX (speaking...)"}</span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-xs md:text-sm italic leading-relaxed ${
                    livePartial.speaker === "user"
                      ? "bg-[#C3A995]/8 border border-[#C3A995]/30 text-[#EDE4DC] rounded-tr-sm"
                      : "bg-white/[0.03] border border-white/10 text-[#EDE4DC] rounded-tl-sm"
                  }`}
                >
                  <p>{livePartial.text}</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
