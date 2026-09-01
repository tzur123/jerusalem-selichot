import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Public "hero" images uploaded via the admin panel, served from the
      // `station-public` Supabase Storage bucket.
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // 90 is used for the full-bleed desktop hero backgrounds, which need
    // every bit of source detail they can get since they're stretched
    // across the whole viewport.
    qualities: [75, 90],
  },
};

export default nextConfig;
