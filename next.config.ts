import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXON images load directly from NEXON's host and never use Vercel Image Optimization
  // (SKILL.md landmine 2).
  images: { unoptimized: true },
};

export default nextConfig;
