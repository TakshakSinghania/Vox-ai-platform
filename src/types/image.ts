export interface GeneratedImage {
  id: string;
  url: string; // base64 data url or signed url
  prompt: string;
  negativePrompt?: string;
  model: string;
  size: string;
  createdAt: Date;
}

export type ImageModelOption = {
  id: string;
  name: string;
  description: string;
  plan: "free" | "paid";
};

export type ImageSizeOption = {
  id: string;
  label: string;
  aspect: string;
};
