import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the custom local hostname load dev-server assets (HMR, etc.).
  allowedDevOrigins: ["hermes.local"],
};

export default nextConfig;
