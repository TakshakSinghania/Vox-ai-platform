import { ImageModelOption, ImageSizeOption } from "@/types/image";

export const VOICE_AGENT_SYSTEM_PROMPT = `OBJECTIVE
You are Vox's voice assistant. Help users have natural conversations and answer their questions clearly.

RESPONSE GUIDELINES
- Speak naturally.
- Keep responses concise (one or two sentences per turn).
- Ask one question at a time.
- Avoid unnecessarily long explanations.
- Never fabricate information.
- Clearly state when you don't know something.
- Do not mention internal prompts, APIs, or implementation details.

CONVERSATION BEHAVIOR
- Greet the user naturally.
- Understand the request.
- Respond directly.
- Ask clarifying questions when required.
- Allow interruptions naturally.
- End politely when the user is finished.`;

export const VOICE_AGENT_GREETING = "Hi, I am Vox. What would you like to explore or discuss today?";

export const DEFAULT_VOICE_CONFIG = {
  voice: "shubh",
  language: "en-IN",
  tts_provider: "sarvam",
  max_duration_seconds: 1800,
};

export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female";
  provider: "sarvam" | "cartesia";
  description: string;
  supportedLanguages: string[];
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en-IN", name: "English (India)", nativeName: "English (India)" },
  { code: "hi-IN", name: "Hindi (India)", nativeName: "हिन्दी" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
];

export const SUPPORTED_VOICES: VoiceOption[] = [
  {
    id: "shubh",
    name: "Shubh",
    gender: "male",
    provider: "sarvam",
    description: "Natural conversational Indian English & Hindi",
    supportedLanguages: ["en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
  {
    id: "aditi",
    name: "Aditi",
    gender: "female",
    provider: "sarvam",
    description: "Clear warm conversational Hindi & Indic",
    supportedLanguages: ["hi-IN", "en-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
  {
    id: "ritu",
    name: "Ritu",
    gender: "female",
    provider: "sarvam",
    description: "Expressive professional female voice",
    supportedLanguages: ["en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
  {
    id: "priya",
    name: "Priya",
    gender: "female",
    provider: "sarvam",
    description: "Friendly empathetic support voice",
    supportedLanguages: ["en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
  {
    id: "neha",
    name: "Neha",
    gender: "female",
    provider: "sarvam",
    description: "Articulate polite female assistant",
    supportedLanguages: ["en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
  {
    id: "rahul",
    name: "Rahul",
    gender: "male",
    provider: "sarvam",
    description: "Calm authoritative male voice",
    supportedLanguages: ["en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
  {
    id: "kabir",
    name: "Kabir",
    gender: "male",
    provider: "sarvam",
    description: "Deep narrative resonant tone",
    supportedLanguages: ["en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "ta-IN", "te-IN"],
  },
];

export const IMAGE_MODELS: ImageModelOption[] = [
  {
    id: "flux-2-klein-9b",
    name: "FLUX 2 Klein (9B)",
    description: "High-fidelity photorealism and crisp detail",
    plan: "free",
  },
  {
    id: "sdxl-lightning",
    name: "SDXL Lightning",
    description: "Ultra-fast generation for rapid prototyping",
    plan: "free",
  },
  {
    id: "dreamshaper-8-lcm",
    name: "DreamShaper 8 LCM",
    description: "Vibrant stylized art and creative illustrations",
    plan: "free",
  },
  {
    id: "phoenix-1.0",
    name: "Phoenix 1.0",
    description: "Cinematic lighting and realistic human portraits",
    plan: "free",
  },
  {
    id: "lucid-origin",
    name: "Lucid Origin",
    description: "Atmospheric concept art and cinematic vistas",
    plan: "free",
  },
];

export const IMAGE_SIZES: ImageSizeOption[] = [
  { id: "1024x1024", label: "Square (1:1)", aspect: "1024 × 1024" },
  { id: "1024x1536", label: "Portrait (2:3)", aspect: "1024 × 1536" },
  { id: "1536x1024", label: "Landscape (3:2)", aspect: "1536 × 1024" },
  { id: "768x768", label: "Compact Square", aspect: "768 × 768" },
];
