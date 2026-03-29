import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow MP photos from the Represent API and the official Parliament site
    remotePatterns: [
      new URL('https://represent.opennorth.ca/**'),
      new URL('https://www.ourcommons.ca/**'),
      new URL('https://images.ourcommons.ca/**'),
    ],
  },
};

export default nextConfig;
