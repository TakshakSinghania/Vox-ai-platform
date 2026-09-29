"use client";

import React from "react";
import { GeneratedImage } from "@/types/image";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface ImageGalleryProps {
  images: GeneratedImage[];
  currentImageId?: string;
  onSelectImage: (image: GeneratedImage) => void;
  onClearHistory: () => void;
}

export function ImageGallery({
  images,
  currentImageId,
  onSelectImage,
  onClearHistory,
}: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-3 pt-6 border-t border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#8A7968]" />
          <h4 className="font-serif text-xs text-[#EDE4DC] tracking-wide">
            Session History ({images.length})
          </h4>
        </div>
        <button
          onClick={onClearHistory}
          className="text-[11px] font-mono text-[#8A7968] hover:text-[#C3A995] transition-colors cursor-pointer"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {images.map((img) => {
          const isSelected = img.id === currentImageId;

          return (
            <button
              key={img.id}
              onClick={() => onSelectImage(img)}
              className={`group relative aspect-square rounded-2xl overflow-hidden border text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-[#C3A995] ring-2 ring-[#C3A995]/30 shadow-lg"
                  : "border-white/5 hover:border-white/20 bg-black/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.prompt}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                <p className="text-[10px] text-white line-clamp-2 leading-tight">
                  {img.prompt}
                </p>
                <span className="text-[9px] text-neutral-400 font-mono mt-0.5">
                  {formatTime(img.createdAt)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
