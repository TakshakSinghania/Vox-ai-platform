"use client";

import React from "react";
import Image from "next/image";
import {
  MessageSquare,
  Image as ImageIcon,
  Mic,
  MicOff,
  Radio,
  PhoneOff,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useVoice } from "@/context/VoiceContext";
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavTab = "chat" | "image" | "voice";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenDiagnostics: () => void;
  isKeyConfigured: boolean;
}

export function Sidebar({
  currentTab,
  onTabChange,
  onOpenDiagnostics,
  isKeyConfigured,
}: SidebarProps) {
  const { voiceState, isMuted, durationSeconds, toggleMute, endSession } = useVoice();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isVoiceActive = ["connecting", "connected", "listening", "speaking"].includes(voiceState);
  const isCollapsed = !isMobile && state === "collapsed";

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const navItems = [
    {
      id: "voice" as NavTab,
      label: "Voice Agent",
      icon: Mic,
      badge: "WebRTC",
      isLive: isVoiceActive,
    },
    {
      id: "chat" as NavTab,
      label: "AI Chat",
      icon: MessageSquare,
      badge: "Kimi",
    },
    {
      id: "image" as NavTab,
      label: "Image Studio",
      icon: ImageIcon,
      badge: "FLUX",
    },
  ];

  const handleSelectTab = (id: NavTab) => {
    onTabChange(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <ShadcnSidebar aria-label="Main Navigation" collapsible="icon">
      <SidebarHeader>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 pb-3 pt-1 mb-1">
            <div
              className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-black/40 p-1 shadow-sm transition-transform hover:scale-105 cursor-pointer"
              onClick={() => handleSelectTab("voice")}
              title="Vox"
            >
              <Image
                src="/images/vox-logo.png"
                alt="Vox Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
              {isVoiceActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#C3A995] animate-pulse" />
              )}
            </div>
            <SidebarTrigger className="p-1.5 text-[#AB947E] hover:text-white hover:bg-white/5 transition-colors rounded-lg" />
          </div>
        ) : (
          <div className="flex items-center justify-between pb-3 pt-1 mb-2">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-black/40 p-1 shadow-sm shrink-0">
                <Image
                  src="/images/vox-logo.png"
                  alt="Vox Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
                {isVoiceActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#C3A995] animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif tracking-normal text-[#EDE4DC] text-lg font-normal">Vox</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#C3A995] font-medium tracking-wider">
                    Studio
                  </span>
                </div>
                <p className="text-[11px] text-[#AB947E] font-normal tracking-wide">Intelligent Audio & AI</p>
              </div>
            </div>
            {!isMobile && (
              <SidebarTrigger className="p-1.5 text-[#AB947E] hover:text-white hover:bg-white/5 transition-colors rounded-lg" />
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Items Group */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase font-mono tracking-widest text-[#8A7968] px-2 mb-1">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => handleSelectTab(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      title={item.label}
                      data-nav-id={item.id}
                      className={cn(
                        "rounded-xl transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-white/8 text-[#EDE4DC] font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                          : "text-[#AB947E] hover:text-[#EDE4DC] hover:bg-white/4",
                        isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                      )}
                    >
                      {isCollapsed ? (
                        <div className="relative flex items-center justify-center">
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-transform group-hover:scale-110",
                              isActive ? "text-[#C3A995]" : "text-[#AB947E] group-hover:text-[#EDE4DC]"
                            )}
                          />
                          {item.isLive && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C3A995] animate-pulse" />
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={cn(
                                "w-4 h-4 transition-transform group-hover:scale-110",
                                isActive ? "text-[#C3A995]" : "text-[#AB947E] group-hover:text-[#EDE4DC]"
                              )}
                            />
                            <span className="text-xs tracking-wide">{item.label}</span>
                          </div>

                          {item.isLive ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#C3A995]/15 text-[#C3A995] border border-[#C3A995]/30 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C3A995]" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8A7968] font-mono">{item.badge}</span>
                          )}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* In-Call Active Notification / Mini Controls */}
        {isVoiceActive && currentTab !== "voice" && (
          isCollapsed ? (
            <button
              onClick={() => handleSelectTab("voice")}
              className="mt-3 w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-black/40 border border-[#C3A995]/30 text-[#C3A995] hover:scale-105 transition-all shadow-md relative group cursor-pointer"
              title={`In Call (${formatTimer(durationSeconds)}) - Click to open`}
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C3A995] animate-ping" />
            </button>
          ) : (
            <div className="mt-4 p-3 rounded-2xl bg-black/30 border border-white/5 shadow-lg space-y-2 animate-in fade-in duration-200">
              <div
                onClick={() => handleSelectTab("voice")}
                className="cursor-pointer group"
                title="Click to view Voice Agent"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-[#C3A995] font-medium group-hover:text-[#D4BEAC] transition-colors">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Call Active</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#AB947E] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimer(durationSeconds)}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A7968] capitalize flex items-center justify-between">
                  <span>{voiceState === "speaking" ? "Vox speaking..." : "Listening..."}</span>
                  <span className="text-[10px] text-[#C3A995] underline opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </p>
              </div>

              {/* Quick in-sidebar voice controls */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    isMuted
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-[#AB947E] hover:text-white"
                  }`}
                  title={isMuted ? "Unmute mic" : "Mute mic"}
                >
                  {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{isMuted ? "Unmute" : "Mute"}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    endSession();
                  }}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="End voice call"
                >
                  <PhoneOff className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        )}
      </SidebarContent>

      <SidebarFooter className={cn(isCollapsed && "items-center")}>
        {isCollapsed ? (
          <button
            onClick={onOpenDiagnostics}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/4 hover:bg-white/8 text-[#AB947E] hover:text-white transition-colors cursor-pointer"
            title={isKeyConfigured ? "CallMissed API: Connected" : "CallMissed API: Setup Needed"}
          >
            {isKeyConfigured ? (
              <ShieldCheck className="w-4 h-4 text-[#C3A995]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#8A7968]" />
            )}
          </button>
        ) : (
          <div className="space-y-1.5">
            <button
              onClick={onOpenDiagnostics}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/4 hover:bg-white/8 text-xs text-[#AB947E] hover:text-white transition-colors focus-visible:outline-none cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {isKeyConfigured ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C3A995]" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-[#8A7968]" />
                )}
                <span>CallMissed API</span>
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isKeyConfigured
                    ? "bg-[#C3A995]/10 text-[#C3A995] border border-[#C3A995]/20"
                    : "bg-white/5 text-[#8A7968] border border-white/5"
                }`}
              >
                {isKeyConfigured ? "Ready" : "Setup"}
              </span>
            </button>

            <div className="px-3 py-0.5 text-[10px] text-[#8A7968] flex items-center justify-between font-mono">
              <span>LiveKit WebRTC</span>
              <span>v1.13.1</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
