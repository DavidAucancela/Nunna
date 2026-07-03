import type { Metadata } from "next";

import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site-url";

type Locale = (typeof routing.locales)[number];
export type LocalizedHref = Parameters<typeof getPathname>[0]["href"];

/** URL absoluta de una ruta interna en un locale dado (respeta pathnames localizados). */
export function absoluteUrl(href: LocalizedHref, locale: Locale): string {
  return SITE_URL + getPathname({ locale, href });
}

/**
 * `alternates` (canonical + hreflang) para una ruta. Usar en el generateMetadata
 * de cada página pública — NO en el layout: las alternates del layout se
 * heredarían idénticas en todas las subpáginas y el hreflang saldría mal.
 */
export function localeAlternates(href: LocalizedHref, locale: string): Metadata["alternates"] {
  return {
    canonical: absoluteUrl(href, locale as Locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(href, l)])),
      "x-default": absoluteUrl(href, routing.defaultLocale),
    },
  };
}
