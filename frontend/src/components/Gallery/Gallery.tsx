import React, { useEffect, useRef, useState } from "react";
import "./Gallery.css";

export type GalleryItem = {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
};

type Props = {
  images: GalleryItem[];
  aspectRatio?: string;   // e.g. "16 / 9" | "4 / 3" | "3 / 2"
  autoPlay?: boolean;
  intervalMs?: number;
};

export default function Gallery({
  images,
  aspectRatio = "16 / 9",
  autoPlay = false,
  intervalMs = 5000,
}: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const go = (i: number) => {
    const n = images.length;
    setIndex(((i % n) + n) % n); // wrap around
  };
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  // Optional autoplay
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(next, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoPlay, intervalMs]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const THRESH = 40; // px
    if (dx > THRESH) prev();
    else if (dx < -THRESH) next();
  };

  const item = images[index];

  return (
    <div className="gallery card" role="region" aria-label="Image gallery">
      {/* Viewport */}
      <div
        className="gallery-viewport"
        style={{ aspectRatio }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          className="gallery-arrow left"
          aria-label="Previous image"
          onClick={prev}
        >
          ‹
        </button>

        <img
          key={item.src}
          src={item.src}
          alt={item.alt ?? item.title ?? `Slide ${index + 1}`}
          className="gallery-image"
          draggable={false}
        />

        <button
          className="gallery-arrow right"
          aria-label="Next image"
          onClick={next}
        >
          ›
        </button>

        {/* Counter like 2/5 */}
        <div className="gallery-counter" aria-live="polite">
          {index + 1}/{images.length}
        </div>
      </div>

      {/* Caption area */}
      {(item.title || item.caption) && (
        <div className="gallery-caption">
          {item.title && <p className="heading3">{item.title}</p>}
          {item.caption && <p className="bodytext gallery-caption-text">{item.caption}</p>}
        </div>
      )}
    </div>
  );
}
