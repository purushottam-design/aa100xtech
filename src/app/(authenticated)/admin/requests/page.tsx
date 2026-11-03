import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { WebsiteInbox } from "@/components/website-inbox";
export const metadata: Metadata = {
  title: "Website Requests | AA100XTech Admin",
  robots: { index: false, follow: false },
};
export default function RequestsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Website requests</h1>
      <AdminNav className="my-6" />
      <WebsiteInbox />
    </section>
  );
}
