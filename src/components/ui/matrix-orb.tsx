"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export type MatrixOrbState = "idle" | "listening" | "thinking";

export type MatrixOrbProps = React.ComponentProps<"div"> & {
  state?: MatrixOrbState;
  level?: number;
  size?: number;
  color?: string;
  dots?: number;
  labels?: Partial<Record<MatrixOrbState, string>>;
  showLabel?: boolean;
};

const TAU = Math.PI * 2;
const STATES: MatrixOrbState[] = ["idle", "listening", "thinking"];

const LABELS: Record<MatrixOrbState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
};

const SCALE: Record<MatrixOrbState, number> = {
  idle: 0.88,
  listening: 1.0,
  thinking: 0.94,
};

const STIFFNESS = 180;
const DAMPING = 26;
const ATTACK = 0.22;
const RELEASE = 0.08;
const BLEND = 0.16;

const ORBITERS = [
  { radius: 0.62, speed: 2.2, phase: 0, spread: 0.42 },
  { radius: 0.4, speed: -1.7, phase: 2.1, spread: 0.36 },
  { radius: 0.8, speed: 1.15, phase: 4, spread: 0.34 },
];

function envelope(t: number) {
  const slow = 0.5 + 0.5 * Math.sin(t * 0.62 + 0.4);
  const fast = 0.5 + 0.5 * Math.sin(t * 1.9 + 1.1);
  return 0.22 + 0.78 * (0.45 + 0.55 * slow) * fast;
}

function intensityOf(
  state: MatrixOrbState,
  d: number,
  nx: number,
  ny: number,
  t: number,
  amplitude: number
) {
  if (state === "listening") {
    const ripple = 0.5 + 0.5 * Math.sin(d * 4.2 - t * 3);
    return 0.32 + amplitude * (0.34 + 0.38 * ripple);
  }

  if (state === "thinking") {
    let heat = 0;
    for (const o of ORBITERS) {
      const a = t * o.speed + o.phase;
      const dx = nx - Math.cos(a) * o.radius;
      const dy = ny - Math.sin(a) * o.radius;
      heat += Math.exp(-(dx * dx + dy * dy) / (o.spread * o.spread));
    }
    return 0.26 + 0.8 * Math.min(1, heat);
  }

  return 0.58 + 0.14 * Math.sin(t * 1.05 - d * 2.4);
}

function subscribeToZoom(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useDevicePixelRatio() {
  return useSyncExternalStore(
    subscribeToZoom,
    () => (typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 4) : 1),
    () => 1
  );
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => (typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    () => false
  );
}

export function MatrixOrb({
  state = "idle",
  level,
  size = 220,
  color = "#F65102",
  dots = 12,
  labels,
  showLabel = false,
  className,
  ...props
}: MatrixOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  const redrawRef = useRef<(() => void) | null>(null);
  const dpr = useDevicePixelRatio();
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    stateRef.current = state;
    levelRef.current = level;
  }, [state, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const buffer = Math.round(size * dpr);
    canvas.width = canvas.height = buffer;
    ctx.scale(buffer / size, buffer / size);

    const grid = Math.max(3, Math.round(dots));
    const half = (grid - 1) / 2;
    const spacing = (size * 0.74) / (grid - 1);
    const maxRadius = spacing * 0.6;
    const center = size / 2;

    const weights: Record<MatrixOrbState, number> = { idle: 0, listening: 0, thinking: 0 };
    weights[stateRef.current] = 1;

    const levelAt = (t: number) => {
      const v = levelRef.current;
      return v === undefined || !Number.isFinite(v)
        ? envelope(t)
        : Math.min(1, Math.max(0, v));
    };

    const draw = (t: number, amplitude: number, scale: number) => {
      ctx.clearRect(0, 0, size, size);

      for (let iy = 0; iy < grid; iy++) {
        for (let ix = 0; ix < grid; ix++) {
          const nx = (ix - half) / half;
          const ny = (iy - half) / half;
          const d = Math.hypot(nx, ny);
          if (d > 1.12) continue;

          let blended = 0;
          for (const s of STATES) {
            if (weights[s] < 0.001) continue;
            blended += weights[s] * intensityOf(s, d, nx, ny, t, amplitude);
          }

          const intensity = Math.min(1, Math.max(0, blended));
          const radius = maxRadius * Math.exp(-d * d * 1.7) * intensity * scale;
          if (radius * dpr < 0.5) continue;

          // Strict Kinetic Orange #F65102 (rgb: 246, 81, 2)
          const alpha = Math.min(1, Math.max(0.18, intensity * 0.96));
          if (color === "#F65102" || !color) {
            if (d < 0.45) {
              ctx.fillStyle = `rgba(246, 81, 2, ${alpha})`;
            } else if (d < 0.8) {
              ctx.fillStyle = `rgba(246, 81, 2, ${(alpha * 0.88).toFixed(3)})`;
            } else {
              ctx.fillStyle = `rgba(246, 81, 2, ${(alpha * 0.72).toFixed(3)})`;
            }
          } else {
            ctx.fillStyle = color;
          }

          ctx.beginPath();
          ctx.arc(
            center + (ix - half) * spacing * scale,
            center + (iy - half) * spacing * scale,
            radius,
            0,
            TAU
          );
          ctx.fill();
        }
      }
    };

    if (reduce) {
      redrawRef.current = () => {
        const current = stateRef.current;
        for (const s of STATES) weights[s] = s === current ? 1 : 0;
        draw(0, levelAt(0), SCALE[current]);
      };
      redrawRef.current();
      return () => {
        redrawRef.current = null;
      };
    }

    let t = 0;
    let amplitude = 0;
    let scale = SCALE[stateRef.current];
    let velocity = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      const current = stateRef.current;
      const target = levelAt(t);
      const rate = target > amplitude ? ATTACK : RELEASE;
      amplitude += (target - amplitude) * (1 - Math.pow(1 - rate, dt * 60));

      const step = 1 - Math.pow(1 - BLEND, dt * 60);
      for (const s of STATES) {
        weights[s] += ((s === current ? 1 : 0) - weights[s]) * step;
      }

      velocity += (-STIFFNESS * (scale - SCALE[current]) - DAMPING * velocity) * dt;
      scale += velocity * dt;

      draw(t, amplitude, scale);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [size, color, dots, dpr, reduce]);

  useEffect(() => {
    redrawRef.current?.();
  }, [state, level]);

  return (
    <div
      data-slot="matrix-orb"
      data-state={state}
      className={cn(
        "flex flex-col items-center justify-center relative select-none bg-transparent border-0 outline-none shadow-none ring-0 p-0 m-0",
        className
      )}
      style={{ background: "transparent" }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block bg-transparent border-0 outline-none shadow-none ring-0 pointer-events-none"
        style={{ width: size, height: size, background: "transparent" }}
      />
      {showLabel && (
        <span role="status" aria-live="polite" className="text-xs text-[#F65102]/80 font-mono mt-1">
          {labels?.[state] ?? LABELS[state]}
        </span>
      )}
    </div>
  );
}

export default MatrixOrb;
