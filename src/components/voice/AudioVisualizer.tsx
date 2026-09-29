"use client";

import React, { useEffect, useRef } from "react";
import { VoiceState } from "@/types/voice";

interface AudioVisualizerProps {
  voiceState: VoiceState;
  userAudioLevel: number;
  agentAudioLevel: number;
}

export function AudioVisualizer({
  voiceState,
  userAudioLevel,
  agentAudioLevel,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedLevelRef = useRef(0.02);

  // Store latest audio levels in refs so the animation loop always reads current values smoothly
  const levelsRef = useRef({ voiceState, userAudioLevel, agentAudioLevel });
  useEffect(() => {
    levelsRef.current = { voiceState, userAudioLevel, agentAudioLevel };
  }, [voiceState, userAudioLevel, agentAudioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    // Retina display resolution support
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const displayWidth = canvas.clientWidth || 600;
    const displayHeight = canvas.clientHeight || 96;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const { voiceState: state, userAudioLevel: userLvl, agentAudioLevel: agentLvl } = levelsRef.current;
      
      const width = displayWidth;
      const height = displayHeight;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Determine target audio level and theme
      const isAgentSpeaking = state === "speaking";
      const isUserSpeaking = state === "listening" && userLvl > 0.04;
      const isConnected = ["connected", "listening", "speaking"].includes(state);

      const targetLevel = isAgentSpeaking
        ? Math.max(0.12, Math.min(1.0, agentLvl * 1.4))
        : isUserSpeaking
        ? Math.max(0.12, Math.min(1.0, userLvl * 1.5))
        : isConnected
        ? 0.035
        : 0.01;

      // Temporal smoothing (lerp) for analog organic response
      smoothedLevelRef.current += (targetLevel - smoothedLevelRef.current) * 0.14;
      const activeLevel = smoothedLevelRef.current;

      // Color scheme (Vox warm palette)
      let primaryColor = "rgba(195, 169, 149, 0.4)"; // Vox primary standby
      let glowColor = "rgba(195, 169, 149, 0.08)";

      if (isAgentSpeaking) {
        primaryColor = "rgba(195, 169, 149, 0.95)"; // vivid Vox primary
        glowColor = "rgba(195, 169, 149, 0.2)";
      } else if (isUserSpeaking) {
        primaryColor = "rgba(52, 211, 153, 0.95)"; // vivid emerald for user
        glowColor = "rgba(16, 185, 129, 0.2)";
      } else if (isConnected) {
        primaryColor = "rgba(171, 148, 126, 0.5)"; // Vox secondary
        glowColor = "rgba(171, 148, 126, 0.1)";
      }

      // Draw subtle background ambient glow in the center
      const centerGlow = ctx.createRadialGradient(
        width / 2, centerY, 5,
        width / 2, centerY, width / 2
      );
      centerGlow.addColorStop(0, glowColor);
      centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // Multi-harmonic sine waves
      const waves = [
        { freq: 0.018, speed: 0.05, amp: activeLevel * (height * 0.44), alpha: 0.9, width: 2.2 },
        { freq: 0.028, speed: -0.035, amp: activeLevel * (height * 0.32), alpha: 0.55, width: 1.6 },
        { freq: 0.012, speed: 0.025, amp: activeLevel * (height * 0.22), alpha: 0.3, width: 1.2 },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.lineWidth = w.width;
        ctx.strokeStyle = primaryColor;
        ctx.globalAlpha = w.alpha;

        for (let x = 0; x < width; x += 2) {
          // Windowing envelope (sin curve) so the waves gracefully taper to 0 at edges
          const envelope = Math.sin((Math.PI * x) / width);
          const y = centerY + Math.sin(x * w.freq + phase * w.speed) * w.amp * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      phase += 1;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full h-24 relative flex items-center justify-center overflow-hidden rounded-2xl bg-neutral-950/70 border border-neutral-800/80 shadow-inner">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-1 flex justify-between px-3 text-[10px] font-mono text-neutral-500 pointer-events-none">
        <span>WebAudio Stream</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              voiceState === "speaking"
                ? "bg-[#C3A995] animate-ping"
                : voiceState === "listening"
                ? "bg-emerald-400 animate-pulse"
                : "bg-neutral-600"
            }`}
          />
          {voiceState === "speaking"
            ? "AGENT AUDIO"
            : voiceState === "listening"
            ? "USER INPUT"
            : "IDLE"}
        </span>
      </div>
    </div>
  );
}
