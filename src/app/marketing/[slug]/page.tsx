import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MarketingServicePage } from "@/components/marketing-service-page";
import {
  findMarketingService,
  marketingServiceHref,
  marketingServices,
} from "@/data/marketing-services";
import { site } from "@/data/site";
import { withSocialMetadata } from "@/lib/page-metadata";
import "../marketing.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return marketingServices.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const service = findMarketingService((await params).slug);
  if (!service) notFound();
  const image = {
    url: `${site.origin}${service.image}`,
    width: 1200,
    height: 900,
    alt: service.imageAlt,
  };
  return withSocialMetadata({
    title: service.title,
    description: service.description,
    keywords: service.keywords,
    alternates: { canonical: `${site.origin}${marketingServiceHref(service)}` },
    openGraph: { images: [image] },
    twitter: { images: [image.url] },
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const service = findMarketingService((await params).slug);
  if (!service) notFound();
  if (service.slug === "social-media-ads") permanentRedirect("/social-media-ads-marketing");
  return <MarketingServicePage service={service} />;
}
