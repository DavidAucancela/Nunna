import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Colección personal del usuario — sin valor para buscadores.
      disallow: ["/es/mis-personajes", "/qu/nuka-runakuna", "/en/my-characters"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
