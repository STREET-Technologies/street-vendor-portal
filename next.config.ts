import type { NextConfig } from "next";
import { GUIDE_BASE } from "./lib/guide-base";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Retailer guide copy is still being finished in the vault. Keep it out
        // of search engines; the funnel's indexability is unchanged (TT-377).
        source: `${GUIDE_BASE}/:path*`,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
