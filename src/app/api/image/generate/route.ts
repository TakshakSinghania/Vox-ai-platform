import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.CALLMISSED_API_KEY ||
      process.env.IMAGE_API_KEY ||
      process.env.OPENAI_API_KEY;

    const baseURL = (
      process.env.IMAGE_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.callmissed.com/v1"
    ).replace(/\/$/, "");

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error: "No Image Generation API key configured. Please set CALLMISSED_API_KEY or IMAGE_API_KEY in your .env.local file.",
          code: "missing_api_key",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { prompt, model = "flux-2-klein-9b", size = "1024x1024", negative_prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid descriptive prompt is required for image generation." },
        { status: 400 }
      );
    }

    const isOpenAI = baseURL.includes("api.openai.com");
    const effectiveModel = isOpenAI ? "dall-e-3" : model;

    // CallMissed / OpenAI image generation payload
    const payload: Record<string, unknown> = {
      model: effectiveModel,
      prompt: prompt.trim(),
      n: 1,
      size,
      response_format: "b64_json",
    };

    if (!isOpenAI && negative_prompt && typeof negative_prompt === "string" && negative_prompt.trim().length > 0) {
      payload.negative_prompt = negative_prompt.trim();
    }

    const upstreamResponse = await fetch(`${baseURL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upstreamResponse.ok) {
      let errorMessage = "Failed to generate image.";
      try {
        const errJson = await upstreamResponse.json();
        if (errJson?.error?.message) {
          errorMessage = errJson.error.message;
        } else if (errJson?.message) {
          errorMessage = errJson.message;
        }
      } catch {
        if (upstreamResponse.status === 402) {
          errorMessage = "Insufficient credits for image generation. Please check your account credits.";
        } else if (upstreamResponse.status === 403) {
          errorMessage = "API key lacks permission for the selected image model.";
        } else if (upstreamResponse.status === 429) {
          errorMessage = "Image generation rate limit reached. Please wait a moment.";
        } else if (upstreamResponse.status >= 500) {
          errorMessage = "Image generation service is temporarily unavailable. Please retry.";
        }
      }

      return NextResponse.json(
        { error: errorMessage, code: `upstream_${upstreamResponse.status}` },
        { status: upstreamResponse.status }
      );
    }

    const data = await upstreamResponse.json();
    const item = data?.data?.[0];

    let finalImageUrl = "";
    if (item?.b64_json) {
      finalImageUrl = `data:image/png;base64,${item.b64_json}`;
    } else if (item?.url) {
      finalImageUrl = item.url;
    } else {
      return NextResponse.json(
        { error: "Image generation completed but no image data was returned." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: finalImageUrl,
      prompt: prompt.trim(),
      negativePrompt: negative_prompt?.trim() || undefined,
      model,
      size,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      {
        error: "Failed to generate image due to an internal server error.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
