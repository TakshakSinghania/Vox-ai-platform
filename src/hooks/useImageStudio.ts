"use client";

import { useState, useCallback } from "react";
import { GeneratedImage } from "@/types/image";
import { IMAGE_MODELS, IMAGE_SIZES } from "@/lib/constants";

export function useImageStudio() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(IMAGE_MODELS[0].id);
  const [selectedSize, setSelectedSize] = useState<string>(IMAGE_SIZES[0].id);

  const generateImage = useCallback(async (customPrompt?: string) => {
    const promptToUse = (customPrompt !== undefined ? customPrompt : prompt).trim();
    if (!promptToUse || isGenerating) return;

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          negative_prompt: negativePrompt.trim() || undefined,
          model: selectedModel,
          size: selectedSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed.");
      }

      const newImg: GeneratedImage = {
        id: data.id,
        url: data.url,
        prompt: data.prompt,
        negativePrompt: data.negativePrompt,
        model: data.model,
        size: data.size,
        createdAt: new Date(data.createdAt),
      };

      setCurrentImage(newImg);
      setImages((prev) => [newImg, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating image.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, negativePrompt, selectedModel, selectedSize, isGenerating]);

  const regenerate = useCallback(() => {
    if (currentImage) {
      generateImage(currentImage.prompt);
    } else if (prompt.trim()) {
      generateImage(prompt);
    }
  }, [currentImage, prompt, generateImage]);

  const clearHistory = useCallback(() => {
    setImages([]);
    setCurrentImage(null);
    setError(null);
  }, []);

  return {
    images,
    currentImage,
    isGenerating,
    error,
    prompt,
    negativePrompt,
    selectedModel,
    selectedSize,
    setPrompt,
    setNegativePrompt,
    setSelectedModel,
    setSelectedSize,
    setCurrentImage,
    generateImage,
    regenerate,
    clearHistory,
    setError,
  };
}
