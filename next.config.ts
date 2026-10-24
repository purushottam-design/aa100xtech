import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep normal <img> elements and the existing image URLs/layouts unchanged.
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  // Limit build worker memory on developer machines; runtime behavior is unchanged.
  experimental: { cpus: 2 },
};

export default nextConfig;
