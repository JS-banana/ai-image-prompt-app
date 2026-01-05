import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/**/*"],
  },
};

export default nextConfig;
