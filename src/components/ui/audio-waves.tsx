"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { VoiceState } from "@/types/voice";

export interface AudioWavesProps extends React.ComponentProps<"div"> {
  voiceState: VoiceState;
  userAudioLevel: number;
  agentAudioLevel: number;
}

interface WaveLineConfig {
  color: string;
  baseAlpha: number;
  activeAlpha: number;
  lineWidth: number;
  freq: number;
  speed: number;
  offset: number;
}

const WAVE_LINES: WaveLineConfig[] = [
  {
    color: "195, 169, 149", // #C3A995 Warm Beige
    baseAlpha: 0.4,
    activeAlpha: 0.95,
    lineWidth: 1.5,
    freq: 0.018,
    speed: 0.035,
    offset: 0,
  },
  {
    color: "212, 190, 172", // #D4BEAC Soft Beige
    baseAlpha: 0.28,
    activeAlpha: 0.75,
    lineWidth: 1.25,
    freq: 0.026,
    speed: 0.028,
    offset: 1.5,
  },
  {
    color: "171, 148, 126", // #AB947E Muted Beige
    baseAlpha: 0.2,
    activeAlpha: 0.55,
    lineWidth: 1.0,
    freq: 0.014,
    speed: -0.022,
    offset: 3.2,
  },
  {
    color: "237, 228, 220", // #EDE4DC Warm Ivory White
    baseAlpha: 0.15,
    activeAlpha: 0.45,
    lineWidth: 1.0,
    freq: 0.032,
    speed: 0.045,
    offset: 4.8,
  },
];

export function AudioWaves({
  voiceState,
  userAudioLevel,
  agentAudioLevel,
  className,
  ...props
}: AudioWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedLevelRef = useRef(0.02);
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

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const displayWidth = canvas.clientWidth || 360;
    const displayHeight = canvas.clientHeight || 40;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const { voiceState: state, userAudioLevel: userLvl, agentAudioLevel: agentLvl } = levelsRef.current;
      const width = displayWidth;
      const height = displayHeight;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const isAgentSpeaking = state === "speaking";
      const isUserSpeaking = state === "listening" && userLvl > 0.03;
      const isConnected = ["connected", "listening", "speaking"].includes(state);
      const isEnded = state === "ended";

      // Compute target audio level
      let targetLevel = 0.02;
      if (isEnded) {
        targetLevel = 0.005;
      } else if (isAgentSpeaking) {
        targetLevel = Math.max(0.2, Math.min(1.0, agentLvl * 1.8));
      } else if (isUserSpeaking) {
        targetLevel = Math.max(0.18, Math.min(1.0, userLvl * 1.8));
      } else if (isConnected) {
        targetLevel = 0.06;
      } else if (state === "connecting") {
        targetLevel = 0.08;
      }

      // Smooth interpolation for fluid motion
      smoothedLevelRef.current += (targetLevel - smoothedLevelRef.current) * 0.12;
      const activeLevel = smoothedLevelRef.current;
      const maxAmplitude = (height / 2 - 3) * Math.max(0.04, activeLevel);

      // Draw layered horizontal wave lines
      for (const line of WAVE_LINES) {
        ctx.beginPath();
        const alpha =
          line.baseAlpha + (line.activeAlpha - line.baseAlpha) * Math.min(1.0, activeLevel * 2.5);
        ctx.strokeStyle = `rgba(${line.color}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = line.lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        const step = 3;
        let isFirstPoint = true;

        for (let x = 0; x <= width; x += step) {
          // Hanning window envelope: forces wave to taper flush to center at both left and right edges
          const envelope = Math.sin((x / width) * Math.PI);

          // Harmonic sine wave calculation
          const wave =
            Math.sin(x * line.freq + phase * line.speed + line.offset) * 0.75 +
            Math.sin(x * (line.freq * 1.5) - phase * (line.speed * 0.7)) * 0.25;

          const y = centerY + wave * maxAmplitude * envelope;

          if (isFirstPoint) {
            ctx.moveTo(x, y);
            isFirstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      phase += 1;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      data-slot="audio-waves"
      className={cn(
        "w-full h-10 relative flex items-center justify-center overflow-hidden bg-transparent select-none",
        className
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}

export default AudioWaves;
