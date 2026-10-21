import type { NextConfig } from "next";

const subSiteRewrites = [
  ["djsammyjay", "https://djsammyjay-v2.vercel.app"],
  ["lumpiaandmore", "https://lumpia-and-more.vercel.app"],
  ["VictoryLaps", "https://victory-laps.vercel.app"],
  ["jewelcitysteven", "https://jewelcitysteven.vercel.app"],
  ["SmileDentalCare", "https://smile-dental-revamp.vercel.app"],
  ["fl00redEnt", "https://fl00red.vercel.app"],
  ["JGFamilyRoofing", "https://jg-family-roofing.vercel.app"],
  [
    "localheartsfoundation",
    "https://local-hearts-alchemyproco-9733s-projects.vercel.app",
  ],
] as const;

// Sites that moved to their own domain. The old proxied copies are stale
// (carlosnunez kept claims the owner retracted), so send visitors and crawlers
// to the canonical domain instead of proxying.
const movedSites = [["carlosnunez", "https://carlosnunez.ai"]] as const;

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    return movedSites.flatMap(([slug, target]) => [
      { source: `/sites/${slug}`, destination: target, permanent: true },
      { source: `/sites/${slug}/:path*`, destination: `${target}/:path*`, permanent: true },
    ]);
  },

  async rewrites() {
    const rules = subSiteRewrites.flatMap(([slug, target]) => {
      const isDjSammy = slug === "djsammyjay";
      const base = isDjSammy ? "" : `/sites/${slug}`;
      return [
        { source: `/sites/${slug}`, destination: `${target}${base || "/"}` },
        { source: `/sites/${slug}/:path*`, destination: `${target}${base}/:path*` },
      ];
    });
    return { beforeFiles: rules, afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
