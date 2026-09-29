export type VoiceState =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "speaking"
  | "ending"
  | "ended"
  | "error";

export interface VoiceSessionResponse {
  id: string;
  ws_url: string;
  token: string;
  status: string;
  config?: Record<string, unknown>;
}

export interface VoiceTranscriptSegment {
  id: string;
  speaker: "user" | "agent";
  text: string;
  isFinal: boolean;
  timestamp: Date;
}

export interface VoiceError {
  type: "permission" | "network" | "api" | "unsupported" | "runtime";
  message: string;
  details?: string;
}

export interface VoiceConfig {
  language: string;
  voice: string;
  greeting?: string;
  systemPrompt?: string;
}
