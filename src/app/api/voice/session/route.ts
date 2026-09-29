import { NextResponse } from "next/server";
import {
  VOICE_AGENT_SYSTEM_PROMPT,
  VOICE_AGENT_GREETING,
  DEFAULT_VOICE_CONFIG,
  SUPPORTED_VOICES,
  SUPPORTED_LANGUAGES,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.CALLMISSED_API_KEY;

    const hasApiKey = Boolean(apiKey && apiKey.trim() !== "");
    console.log(`[Voice Session] Request received. CALLMISSED_API_KEY present: ${hasApiKey}`);

    if (!hasApiKey) {
      console.error("[Voice Session] Missing CALLMISSED_API_KEY in environment");
      return NextResponse.json(
        {
          error: "CALLMISSED_API_KEY is not configured on the server. Please check your .env.local configuration.",
          code: "missing_api_key",
        },
        { status: 500 }
      );
    }

    // Parse client configuration overrides
    let customLanguage = DEFAULT_VOICE_CONFIG.language;
    let customVoice = DEFAULT_VOICE_CONFIG.voice;

    try {
      const body = await request.json();
      if (body.language && typeof body.language === "string") {
        const cleanedLang = body.language.trim();
        const matchedLang = SUPPORTED_LANGUAGES.find(
          (l) => l.code.toLowerCase() === cleanedLang.toLowerCase()
        );
        customLanguage = matchedLang ? matchedLang.code : cleanedLang;
      }
      if (body.voice && typeof body.voice === "string") {
        const cleanedVoice = body.voice.trim().toLowerCase();
        const matchedVoice = SUPPORTED_VOICES.find((v) => v.id.toLowerCase() === cleanedVoice);
        customVoice = matchedVoice ? matchedVoice.id : cleanedVoice;
      }
    } catch {
      // Empty or non-JSON body is acceptable; fallback to defaults
    }

    // Build CallMissed payload
    // Note: CallMissed supports system_prompt, greeting, voice, language, max_duration_seconds.
    const payload: Record<string, unknown> = {
      system_prompt: VOICE_AGENT_SYSTEM_PROMPT,
      greeting: VOICE_AGENT_GREETING,
      voice: customVoice,
      language: customLanguage,
      max_duration_seconds: DEFAULT_VOICE_CONFIG.max_duration_seconds,
    };

    console.log(`[Voice Session] Dispatching to CallMissed: voice=${customVoice}, language=${customLanguage}`);

    let response: Response;
    try {
      response = await fetch("https://api.callmissed.com/v1/voice/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey!.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (networkError: unknown) {
      const msg = networkError instanceof Error ? networkError.message : String(networkError);
      console.error("[Voice Session] Fetch to CallMissed network failure:", msg);
      return NextResponse.json(
        {
          error: "Unable to reach CallMissed Voice API. Check network connectivity or server DNS.",
          code: "callmissed_network_error",
          details: msg,
        },
        { status: 502 }
      );
    }

    console.log(`[Voice Session] CallMissed HTTP status: ${response.status}`);

    const responseText = await response.text();
    interface CallMissedSessionPayload {
      id?: string;
      ws_url?: string;
      token?: string;
      status?: string;
      config?: Record<string, unknown>;
      error?: { message?: string };
      detail?: string | Record<string, unknown>;
      message?: string;
    }
    let sessionData: CallMissedSessionPayload = {};
    try {
      sessionData = JSON.parse(responseText);
    } catch {
      console.error("[Voice Session] Non-JSON response received from CallMissed:", responseText);
      return NextResponse.json(
        {
          error: "CallMissed returned an invalid non-JSON response.",
          code: "invalid_provider_response",
          raw: responseText.slice(0, 200),
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(`[Voice Session] CallMissed rejected request (${response.status}):`, JSON.stringify(sessionData));
      let errorMessage = "Unable to start voice session. Please try again.";
      if (sessionData?.error?.message) {
        errorMessage = sessionData.error.message;
      } else if (sessionData?.detail) {
        errorMessage = typeof sessionData.detail === "string" ? sessionData.detail : JSON.stringify(sessionData.detail);
      } else if (sessionData?.message) {
        errorMessage = sessionData.message;
      } else if (response.status === 401) {
        errorMessage = "Invalid CallMissed API key. Please check your credentials.";
      } else if (response.status === 403) {
        errorMessage = "CallMissed API key lacks voice session permissions (stt, tts, llm required).";
      } else if (response.status === 429) {
        errorMessage = "CallMissed rate limit or credit ceiling reached. Please wait a moment.";
      } else if (response.status >= 500) {
        errorMessage = "CallMissed upstream voice service is temporarily unavailable.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: `upstream_${response.status}`,
          providerStatus: response.status,
          providerDetails: sessionData,
        },
        { status: response.status }
      );
    }

    // Validate that CallMissed returned required WebRTC credentials
    if (!sessionData.ws_url || !sessionData.token) {
      console.error("[Voice Session] Malformed session response (missing ws_url or token):", sessionData);
      return NextResponse.json(
        {
          error: "CallMissed session creation succeeded but returned missing WebRTC credentials.",
          code: "malformed_session_response",
        },
        { status: 502 }
      );
    }

    console.log(`[Voice Session] Session created successfully. ID: ${sessionData.id}, ws_url: ${sessionData.ws_url}`);

    // Return session credentials and applied config to client
    return NextResponse.json({
      id: sessionData.id,
      ws_url: sessionData.ws_url,
      wsUrl: sessionData.ws_url,
      token: sessionData.token,
      status: sessionData.status || "created",
      config: sessionData.config,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Voice Session] Unexpected error in /api/voice/session:", err);
    return NextResponse.json(
      {
        error: "Internal server error occurred while preparing voice session.",
        code: "internal_server_error",
        details: message,
      },
      { status: 500 }
    );
  }
}
