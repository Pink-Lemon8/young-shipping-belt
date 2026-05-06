import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tabler/icons-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
    ],
    serverComponentsHmrCache: false,
    serverActions: {
      bodySizeLimit: "15mb",
    },
    turbopackFileSystemCacheForDev: true,
  },
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "*.uploadthing.com",
      },
    ],
  },
};

export default nextConfig;
