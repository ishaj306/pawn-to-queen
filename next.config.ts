import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Run `ANALYZE=true npm run build` to open an interactive treemap of
// the bundle. The analyzer is wrapped so production builds never include
// the visualizer overhead.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Optimize package imports for libraries that ship many barrel exports.
  // Lucide already imports named; this catches Recharts and others that
  // don't tree-shake by default.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default withBundleAnalyzer(nextConfig);
