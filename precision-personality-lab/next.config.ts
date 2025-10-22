import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // ✅ Turbopack configuration
  turbopack: {
    root: "./",
  },

  // ✅ Stability and performance
  reactStrictMode: true,

  // ✅ Modern route prefetch optimization (moved to top-level)
  prefetchCache: true,

  // ✅ Keep typed routes as top-level
  typedRoutes: true,

  // ✅ Experimental flags (stable)
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  compress: true,
  poweredByHeader: false,

  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/icons/{{member}}",
    },
  },

  staticPageGenerationTimeout: 120,
};

export default withBundleAnalyzer(nextConfig);
