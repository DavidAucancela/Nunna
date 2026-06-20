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
  images: {
    unoptimized: true,
  },
  // Contrato permanente del QR: un 301 por cada alias de slug × idioma, para que
  // los imanes ya impresos sigan llegando a la ficha aunque el slug cambie.
  // Ver lib/data/slug-aliases.ts. Los redirects de next.config se evalúan ANTES
  // del middleware de next-intl, así que la URL localizada del QR coincide directo.
  async redirects() {
    return slugAliases.flatMap(({ from, to }) =>
      PERSONAJE_BASE_PATHS.map((base) => ({
        source: `${base}/${from}`,
        destination: `${base}/${to}`,
        permanent: true,
      }))
    );
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
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
