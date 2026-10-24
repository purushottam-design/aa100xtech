import { notFound } from "next/navigation";
import Page from "@/routes/services.$slug";
import { serviceBySlug } from "@/data/services";
import { detailMetadata } from "@/lib/page-metadata/services.slug";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const service = serviceBySlug((await params).slug);
  return detailMetadata(service);
}

export default async function DetailPage({ params }: Props) {
  const service = serviceBySlug((await params).slug);
  if (!service) notFound();
  return <Page service={service} />;
}
