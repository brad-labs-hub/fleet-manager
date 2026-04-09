import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/forgot-password", "/reset-password"],
        disallow: ["/admin", "/driver", "/api/storage/open", "/api/export"],
      },
    ],
  };
}
