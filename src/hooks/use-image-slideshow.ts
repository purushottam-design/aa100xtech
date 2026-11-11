"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

export function useImageSlideshow() {
  const root = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!api) return;
    const sync = () => setSelected(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches);
    const visibility = () => setHidden(document.hidden);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!api || !playing || hovered || focused || reducedMotion || hidden || !visible) return;
    const timer = window.setInterval(() => api.scrollNext(), 3000);
    return () => window.clearInterval(timer);
  }, [api, playing, hovered, focused, reducedMotion, hidden, visible]);

  return {
    api,
    setApi,
    selected,
    playing,
    setPlaying,
    reducedMotion,
    rootProps: {
      ref: root,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      },
    },
  };
}
