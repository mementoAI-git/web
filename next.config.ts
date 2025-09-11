import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5002",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api-production-f037.up.railway.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
