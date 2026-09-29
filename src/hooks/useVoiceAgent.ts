"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  TranscriptionSegment,
  RemoteTrack,
  RemoteTrackPublication,
} from "livekit-client";
import { VoiceState, VoiceTranscriptSegment, VoiceError, VoiceSessionResponse } from "@/types/voice";
import { generateId } from "@/lib/utils";
import { DEFAULT_VOICE_CONFIG } from "@/lib/constants";

export function useVoiceAgent() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcripts, setTranscripts] = useState<VoiceTranscriptSegment[]>([]);
  const [livePartial, setLivePartial] = useState<{ speaker: "user" | "agent"; text: string } | null>(null);
  const [error, setError] = useState<VoiceError | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Persistent user selections and actual applied configuration from CallMissed
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_CONFIG.voice);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_VOICE_CONFIG.language);
  const [appliedConfig, setAppliedConfig] = useState<Record<string, unknown> | null>(null);

  // Audio level indicators (0.0 to 1.0)
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [agentAudioLevel, setAgentAudioLevel] = useState(0);

  // Refs
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop duration timer
  const stopTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Audio cleanup
  const cleanupAudio = useCallback(() => {
    // Detach and remove all audio elements created by Track.attach()
    audioElementsRef.current.forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch {
        // Ignore detach errors
      }
    });
    audioElementsRef.current = [];

    // Stop audio meter animation loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore close error
      }
      audioContextRef.current = null;
    }

    userAnalyserRef.current = null;
    agentAnalyserRef.current = null;
    setUserAudioLevel(0);
    setAgentAudioLevel(0);
  }, []);

  // Full session disconnect & reset
  const endSession = useCallback(async () => {
    setVoiceState("ending");
    stopTimer();

    try {
      if (roomRef.current) {
        // Disconnect and turn off local mic track
        try {
          await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        } catch {
          // Ignore local mic disable error
        }
        await roomRef.current.disconnect();
        roomRef.current = null;
      }
    } catch (err) {
      console.warn("Error during room disconnect:", err);
    } finally {
      cleanupAudio();
      setVoiceState("ended");
      setLivePartial(null);
    }
  }, [stopTimer, cleanupAudio]);

  // Audio metering animation loop using Web Audio API Analysers
  const startAudioMeterLoop = useCallback(() => {
    const updateLevels = () => {
      // Calculate user mic level
      if (userAnalyserRef.current) {
        const dataArray = new Uint8Array(userAnalyserRef.current.frequencyBinCount);
        userAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        setUserAudioLevel(Math.min(1, avg * 2.5));
      }

      // Calculate agent remote audio level
      if (agentAnalyserRef.current) {
        const dataArray = new Uint8Array(agentAnalyserRef.current.frequencyBinCount);
        agentAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        setAgentAudioLevel(Math.min(1, avg * 2.5));
      }

      animFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animFrameRef.current = requestAnimationFrame(updateLevels);
  }, []);

  // Connect remote track to Agent Audio Analyser
  const attachRemoteAudioAnalyser = useCallback((track: Track) => {
    try {
      const mediaStreamTrack = track.mediaStreamTrack;
      if (!mediaStreamTrack) return;

      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const stream = new MediaStream([mediaStreamTrack]);
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      agentAnalyserRef.current = analyser;
    } catch (e) {
      console.warn("Unable to attach remote audio analyser:", e);
    }
  }, []);

  // Connect local microphone to User Audio Analyser
  const attachLocalAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      userAnalyserRef.current = analyser;
    } catch (e) {
      console.warn("Unable to attach local audio analyser:", e);
    }
  }, []);

  // Start Voice Session
  const startSession = useCallback(
    async (options?: { language?: string; voice?: string }) => {
      setError(null);
      setVoiceState("connecting");
      setLivePartial(null);
      setDurationSeconds(0);

      // Verify browser WebRTC support
      if (typeof window === "undefined" || !navigator.mediaDevices || !window.RTCPeerConnection) {
        setError({
          type: "unsupported",
          message: "Your browser does not support WebRTC voice calls. Please use Chrome, Safari, Edge, or Firefox.",
        });
        setVoiceState("error");
        return;
      }

      // 1. Verify microphone permission and device availability
      try {
        const streamProbe = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        // Release the probe tracks immediately so LiveKit manages the dedicated track
        streamProbe.getTracks().forEach((t) => t.stop());
      } catch (err: unknown) {
        let msg = "Microphone access was denied. Please allow microphone access in your browser settings to speak with Vox.";
        if (err instanceof DOMException) {
          if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            msg = "No microphone found on your system. Please plug in a microphone or headset and try again.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            msg = "Your microphone is already in use by another application. Please free it and try again.";
          }
        }
        setError({
          type: "permission",
          message: msg,
          details: err instanceof Error ? err.message : undefined,
        });
        setVoiceState("error");
        return;
      }

      // 2. Request CallMissed session credentials from our server API route
      let session: VoiceSessionResponse;
      const reqVoice = options?.voice || selectedVoice;
      const reqLanguage = options?.language || selectedLanguage;

      try {
        const res = await fetch("/api/voice/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: reqLanguage,
            voice: reqVoice,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          let detailMsg = data.code || `HTTP ${res.status}`;
          if (data.providerStatus === 403) {
            detailMsg = "HTTP 403 — API key lacks required voice permissions (stt, tts, llm).";
          } else if (data.providerStatus === 401) {
            detailMsg = "HTTP 401 — Invalid CallMissed API key credentials.";
          } else if (data.providerStatus === 400) {
            detailMsg = "HTTP 400 — Invalid voice or language configuration.";
          } else if (data.providerStatus === 429) {
            detailMsg = "HTTP 429 — CallMissed rate limit or quota ceiling reached.";
          } else if (data.code === "missing_api_key") {
            detailMsg = "Server configuration error — CALLMISSED_API_KEY is missing.";
          } else if (data.code === "callmissed_network_error") {
            detailMsg = "Network error — Next.js server unable to reach CallMissed Voice API.";
          }

          setError({
            type: "api",
            message: data.error || "CallMissed session creation failed.",
            details: detailMsg,
          });
          setVoiceState("error");
          return;
        }

        session = data;
        setSessionId(session.id);
        if (session.config) {
          setAppliedConfig(session.config);
        }
      } catch (err: unknown) {
        setError({
          type: "network",
          message: "Unable to reach Vox voice server.",
          details: err instanceof Error ? err.message : "Please check your network connection and verify the server is running.",
        });
        setVoiceState("error");
        return;
      }

      // 3. Connect to CallMissed WebRTC session via livekit-client Room
      try {
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        // Track incoming audio tracks (CallMissed Agent audio)
        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication, participant: Participant) => {
            if (track.kind === Track.Kind.Audio) {
              const audioEl = track.attach();
              audioEl.id = `vox-audio-${participant.identity}`;
              audioEl.autoplay = true;
              audioElementsRef.current.push(audioEl);
              document.body.appendChild(audioEl);

              // Explicitly trigger play to handle browser autoplay policies
              audioEl.play().catch((e) => {
                console.warn("Autoplay note:", e);
              });

              // Attach remote audio track to analyser for live waveform
              attachRemoteAudioAnalyser(track);
            }
          }
        );

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
        });

        // Live transcription events from CallMissed
        room.on(
          RoomEvent.TranscriptionReceived,
          (segments: TranscriptionSegment[], participant?: Participant) => {
            const isLocal = Boolean(participant?.isLocal);
            const speaker: "user" | "agent" = isLocal ? "user" : "agent";

            for (const seg of segments) {
              const segmentId = seg.id || generateId("seg");
              if (seg.final) {
                // Finalized speech segment
                setTranscripts((prev) => {
                  if (prev.some((t) => t.id === segmentId)) return prev;
                  return [
                    ...prev,
                    {
                      id: segmentId,
                      speaker,
                      text: seg.text.trim(),
                      isFinal: true,
                      timestamp: new Date(),
                    },
                  ];
                });
                setLivePartial(null);
              } else {
                // Partial speech segment (streaming live preview)
                if (seg.text && seg.text.trim().length > 0) {
                  setLivePartial({
                    speaker,
                    text: seg.text.trim(),
                  });
                }
              }
            }
          }
        );

        // Active speaker detection and interruption handling
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          if (speakers.length === 0) {
            setVoiceState((cur) => (cur === "speaking" ? "listening" : cur));
          } else {
            const hasRemoteSpeaker = speakers.some((s) => !s.isLocal);
            const hasLocalSpeaker = speakers.some((s) => s.isLocal);

            if (hasLocalSpeaker && hasRemoteSpeaker) {
              // Interruption happening! Prioritize user speech
              setVoiceState("listening");
            } else if (hasRemoteSpeaker) {
              setVoiceState("speaking");
            } else if (hasLocalSpeaker) {
              setVoiceState("listening");
            }
          }
        });

        // Connection lifecycle events
        room.on(RoomEvent.Connected, () => {
          setVoiceState("connected");
          setIsMuted(false);

          // Start duration timer
          stopTimer();
          durationTimerRef.current = setInterval(() => {
            setDurationSeconds((sec) => sec + 1);
          }, 1000);

          setTimeout(() => {
            setVoiceState("listening");
          }, 600);
        });

        room.on(RoomEvent.Disconnected, () => {
          cleanupAudio();
          setVoiceState("ended");
          stopTimer();
        });

        room.on(RoomEvent.Reconnecting, () => {
          setVoiceState("connecting");
        });

        room.on(RoomEvent.Reconnected, () => {
          setVoiceState("listening");
        });

        // Connect room to CallMissed WebRTC server
        await room.connect(session.ws_url, session.token);

        // Enable microphone in the LiveKit room
        await room.localParticipant.setMicrophoneEnabled(true);

        // Connect local microphone track to visualizer analyser
        const localPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (localPub?.track?.mediaStreamTrack) {
          const micStream = new MediaStream([localPub.track.mediaStreamTrack]);
          attachLocalAudioAnalyser(micStream);
        }
        startAudioMeterLoop();
      } catch (err: unknown) {
        cleanupAudio();
        stopTimer();
        setError({
          type: "runtime",
          message: "Failed to establish WebRTC connection to CallMissed agent.",
          details: err instanceof Error ? err.message : undefined,
        });
        setVoiceState("error");
      }
    },
    [
      selectedVoice,
      selectedLanguage,
      attachLocalAudioAnalyser,
      attachRemoteAudioAnalyser,
      startAudioMeterLoop,
      stopTimer,
      cleanupAudio,
    ]
  );

  // Toggle Mute / Unmute
  const toggleMute = useCallback(async () => {
    if (!roomRef.current) return;
    try {
      const nextMuted = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } catch (e) {
      console.warn("Failed to toggle microphone state:", e);
    }
  }, [isMuted]);

  // Clear Transcripts
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setLivePartial(null);
  }, []);

  // Full State Reset: clears error, session, room, connection state, transcript, audio state, and stale config
  const resetState = useCallback(() => {
    stopTimer();
    if (roomRef.current) {
      try {
        roomRef.current.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      } catch {
        // ignore
      }
      try {
        roomRef.current.disconnect();
      } catch {
        // ignore
      }
      roomRef.current = null;
    }
    cleanupAudio();
    setError(null);
    setSessionId(null);
    setAppliedConfig(null);
    setVoiceState("idle");
    setTranscripts([]);
    setLivePartial(null);
    setIsMuted(false);
    setDurationSeconds(0);
    setUserAudioLevel(0);
    setAgentAudioLevel(0);
  }, [stopTimer, cleanupAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      cleanupAudio();
    };
  }, [stopTimer, cleanupAudio]);

  return {
    voiceState,
    transcripts,
    livePartial,
    error,
    isMuted,
    sessionId,
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
    resetError: resetState,
    resetState,
  };
}
