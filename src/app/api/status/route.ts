import { NextResponse } from "next/server";

export async function GET() {
  const hasCallMissedKey = Boolean(process.env.CALLMISSED_API_KEY && process.env.CALLMISSED_API_KEY.trim() !== "");
  const hasLLMKey = Boolean(
    hasCallMissedKey ||
    (process.env.LLM_API_KEY && process.env.LLM_API_KEY.trim() !== "") ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "")
  );
  const hasImageKey = Boolean(
    hasCallMissedKey ||
    (process.env.IMAGE_API_KEY && process.env.IMAGE_API_KEY.trim() !== "") ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "")
  );

  return NextResponse.json({
    status: hasCallMissedKey ? "ok" : "degraded",
    configured: {
      callmissed: hasCallMissedKey,
      llm: hasLLMKey,
      image: hasImageKey,
    },
    environment: process.env.NODE_ENV || "development",
  });
}
