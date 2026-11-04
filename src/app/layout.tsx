import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "../styles.css";
import { site } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  title: "AA100XTech — Absolute Advancement 100X Tech",
  description:
    "Websites, mobile apps, AI, cloud and digital marketing engineered for 100x growth. An IT services company based in Patna, India.",
  authors: [{ name: "Absolute Advancement 100X Tech" }],
  openGraph: {
    title: "AA100XTech — Absolute Advancement 100X Tech",
    description:
      "Websites, mobile apps, AI, cloud and digital marketing engineered for 100x growth.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: { url: "/favicon.png", type: "image/png" },
    apple: "/app-icon-512.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ngrok's browser consent cookie must accompany manifest requests too. */}
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.legalName,
              url: site.origin,
              email: site.email,
              logo: `${site.origin}/logo.png`,
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
