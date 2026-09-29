"use client";

import React, { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

/**
 * AICSS Streaming Text component adapted for live SSE streams.
 * Prevents animation reset on token arrival while delivering smooth typewriter pacing
 * and an adaptive solid/blinking caret.
 */
export function StreamingText({
  text,
  isStreaming = true,
  className,
}: StreamingTextProps) {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState("");
  const targetTextRef = useRef(text);

  useEffect(() => {
    targetTextRef.current = text;
  }, [text]);

  useEffect(() => {
    if (reduce) return;

    const interval = setInterval(() => {
      setShown((current) => {
        const target = targetTextRef.current;
        if (target.length < current.length) {
          return "";
        }
        if (current.length >= target.length) {
          return current;
        }
        const remaining = target.length - current.length;
        const step = Math.max(1, Math.min(remaining, Math.ceil(remaining / 5)));
        return target.slice(0, current.length + step);
      });
    }, 12);

    return () => clearInterval(interval);
  }, [reduce]);

  const displayedText = reduce ? text : shown;
  const isCatchingUp = !reduce && shown.length < text.length;
  const isCaretSteady = isStreaming || isCatchingUp;

  return (
    <div
      className={cn(
        "max-w-none text-sm leading-relaxed text-[var(--st-fg)] whitespace-pre-wrap break-words font-sans",
        className
      )}
    >
      <span>{displayedText}</span>
      <span
        aria-hidden="true"
        className={cn(
          "inline-block w-2 h-4 ml-1 rounded-xs bg-[var(--st-caret)] align-text-bottom select-none transition-opacity",
          isCaretSteady ? "opacity-100" : "animate-[caret-blink_1s_step-end_infinite]"
        )}
      />
    </div>
  );
}
