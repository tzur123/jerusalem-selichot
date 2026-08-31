import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Public "hero" images uploaded via the admin panel, served from the
      // `station-public` Supabase Storage bucket.
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
