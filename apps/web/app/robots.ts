import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Colección personal del usuario y login transaccional — sin valor para buscadores.
      disallow: ["/es/mis-personajes", "/en/my-characters", "/es/login", "/en/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
