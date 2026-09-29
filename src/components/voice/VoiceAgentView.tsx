"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Clock,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useVoice } from "@/context/VoiceContext";
import { MatrixOrb, MatrixOrbState } from "@/components/ui/matrix-orb";
import { AudioWaves } from "@/components/ui/audio-waves";
import { VoiceTranscript } from "./VoiceTranscript";
import { SUPPORTED_VOICES, SUPPORTED_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function VoiceAgentView() {
  const {
    voiceState,
    transcripts,
    livePartial,
    error,
    isMuted,
    durationSeconds,
    userAudioLevel,
    agentAudioLevel,
    selectedVoice,
    setSelectedVoice,
    selectedLanguage,
    setSelectedLanguage,
    appliedConfig,
    startSession,
    endSession,
    toggleMute,
    clearTranscripts,
    resetError,
  } = useVoice();

  const [showConfig, setShowConfig] = useState(false);

  const isConnected = ["connected", "listening", "speaking"].includes(voiceState);
  const isConnecting = voiceState === "connecting";
  const isEnding = voiceState === "ending";

  // Keyboard shortcuts: M to mute/unmute, Shift+Escape to end call
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (isConnected) {
        if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          toggleMute();
        } else if (e.shiftKey && e.key === "Escape") {
          e.preventDefault();
          endSession();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnected, toggleMute, endSession]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    startSession({ voice: selectedVoice, language: selectedLanguage });
  };

  // Matrix Orb strict requirement: #F65102
  const orbColor = "#F65102";
  let matrixState: MatrixOrbState = "idle";
  let matrixLevel = 0.02;

  if (voiceState === "speaking") {
    matrixState = "thinking";
    matrixLevel = Math.max(0.2, Math.min(1.0, agentAudioLevel * 1.6));
  } else if (voiceState === "listening") {
    matrixState = "listening";
    matrixLevel = Math.max(0.18, Math.min(1.0, userAudioLevel * 1.6));
  } else if (voiceState === "connecting") {
    matrixState = "idle";
    matrixLevel = 0.25;
  } else if (voiceState === "connected") {
    matrixState = "idle";
    matrixLevel = 0.05;
  } else {
    matrixState = "idle";
    matrixLevel = 0.02;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      {/* Top Workspace Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-xl tracking-normal text-[#EDE4DC] font-normal">
              Voice Intelligence
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#C3A995]">
              {voiceState}
            </span>
          </div>
        </div>

        {/* Header Right: Call Duration & Compact Config Toggle */}
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono text-[#EDE4DC]">
              <Clock className="w-3.5 h-3.5 text-[#C3A995] animate-pulse" />
              <span>{formatTimer(durationSeconds)}</span>
            </div>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            aria-label="Toggle configuration panel"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#AB947E] hover:text-[#EDE4DC] bg-white/4 hover:bg-white/8 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C3A995]" />
            <span className="hidden sm:inline">Settings</span>
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Stage: Large Asymmetric Split */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 w-full max-w-[1600px] mx-auto items-stretch">
        {/* Left Column: Floating Orb Centerpiece (Zero Bounding Boxes) */}
        <div className="lg:w-[420px] shrink-0 flex flex-col items-center justify-center text-center py-6 select-none">
          {/* Floating Matrix Orb - STRICTLY #F65102, completely open in negative space */}
          <div className="relative mb-2 flex items-center justify-center bg-transparent">
            <MatrixOrb
              state={matrixState}
              level={matrixLevel}
              size={240}
              color={orbColor}
              dots={12}
            />
          </div>

          {/* Fluid AICSS Audio Waves - Lines Variant */}
          <div className="w-full max-w-xs mb-5">
            <AudioWaves
              voiceState={voiceState}
              userAudioLevel={userAudioLevel}
              agentAudioLevel={agentAudioLevel}
            />
          </div>

          {/* Real State Typography */}
          <div className="space-y-1 mb-6 max-w-xs">
            <h2 className="font-serif text-lg text-[#EDE4DC] tracking-wide font-normal">
              {voiceState === "idle" && "Ready to speak"}
              {voiceState === "connecting" && "Connecting WebRTC..."}
              {voiceState === "connected" && "Session active"}
              {voiceState === "listening" && "Listening..."}
              {voiceState === "speaking" && "Vox speaking"}
              {voiceState === "ending" && "Disconnecting..."}
              {voiceState === "ended" && "Session concluded"}
              {voiceState === "error" && "Connection unavailable"}
            </h2>
            <p className="text-xs text-[#8A7968] leading-relaxed">
              {voiceState === "idle" && "Click below to begin full-duplex conversational voice interaction."}
              {voiceState === "listening" && "Speak naturally into your microphone. Interrupt anytime."}
              {voiceState === "speaking" && "Vox is speaking. Natural turn endpointing is active."}
              {voiceState === "ended" && "Audio stream closed. Ready for next session."}
              {voiceState === "error" && "Verify CallMissed credentials and microphone permissions."}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-3 mb-6">
            {!isConnected && !isConnecting && (
              <button
                onClick={handleStart}
                className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-[#EDE4DC] hover:bg-white text-black text-xs font-semibold tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{voiceState === "ended" ? "Start New Conversation" : "Start Conversation"}</span>
              </button>
            )}

            {isConnecting && (
              <button
                disabled
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/5 text-[#AB947E] text-xs font-medium cursor-wait border border-white/5"
              >
                <Radio className="w-4 h-4 animate-spin text-[#C3A995]" />
                <span>Connecting WebRTC...</span>
              </button>
            )}

            {isConnected && (
              <>
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute microphone (Press M)" : "Mute microphone (Press M)"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isMuted
                      ? "bg-white/10 border-white/20 text-[#EDE4DC]"
                      : "bg-white/5 hover:bg-white/10 border-white/5 text-[#EDE4DC]"
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-[#C3A995]" /> : <Mic className="w-4 h-4" />}
                  <span>{isMuted ? "Unmute" : "Mute"}</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-black/40 text-[#8A7968]">
                    M
                  </kbd>
                </button>

                <button
                  onClick={endSession}
                  disabled={isEnding}
                  aria-label="End voice call (Press Shift+Escape)"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#EDE4DC] text-xs font-medium transition-all cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>{isEnding ? "Ending..." : "End Call"}</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-black/40 text-[#8A7968]">
                    ⇧Esc
                  </kbd>
                </button>
              </>
            )}

            {voiceState === "error" && (
              <button
                onClick={resetError}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#EDE4DC] text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C3A995]" />
                <span>Reset State</span>
              </button>
            )}
          </div>

          {/* Secondary Collapsible CallMissed Configuration Drawer */}
          <div
            id="callmissed-config-drawer"
            className={cn(
              "w-full max-w-sm rounded-2xl bg-black/35 backdrop-blur-xl border border-white/5 p-4 space-y-3.5 text-xs text-left animate-in fade-in duration-200 shadow-xl",
              !showConfig && "hidden"
            )}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[#EDE4DC]">
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#AB947E]">
                <Sparkles className="w-3 h-3 text-[#C3A995]" />
                <span>CallMissed Configuration</span>
              </span>
              <span className="text-[10px] font-mono text-[#C3A995] bg-white/5 px-2 py-0.5 rounded-md">
                Automatic VAD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <label htmlFor="voice-profile-select" className="text-[#8A7968] block mb-1 font-mono text-[10px] uppercase">
                  Voice Profile
                </label>
                <select
                  id="voice-profile-select"
                  data-testid="voice-profile-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-[#EDE4DC] text-xs outline-none focus:border-[#C3A995] disabled:opacity-50 cursor-pointer"
                >
                  {SUPPORTED_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender === "female" ? "Female" : "Male"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="voice-language-select" className="text-[#8A7968] block mb-1 font-mono text-[10px] uppercase">
                  Language (BCP-47)
                </label>
                <select
                  id="voice-language-select"
                  data-testid="voice-language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-[#EDE4DC] text-xs outline-none focus:border-[#C3A995] disabled:opacity-50 cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-[#8A7968] flex items-center justify-between">
              <span>{isConnected ? "Locked during active call" : "Changes apply to next session"}</span>
              {Boolean(appliedConfig?.voice) && (
                <span className="text-[#C3A995]">
                  Active: {String(appliedConfig?.voice)} ({String(appliedConfig?.language)})
                </span>
              )}
            </div>
          </div>

          {/* Diagnostic Error Card */}
          {error && (
            <div className="w-full max-w-sm mt-4 p-4 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#EDE4DC] space-y-2 text-left animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-medium text-[#C3A995]">
                <AlertTriangle className="w-4 h-4 text-[#C3A995]" />
                <span>CallMissed Notice ({error.type.toUpperCase()})</span>
              </div>
              <p className="text-[#AB947E] leading-relaxed">{error.message}</p>
              {error.details && (
                <p className="text-[11px] font-mono text-[#8A7968] bg-black/40 p-2 rounded-lg break-all">
                  {error.details}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Primary Live Conversation Transcript Workspace */}
        <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-[640px] w-full">
          <VoiceTranscript
            transcripts={transcripts}
            livePartial={livePartial}
            onClearTranscripts={clearTranscripts}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
