import type { NextConfig } from "next";

// Cache Components stays off: every page reads live data from the backend on each request.
const nextConfig: NextConfig = {
  experimental: {
    // Photos are downscaled in the browser to well under 5 MB, then sent through a server action.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
