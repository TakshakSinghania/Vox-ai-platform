"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck, AlertCircle, Radio } from "lucide-react";
import { NavTab } from "./Sidebar";
import { useVoice } from "@/context/VoiceContext";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenDiagnostics: () => void;
  isKeyConfigured: boolean;
}

export function Header({
  onTabChange,
  onOpenDiagnostics,
  isKeyConfigured,
}: HeaderProps) {
  const { voiceState, durationSeconds } = useVoice();
  const isVoiceActive = ["connecting", "connected", "listening", "speaking"].includes(voiceState);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="md:hidden bg-black/25 backdrop-blur-xl sticky top-0 z-40 px-4 py-3 shrink-0 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SidebarTrigger className="text-[#AB947E] hover:text-white" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/40 p-0.5 shadow-sm flex items-center justify-center">
              <Image
                src="/images/vox-logo.png"
                alt="Vox Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-serif text-[#EDE4DC] text-base tracking-normal">Vox</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVoiceActive && (
            <button
              onClick={() => onTabChange("voice")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C3A995]/15 text-[#C3A995] border border-[#C3A995]/30 text-xs font-mono animate-pulse"
              title="Return to Voice Call"
            >
              <Radio className="w-3 h-3" />
              <span>LIVE</span>
              <span className="text-[10px] text-[#EDE4DC] font-mono ml-0.5">
                {formatTimer(durationSeconds)}
              </span>
            </button>
          )}

          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 rounded-lg text-[#AB947E] hover:text-white hover:bg-white/5 focus-visible:outline-none cursor-pointer"
            aria-label="API Diagnostics"
          >
            {isKeyConfigured ? (
              <ShieldCheck className="w-4 h-4 text-[#C3A995]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#8A7968]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
