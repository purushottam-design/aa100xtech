"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
// Content remains visible without JS. Motion is a short enhancement on entry.
export function ScrollReveals() {
  const pathname = usePathname();
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          animations.push(
            target.animate(
              [
                { opacity: 0.4, transform: "translateY(12px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 350, easing: "ease-out" },
            ),
          );
          observer.unobserve(target);
        }
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll("main section > div > .surface-card, main article.surface-card")
      .forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [pathname]);
  return null;
}
