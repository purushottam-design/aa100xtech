import { notFound } from "next/navigation";
import Page from "@/routes/services.explore.$slug";
import { serviceTypeBySlug } from "@/data/service-types";
import { detailMetadata } from "@/lib/page-metadata/services.explore.slug";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const type = serviceTypeBySlug((await params).slug);
  return detailMetadata(type);
}

export default async function DetailPage({ params }: Props) {
  const type = serviceTypeBySlug((await params).slug);
  if (!type) notFound();
  return <Page type={type} />;
}
