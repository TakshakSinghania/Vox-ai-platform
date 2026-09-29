"use client";

import styles from "./ThinkingState.module.css";

export function ThinkingState({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${styles.shimmer} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#C3A995] animate-pulse" />
      <span>Thinking</span>
    </span>
  );
}
