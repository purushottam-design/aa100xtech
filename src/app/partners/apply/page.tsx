import { Suspense } from "react";
import Page from "@/routes/partners.apply";
export { metadata } from "@/lib/page-metadata/partners.apply";

export default function SearchPage() {
  return <Suspense><Page /></Suspense>;
}
