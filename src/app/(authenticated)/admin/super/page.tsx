import { Suspense } from "react";
import Page from "@/routes/_authenticated/admin.super";
export { metadata } from "@/lib/page-metadata/_authenticated__admin.super";

export default function SearchPage() {
  return <Suspense><Page /></Suspense>;
}
