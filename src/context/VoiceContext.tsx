"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";

type VoiceContextType = ReturnType<typeof useVoiceAgent>;

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const voice = useVoiceAgent();

  return (
    <VoiceContext.Provider value={voice}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}
