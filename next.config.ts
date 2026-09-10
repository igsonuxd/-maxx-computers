import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "s3n.cashify.in" },
      { protocol: "https", hostname: "s3ng.cashify.in" },
      { protocol: "https", hostname: "mc.bajajfinserv.in" },
      { protocol: "https", hostname: "www.buyitdirect.ie" },
      { protocol: "https", hostname: "i.ebayimg.com" },
    ],
  },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;