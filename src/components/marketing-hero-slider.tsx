"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Megaphone, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useImageSlideshow } from "@/hooks/use-image-slideshow";
import type { MarketingHeroSlide } from "@/data/marketing-hero-slides";

export function MarketingHeroSlider({
  slides,
  label,
}: {
  slides: MarketingHeroSlide[];
  label: string;
}) {
  const { api, setApi, selected, playing, setPlaying, reducedMotion, rootProps } =
    useImageSlideshow();

  return (
    <div className="marketing-hero-slider" {...rootProps}>
      <Carousel
        opts={{ loop: true, duration: reducedMotion ? 0 : 25 }}
        setApi={setApi}
        aria-label={`${label} image gallery`}
      >
        <div className="marketing-image-wrap">
          <CarouselContent className="ml-0">
            {slides.map((slide, index) => (
              <CarouselItem
                key={slide.image}
                className="pl-0"
                aria-label={`${index + 1} of ${slides.length}: ${slide.label}`}
              >
                <div className="marketing-slide-image">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    sizes="(min-width: 1280px) 540px, (min-width: 1024px) 44vw, 100vw"
                    loading="eager"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <span className="marketing-image-label">
            <Megaphone className="size-4" aria-hidden="true" /> {slides[selected]!.label}
          </span>
          <span className="marketing-slide-count">
            {String(selected + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="marketing-slide-arrows">
            <button type="button" aria-label="Previous image" onClick={() => api?.scrollPrev()}>
              <ArrowLeft aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next image" onClick={() => api?.scrollNext()}>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="marketing-slider-controls">
          <div className="marketing-slide-dots" aria-label="Choose an image">
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                aria-label={`Show image ${index + 1}: ${slide.label}`}
                aria-current={selected === index ? "true" : undefined}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
          {!reducedMotion && (
            <button
              className="marketing-slider-pause"
              type="button"
              aria-label={playing ? "Pause image slideshow" : "Play image slideshow"}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </button>
          )}
        </div>
      </Carousel>
    </div>
  );
}
