"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Copy, Check, ExternalLink, Key } from "lucide-react";
import { SystemStatusResponse } from "@/types/api";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatusResponse | null;
  onRefresh: () => void;
}

export function DiagnosticsModal({
  isOpen,
  onClose,
  status,
  onRefresh,
}: DiagnosticsModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const envSample = `CALLMISSED_API_KEY=cm_your_key_here
LLM_API_KEY=
IMAGE_API_KEY=`;

  const copyEnvSample = () => {
    navigator.clipboard.writeText(envSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-black/75 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-[#C3A995]" />
            <h3 id="diagnostics-modal-title" className="font-serif text-[#EDE4DC] text-base font-normal">
              System & API Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#AB947E] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[11px] text-[#8A7968] block mb-1 font-mono">CallMissed Voice</span>
              <div className="flex items-center gap-1.5 font-medium">
                {status?.configured.callmissed ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-[#C3A995]" />
                    <span className="text-[#C3A995] text-xs">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#8A7968]" />
                    <span className="text-[#8A7968] text-xs">Missing</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[11px] text-[#8A7968] block mb-1 font-mono">AI Chat</span>
              <div className="flex items-center gap-1.5 font-medium">
                {status?.configured.llm ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-[#C3A995]" />
                    <span className="text-[#C3A995] text-xs">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#8A7968]" />
                    <span className="text-[#8A7968] text-xs">Missing</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[11px] text-[#8A7968] block mb-1 font-mono">Image Studio</span>
              <div className="flex items-center gap-1.5 font-medium">
                {status?.configured.image ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-[#C3A995]" />
                    <span className="text-[#C3A995] text-xs">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#8A7968]" />
                    <span className="text-[#8A7968] text-xs">Missing</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Architecture note */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-[#EDE4DC] space-y-1.5">
            <p className="font-serif text-sm font-normal text-[#C3A995]">Security Architecture</p>
            <p className="text-[#AB947E] leading-relaxed text-[11px]">
              API keys are strictly isolated server-side inside Next.js Route Handlers. WebRTC browser sessions authenticate via short-lived ephemeral connection tokens generated per call.
            </p>
          </div>

          {/* Local setup instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#AB947E]">
                Configuration in <code className="text-[#C3A995]">.env.local</code>
              </span>
              <button
                onClick={copyEnvSample}
                className="flex items-center gap-1 text-[11px] text-[#AB947E] hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#C3A995]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-black/60 border border-white/5 text-xs font-mono text-[#EDE4DC] overflow-x-auto">
              {envSample}
            </pre>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
            <a
              href="https://console.callmissed.com/developer/keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[#C3A995] hover:text-white transition-colors"
            >
              <span>CallMissed Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#EDE4DC] text-xs font-medium transition-colors border border-white/5 cursor-pointer"
            >
              Recheck Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
