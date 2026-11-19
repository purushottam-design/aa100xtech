import type { Metadata } from "next";
import Link from "next/link";
import { loginHref } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Partner Workspace availability | AA100XTech",
  robots: { index: false, follow: false },
};

// Availability information only. No membership lookup, private data, or permissions are granted.
export default function PartnerWorkspacePage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold text-primary">Partner Workspace</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Partner Workspace is not yet installed
      </h1>
      <p className="text-muted-foreground">
        The private workspace pages and backend operations have not been integrated into this
        website yet. Signing in does not enable this unfinished integration.
      </p>
      <p className="text-muted-foreground">
        Setup requires confirmation of the AA100XTech Supabase project, reviewed workspace database
        migrations, and the membership and account access handlers. Existing AA100XTech accounts and
        permissions continue to apply to the rest of the website.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          className="font-medium text-primary underline underline-offset-4"
          href={loginHref("/partner-workspace")}
        >
          AA100XTech login
        </Link>
        <Link className="font-medium text-primary underline underline-offset-4" href="/">
          Back to home
        </Link>
      </div>
    </section>
  );
}
