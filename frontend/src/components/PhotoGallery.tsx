import React, { useEffect, useRef, useState } from "react";

export type GalleryItem = {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
};

type Props = {
  images: GalleryItem[];
  autoPlay?: boolean;
  autoPlayMs?: number;
  aspectRatio?: string; 
};

export default function PhotoGallery({
  images,
  autoPlay = false,
  autoPlayMs = 5000,
  aspectRatio = "16/9",
}: Props) {
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);

  const go = (next: number) => {
    setIndex((i) => (i + next + images.length) % images.length);
  };

  useEffect(() => {
    if (!autoPlay) return;
    timer.current = window.setInterval(() => go(1), autoPlayMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [autoPlay, autoPlayMs, images.length]);

  // basic swipe
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (startX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  return (
    <div className="fullbleed-gallery">
      <div
        className="fg-viewport"
        style={{ aspectRatio }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className={`fg-slide ${i === index ? "is-active" : ""}`}
            draggable={false}
          />
        ))}

        <button className="fg-nav fg-prev" aria-label="Previous" onClick={() => go(-1)}>
          ‹
        </button>
        <button className="fg-nav fg-next" aria-label="Next" onClick={() => go(1)}>
          ›
        </button>
      </div>

      {/* dots */}
      <div className="fg-dots" role="tablist" aria-label="Gallery pagination">
        {images.map((_, i) => (
          <button
            key={i}
            className={`fg-dot ${i === index ? "is-active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      {/* title + caption (optional) */}
      {(images[index]?.title || images[index]?.caption) && (
        <div className="fg-meta">
          {images[index]?.title && <div className="fg-title">{images[index].title}</div>}
          {images[index]?.caption && <div className="fg-cap">{images[index].caption}</div>}
        </div>
      )}
    </div>
  );
}
