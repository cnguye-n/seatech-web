import React, { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  /** animation style */
  effect?: "fade-up" | "fade-in" | "fade-right" | "fade-left" | "scale-in";
  /** ms delay for staggering */
  delay?: number;
  /** animate only the first time it enters viewport */
  once?: boolean;
  className?: string;
};

export default function Reveal({
  children,
  effect = "fade-up",
  delay = 0,
  once = true,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current!;
    if (!el) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReduced.matches) {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("is-visible");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay, once]);

  return (
    <div ref={ref} className={`reveal ${effect} ${className}`} aria-live="polite">
      {children}
    </div>
  );
}
