import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Retailer guide copy is still being finished in the vault. Keep it out
        // of search engines; the funnel's indexability is unchanged (TT-377).
        source: "/guide/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
