import type { NextConfig } from "next";

const BASE_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The theme code download reads theme sources and images from disk at request time.
  outputFileTracingIncludes: {
    "/api/themes/[themeId]/code": ["./src/themes/**/*", "./src/app/globals.css", "./public/themes/**/*", "./package.json"],
  },
  async headers() {
    return [
      // Theme previews are framed by the marketplace, and only by it.
      {
        source: "/preview/:path*",
        headers: [
          ...BASE_HEADERS,
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      // Nothing else may be framed, which protects the panels from clickjacking.
      {
        source: "/((?!preview/).*)",
        headers: [
          ...BASE_HEADERS,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
