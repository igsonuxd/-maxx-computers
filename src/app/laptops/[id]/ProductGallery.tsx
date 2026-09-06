"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const validImages = images.filter(
    (image): image is string =>
      typeof image === "string" && image.trim().length > 0
  );

  const [current, setCurrent] = useState(0);

  if (validImages.length === 0) {
    return (
      <div className="bg-zinc-50 border border-zinc-100 min-h-[500px] flex items-center justify-center">
        <span className="text-zinc-400">No image available</span>
      </div>
    );
  }

  const previous = () => {
    setCurrent((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );
  };

  const next = () => {
    setCurrent((prev) =>
      prev === validImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="w-full">

      {/* MAIN IMAGE */}
      <div className="relative bg-zinc-50 border border-zinc-100 min-h-[500px] flex items-center justify-center p-8 overflow-hidden">

        <Image
          src={validImages[current]}
          alt={`${productName} - Image ${current + 1}`}
          width={700}
          height={500}
          className="max-h-[480px] w-full object-contain"
          priority
          unoptimized
        />

        {validImages.length > 1 && (
          <>
            {/* PREVIOUS */}
            <button
              type="button"
              onClick={previous}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-zinc-200 shadow-md w-11 h-11 flex items-center justify-center hover:bg-black hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* NEXT */}
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white border border-zinc-200 shadow-md w-11 h-11 flex items-center justify-center hover:bg-black hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* COUNTER */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1.5">
              {current + 1} / {validImages.length}
            </div>
          </>
        )}
      </div>

      {/* THUMBNAILS */}
      {validImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3 mt-4">
          {validImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setCurrent(index)}
              className={`relative h-24 bg-zinc-50 border-2 overflow-hidden ${
                current === index
                  ? "border-black"
                  : "border-zinc-100 hover:border-zinc-400"
              }`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                unoptimized
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}