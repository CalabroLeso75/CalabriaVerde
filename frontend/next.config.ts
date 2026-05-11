import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/test";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
