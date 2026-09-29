"use client";

import React, { useState } from "react";
import { Sliders, AlertCircle, Layers } from "lucide-react";
import { useImageStudio } from "@/hooks/useImageStudio";
import { ImageCard } from "./ImageCard";
import { ImageGallery } from "./ImageGallery";
import { GridReveal } from "@/components/ui/grid-reveal";
import { IMAGE_MODELS, IMAGE_SIZES } from "@/lib/constants";
import AnimatedGenerateButton from "./AnimatedGenerateButton";

export function ImageStudio() {
  const {
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
  } = useImageStudio();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedModelInfo = IMAGE_MODELS.find((m) => m.id === selectedModel);

  const generatingRatio = React.useMemo(() => {
    if (!selectedSize) return 1;
    const parts = selectedSize.toLowerCase().split("x");
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (!isNaN(w) && !isNaN(h) && h > 0) return w / h;
    }
    return 1;
  }, [selectedSize]);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    generateImage();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-transparent shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-xl tracking-normal text-[#EDE4DC] font-normal">
            Visual Synthesis
          </h1>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[#C3A995] border border-white/10">
            FLUX 2 • SDXL
          </span>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
            showAdvanced
              ? "bg-white/10 text-[#EDE4DC] border-white/20"
              : "bg-white/4 text-[#AB947E] hover:text-[#EDE4DC] border-white/5"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#C3A995]" />
          <span>Parameters</span>
        </button>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative rounded-2xl md:rounded-3xl bg-black/35 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_1px_rgba(255,255,255,0.06)] focus-within:border-[#C3A995]/40 transition-all">
            <textarea
              id="image-prompt-textarea"
              data-testid="image-prompt-textarea"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your visual concept in detail (atmosphere, materials, lighting, style)..."
              disabled={isGenerating}
              className="w-full bg-transparent text-sm md:text-base text-[#EDE4DC] placeholder:text-white/35 p-5 pb-16 resize-none outline-none leading-relaxed disabled:opacity-50"
            />

            <div className="absolute left-5 bottom-3.5 right-4 flex items-center justify-between">
              <span className="text-[11px] text-[#8A7968] font-mono">
                {prompt.length}/4000 characters
              </span>

              {/* User-Supplied AnimatedGenerateButton integrated with real isGenerating state */}
              <AnimatedGenerateButton
                generating={isGenerating}
                disabled={!prompt.trim() || isGenerating}
                onClick={() => handleSubmit()}
                labelIdle="Generate"
                labelActive="Synthesizing"
              />
            </div>
          </div>

          {/* Model and Parameter Selector Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Model select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#AB947E] flex items-center gap-1 font-mono text-[11px]">
                <Layers className="w-3 h-3 text-[#C3A995]" /> Model:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isGenerating}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#EDE4DC] outline-none focus:border-[#C3A995] cursor-pointer"
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.plan.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Model description badge */}
            {selectedModelInfo && (
              <span className="inline-flex text-[11px] text-[#C3A995] font-medium bg-white/4 border border-white/5 px-2.5 py-1 rounded-xl">
                {selectedModelInfo.description}
              </span>
            )}

            {/* Size select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#AB947E] font-mono text-[11px]">Dimensions:</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                disabled={isGenerating}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#EDE4DC] outline-none focus:border-[#C3A995] cursor-pointer"
              >
                {IMAGE_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Negative Prompt Drawer */}
          {showAdvanced && (
            <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/5 space-y-2 animate-in fade-in duration-150">
              <label className="block text-xs font-mono text-[#AB947E]">
                Negative Prompt (Concepts to exclude)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="e.g. blurry, low fidelity, artifacts, oversaturated"
                disabled={isGenerating}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#EDE4DC] outline-none focus:border-[#C3A995]"
              />
            </div>
          )}
        </form>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#EDE4DC] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#C3A995] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#EDE4DC] mb-0.5">Synthesis Alert</p>
                <p className="text-[#AB947E] leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[#C3A995] hover:text-white text-xs font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Display Current Image, Rendering, or Clean Minimal Empty State */}
        {isGenerating ? (
          <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden shadow-2xl">
            <div className="relative w-full bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[280px]">
              <div
                className="relative flex items-center justify-center mx-auto"
                style={{
                  width: "100%",
                  maxHeight: "min(640px, 75vh)",
                  aspectRatio: `${generatingRatio}`,
                  maxWidth: `min(100%, calc(min(640px, 75vh) * ${generatingRatio}))`,
                }}
              >
                <GridReveal
                  src={null}
                  alt="Synthesizing visual"
                  aspect={generatingRatio}
                  caption={`Diffusion synthesis · ${selectedModelInfo?.name || selectedModel}`}
                  estimatedDuration={7000}
                  className="w-full h-full"
                />
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#C3A995] animate-ping" />
                <span className="text-xs font-mono text-[#EDE4DC]">
                  Synthesizing with {selectedModelInfo?.name || selectedModel}...
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#C3A995] bg-white/5 px-2.5 py-1 rounded-lg">
                {selectedSize}
              </span>
            </div>
          </div>
        ) : currentImage ? (
          <ImageCard
            image={currentImage}
            onRegenerate={regenerate}
            onUsePrompt={(p) => setPrompt(p)}
            isGenerating={isGenerating}
          />
        ) : (
          /* Clean Minimal Empty State — NO generic marketing copy */
          <div className="rounded-2xl md:rounded-3xl border border-white/5 bg-black/20 backdrop-blur-xl p-8 sm:p-12 text-center space-y-3 shadow-sm select-none">
            <h2 className="font-serif text-lg font-normal text-[#EDE4DC] tracking-wide">
              Studio Canvas
            </h2>
            <p className="text-xs text-[#8A7968] max-w-sm mx-auto leading-relaxed">
              Synthesize high-fidelity diffusion imagery directly from natural language prompts.
            </p>
          </div>
        )}

        {/* History Gallery */}
        <ImageGallery
          images={images}
          currentImageId={currentImage?.id}
          onSelectImage={(img) => setCurrentImage(img)}
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
}
