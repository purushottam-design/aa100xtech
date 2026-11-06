import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep normal <img> elements and the existing image URLs/layouts unchanged.
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  // Permit this exact HTTPS development tunnel without trusting other ngrok hosts.
  allowedDevOrigins: ["tractor-nautical-snowbird.ngrok-free.dev"],
  async redirects() {
    // Keep saved app links working while serving only the website interface.
    return [
      { source: "/app/admin", destination: "/admin/select", permanent: true },
      { source: "/app/login", destination: "/auth", permanent: true },
      { source: "/app/profile", destination: "/profile", permanent: true },
      { source: "/app/settings", destination: "/settings", permanent: true },
      { source: "/app/notifications", destination: "/notifications", permanent: true },
      { source: "/app/services", destination: "/catalog", permanent: true },
      { source: "/app/service/:id", destination: "/catalog/:id", permanent: true },
      { source: "/app/book-consultation", destination: "/consultation", permanent: true },
      { source: "/app/:path*", destination: "/", permanent: true },
    ];
  },
  // Limit build worker memory on developer machines; runtime behavior is unchanged.
  experimental: { cpus: 2 },
};

export default nextConfig;
