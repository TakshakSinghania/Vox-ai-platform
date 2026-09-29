"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DiagnosticsModal } from "@/components/layout/DiagnosticsModal";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ImageStudio } from "@/components/image/ImageStudio";
import { VoiceAgentView } from "@/components/voice/VoiceAgentView";
import { VoiceProvider } from "@/context/VoiceContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SystemStatusResponse } from "@/types/api";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function WorkspacePage() {
  return (
    <VoiceProvider>
      <SidebarProvider defaultOpen={false}>
        <WorkspaceContent />
      </SidebarProvider>
    </VoiceProvider>
  );
}

function WorkspaceContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>("voice");
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [dismissBanner, setDismissBanner] = useState(false);

  // Fetch server configuration status (safe flags only)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch {
      // Offline or network error
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setSystemStatus(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const isConfigured = Boolean(systemStatus?.configured?.callmissed);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-transparent text-[var(--foreground)]">
      {/* Mobile Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        isKeyConfigured={isConfigured}
      />

      {/* Desktop Persistent / Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        isKeyConfigured={isConfigured}
      />

      {/* Main Workspace Area with SidebarInset */}
      <SidebarInset>
        {/* Missing API Key Setup Banner */}
        {!isConfigured && !dismissBanner && systemStatus && (
          <div className="bg-black/40 border-b border-[#C3A995]/20 px-4 py-2.5 flex items-center justify-between text-xs text-[#EDE4DC] shrink-0 animate-in fade-in duration-200 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#C3A995] shrink-0" />
              <span>
                <strong className="font-semibold text-[#EDE4DC]">CallMissed API Key Required:</strong> Add{" "}
                <code className="bg-white/10 px-1 py-0.5 rounded text-[#EDE4DC] font-mono text-[11px]">
                  CALLMISSED_API_KEY
                </code>{" "}
                to your <code className="font-mono text-[11px]">.env.local</code> to activate live WebRTC voice, chat, and image generation.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDiagnosticsOpen(true)}
                className="underline hover:text-white font-medium flex items-center gap-1 text-[#C3A995] cursor-pointer"
              >
                <span>View Setup Guide</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setDismissBanner(true)}
                className="text-[#8A7968] hover:text-white text-[11px] cursor-pointer"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* View Containers (preserves tab state during active sessions) */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${currentTab === "chat" ? "flex" : "hidden"}`}>
          <ChatInterface />
        </div>

        <div className={`flex-1 flex flex-col h-full overflow-hidden ${currentTab === "image" ? "flex" : "hidden"}`}>
          <ImageStudio />
        </div>

        <div className={`flex-1 flex flex-col h-full overflow-hidden ${currentTab === "voice" ? "flex" : "hidden"}`}>
          <VoiceAgentView />
        </div>
      </SidebarInset>

      {/* Diagnostics / API Settings Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        status={systemStatus}
        onRefresh={fetchStatus}
      />
    </div>
  );
}
