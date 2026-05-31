import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure better-sqlite3 native module is not bundled by webpack
  serverExternalPackages: ["better-sqlite3"],
  
  // Include the seed database file in the serverless function bundle
  outputFileTracingIncludes: {
    "/api/**": ["./priceghost.db"],
  },
};

export default nextConfig;
