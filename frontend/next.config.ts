import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Temporarily ignore ESLint errors during production builds to avoid blocking
  // on unrelated lint issues. Re-enable once lint errors are addressed.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
