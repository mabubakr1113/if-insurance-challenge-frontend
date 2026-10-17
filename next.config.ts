import type { NextConfig } from "next";

// Cache Components stays off: every page reads live data from the backend on each request.
const nextConfig: NextConfig = {
  env: {
    // Public browser token; deployments can override it at build time.
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      "pk.eyJ1IjoiYWJ1YmFrcjEyOSIsImEiOiJjbXZjbzg5MDQwcHI2MnlzZ3l6MnR5YzZoIn0.QirLPT95kUXlLn64Uz6eGQ",
  },
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
