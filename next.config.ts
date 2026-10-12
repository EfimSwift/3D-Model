import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  /** Prisma + D1 на Workers — см. https://opennext.js.org/cloudflare/howtos/db */
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  async headers() {
    const headers =
      process.env.NODE_ENV === "production"
        ? securityHeaders
        : securityHeaders.filter((h) => h.key !== "Strict-Transport-Security");
    return [{ source: "/:path*", headers }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
