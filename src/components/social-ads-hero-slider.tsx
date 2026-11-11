"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useImageSlideshow } from "@/hooks/use-image-slideshow";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const slides = [
  {
    image: "/marketing/social-media-ads.webp",
    alt: "Laptop displaying advertising analytics and campaign charts",
    title: "Insights that guide the next move.",
    description: "Campaign measurement & optimization",
    label: "Performance insights",
  },
  {
    image: "/influencer-marketing/business.webp",
    alt: "Business professionals collaborating around a meeting table",
    title: "A strategy built around your business.",
    description: "Audience research & campaign planning",
    label: "Purposeful strategy",
  },
  {
    image: "/marketing/banner-marketing.webp",
    alt: "Designer developing digital artwork with a stylus and tablet",
    title: "Creative that earns attention.",
    description: "Ad concepts, visuals & copywriting",
    label: "Creative development",
  },
  {
    image: "/clients/retail.webp",
    alt: "Retail shopper carrying shopping bags outdoors",
    title: "Connect discovery with the next step.",
    description: "Product discovery & customer journeys",
    label: "Relevant audiences",
  },
];

export function SocialAdsHeroSlider() {
  const { api, setApi, selected, playing, setPlaying, reducedMotion, rootProps } =
    useImageSlideshow();

  return (
    <div className="ads-hero-slider" {...rootProps}>
      <Carousel
        opts={{ loop: true, duration: reducedMotion ? 0 : 25 }}
        setApi={setApi}
        aria-label="Social media advertising image gallery"
      >
        <div className="ads-slider-frame">
          <CarouselContent className="ml-0">
            {slides.map((slide, index) => (
              <CarouselItem
                key={slide.image}
                className="pl-0"
                aria-label={`${index + 1} of ${slides.length}: ${slide.label}`}
              >
                <div className="ads-slide-image">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    sizes="(min-width: 1280px) 610px, (min-width: 801px) 52vw, 100vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <span className="ads-slide-badge">{slides[selected]!.label}</span>
          <span className="ads-slide-count">
            0{selected + 1}
            <span> / 04</span>
          </span>
          <div className="ads-slide-arrows">
            <button
              type="button"
              aria-label="Previous advertising image"
              onClick={() => api?.scrollPrev()}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next advertising image"
              onClick={() => api?.scrollNext()}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="ads-slider-caption" aria-live={playing ? "off" : "polite"}>
          <p>{slides[selected]!.description}</p>
          <h2>{slides[selected]!.title}</h2>
        </div>
        <div className="ads-slider-controls">
          <div className="ads-slide-dots" aria-label="Choose an advertising image">
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.image}
                aria-label={`Show advertising image ${index + 1}: ${slide.label}`}
                aria-current={selected === index ? "true" : undefined}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
          <span>Explore our advertising approach</span>
          {!reducedMotion && (
            <button
              type="button"
              className="ads-slider-pause"
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
