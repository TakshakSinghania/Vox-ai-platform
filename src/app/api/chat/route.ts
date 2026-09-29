import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.CALLMISSED_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = (
      process.env.LLM_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.callmissed.com/v1"
    ).replace(/\/$/, "");

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error: "No AI Chat API key configured. Please set CALLMISSED_API_KEY or LLM_API_KEY in your .env.local file.",
          code: "missing_api_key",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { messages, model, stream = true } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' array is required." },
        { status: 400 }
      );
    }

    // Default to kimi-k2.5 on CallMissed, or gpt-4o-mini if OpenAI baseUrl
    const selectedModel =
      model ||
      (baseURL.includes("callmissed.com") ? "kimi-k2.5" : "gpt-4o-mini");

    const systemPrompt = {
      role: "system",
      content:
        "You are Vox, an intelligent, helpful, and concise AI assistant built into the Vox real-time voice, chat, and image platform. Provide clear, accurate answers with clean Markdown formatting when helpful.",
    };

    // Prepare messages array with system prompt if not present
    const formattedMessages =
      messages[0]?.role === "system"
        ? messages
        : [systemPrompt, ...messages];

    const upstreamResponse = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: formattedMessages,
        stream: stream,
        temperature: 0.7,
      }),
    });

    if (!upstreamResponse.ok) {
      let errorMessage = "AI Chat provider returned an error.";
      try {
        const errJson = await upstreamResponse.json();
        if (errJson?.error?.message) {
          errorMessage = errJson.error.message;
        } else if (errJson?.message) {
          errorMessage = errJson.message;
        }
      } catch {
        if (upstreamResponse.status === 401) {
          errorMessage = "Invalid API key provided for AI Chat.";
        } else if (upstreamResponse.status === 429) {
          errorMessage = "Chat rate limit or credit quota exceeded. Please try again in a moment.";
        } else if (upstreamResponse.status >= 500) {
          errorMessage = "AI Chat provider service is currently unavailable.";
        }
      }

      return NextResponse.json(
        { error: errorMessage, code: `upstream_${upstreamResponse.status}` },
        { status: upstreamResponse.status }
      );
    }

    // If non-streaming requested
    if (!stream) {
      const data = await upstreamResponse.json();
      const content = data.choices?.[0]?.message?.content || "";
      return NextResponse.json({ content });
    }

    // Stream SSE back to client
    const upstreamBody = upstreamResponse.body;
    if (!upstreamBody) {
      return NextResponse.json(
        { error: "No response body received from chat provider." },
        { status: 502 }
      );
    }

    return new Response(upstreamBody, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      {
        error: "Failed to communicate with AI chat service.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
