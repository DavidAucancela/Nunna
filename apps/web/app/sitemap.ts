import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getPersonajes } from "@/lib/data";
import { absoluteUrl, type LocalizedHref } from "@/lib/seo";

/**
 * Sitemap con las páginas públicas × 3 locales (hreflang vía alternates).
 * Fuera: /mis-personajes (contenido personal) y /desbloquear/[slug] (landing
 * transaccional del canje, sin valor de búsqueda).
 */
function entry(href: LocalizedHref, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(href, routing.defaultLocale),
    priority,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(href, l)])),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const personajes = await getPersonajes({});

  return [
    entry("/", 1),
    entry("/personajes", 0.9),
    ...personajes.map((p) =>
      entry({ pathname: "/personajes/[slug]", params: { slug: p.slug } }, 0.8),
    ),
    entry("/pases", 0.7),
    entry("/calendario", 0.7),
    entry("/glosario", 0.5),
    entry("/sobre", 0.5),
    entry("/desbloquear", 0.5),
  ];
}
