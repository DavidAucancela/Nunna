import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { slugAliases } from "./lib/data/slug-aliases";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Prefijos localizados de la ficha de personaje. DEBEN coincidir con
// i18n/routing.ts → pathnames["/personajes/[slug]"]. El QR del imán codifica la
// variante /es/ por defecto, pero cubrimos los 3 idiomas por seguridad.
const PERSONAJE_BASE_PATHS = [
  "/es/personajes",
  "/qu/runakunamanta",
  "/en/characters",
];

const nextConfig: NextConfig = {
  transpilePackages: ["maplibre-gl"],
  // Optimización de imágenes activa (WebP + srcset responsive). Railway corre
  // `next start`, que trae sharp integrado desde Next 15 — no requiere config extra.
  images: {
    formats: ["image/webp"],
  },
  // Contrato permanente del QR: un 301 por cada alias de slug × idioma, para que
  // los imanes ya impresos sigan llegando a la ficha aunque el slug cambie.
  // Ver lib/data/slug-aliases.ts. Los redirects de next.config se evalúan ANTES
  // del middleware de next-intl, así que la URL localizada del QR coincide directo.
  async redirects() {
    const slugRedirects = slugAliases.flatMap(({ from, to }) =>
      PERSONAJE_BASE_PATHS.map((base) => ({
        source: `${base}/${from}`,
        destination: `${base}/${to}`,
        permanent: true,
      }))
    );

    // /mapa se fusionó dentro de /pases. Redirigimos por idioma para no romper
    // enlaces externos a la antigua página del mapa (los pathnames localizados
    // deben coincidir con i18n/routing.ts → "/pases").
    const mapaRedirects = [
      { source: "/es/mapa", destination: "/es/pases", permanent: true },
      { source: "/qu/mapa", destination: "/qu/pawkarkuna", permanent: true },
      { source: "/en/map", destination: "/en/celebrations", permanent: true },
    ];

    return [...slugRedirects, ...mapaRedirects];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value:
              "<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect",
          },
          // Básicos gratis: no rompen nada (sin CSP, que requeriría auditar cada script/estilo inline).
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // El sitio no se embebe en iframes de terceros.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
