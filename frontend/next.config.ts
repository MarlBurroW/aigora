import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle in `.next/standalone` so the
  // production Docker image stays small (no node_modules at runtime).
  output: "standalone",
};

export default nextConfig;
