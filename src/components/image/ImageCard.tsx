"use client";

import React, { useState } from "react";
import { Download, Copy, Check, RefreshCw, Maximize2, Sparkles } from "lucide-react";
import { GeneratedImage } from "@/types/image";
import { downloadImage, formatTime } from "@/lib/utils";
import { GridReveal } from "@/components/ui/grid-reveal";

interface ImageCardProps {
  image: GeneratedImage;
  onRegenerate: () => void;
  onUsePrompt: (prompt: string) => void;
  isGenerating?: boolean;
}

export function ImageCard({
  image,
  onRegenerate,
  onUsePrompt,
  isGenerating,
}: ImageCardProps) {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Compute and detect exact aspect ratio to prevent any cropping
  const [aspectRatio, setAspectRatio] = useState<number>(() => {
    if (!image.size) return 1;
    const parts = image.size.toLowerCase().split("x");
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (!isNaN(w) && !isNaN(h) && h > 0) return w / h;
    }
    return 1;
  });

  React.useEffect(() => {
    if (!image.url) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = image.url;
  }, [image.url]);

  // Close lightbox on Escape key
  React.useEffect(() => {
    if (!isZoomed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomed]);

  const handleCopy = () => {
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadImage(image.url, `vox-${image.model}-${Date.now()}.png`);
  };

  return (
    <>
      <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-black/35 overflow-hidden shadow-2xl backdrop-blur-xl group">
        {/* Image Display - Adapts to image aspect ratio, never crops */}
        <div className="relative w-full bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[280px]">
          <div
            className="relative flex items-center justify-center mx-auto"
            style={{
              width: "100%",
              maxHeight: "min(640px, 75vh)",
              aspectRatio: `${aspectRatio}`,
              maxWidth: `min(100%, calc(min(640px, 75vh) * ${aspectRatio}))`,
            }}
          >
            <GridReveal
              src={image.url}
              alt={image.prompt}
              aspect={aspectRatio}
              caption={`Model · ${image.model}`}
              className="w-full h-full"
            />
          </div>

          {/* Quick Overlay Actions on Hover */}
          <div className="z-10 absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setIsZoomed(true)}
              className="p-1.5 rounded-lg text-[#AB947E] hover:text-white transition-colors cursor-pointer"
              title="View full size"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-[#AB947E] hover:text-white transition-colors cursor-pointer"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info & Metadata Panel */}
        <div className="p-4 sm:p-5 border-t border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs md:text-sm text-[#EDE4DC] font-normal leading-relaxed">
                {image.prompt}
              </p>
              {image.negativePrompt && (
                <p className="text-[11px] text-[#8A7968]">
                  <span className="font-semibold text-[#AB947E]">Negative:</span> {image.negativePrompt}
                </p>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#AB947E] hover:text-[#EDE4DC] text-xs font-medium border border-white/5 transition-colors cursor-pointer"
              title="Copy prompt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#C3A995]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-[#8A7968] font-mono">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/5 text-[#C3A995] font-medium border border-white/5">
                {image.model}
              </span>
              <span>{image.size}</span>
              <span>•</span>
              <span>{formatTime(image.createdAt)}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onUsePrompt(image.prompt)}
                className="hover:text-[#EDE4DC] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#C3A995]" />
                <span>Reuse Prompt</span>
              </button>
              <span>•</span>
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="hover:text-[#EDE4DC] transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                <span>Regenerate</span>
              </button>
              <span>•</span>
              <button
                onClick={handleDownload}
                className="hover:text-[#EDE4DC] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.prompt}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="p-4 flex items-center justify-between text-xs text-[#EDE4DC] bg-black/80">
              <p className="truncate max-w-lg">{image.prompt}</p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#EDE4DC] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download High-Res</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
