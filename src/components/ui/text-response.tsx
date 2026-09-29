"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextResponseProps {
  children?: ReactNode;
  className?: string;
}

/**
 * AICSS Text Response component.
 * Provides clean prose styling and tokenized layout for completed assistant answers.
 */
export function TextResponse({ children, className }: TextResponseProps) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none text-[var(--tr-fg)] leading-relaxed break-words",
        "[&_p]:mb-2.5 [&_p:last-child]:mb-0",
        "[&_code]:bg-[var(--tr-code-bg)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-[#C3A995]",
        className
      )}
    >
      {children}
    </div>
  );
}
