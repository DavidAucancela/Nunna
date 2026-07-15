import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { slugAliases } from "./lib/data/slug-aliases";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Prefijos localizados de la ficha de personaje. DEBEN coincidir con
// i18n/routing.ts → pathnames["/personajes/[slug]"]. El QR del imán codifica la
// variante /es/ por defecto, pero cubrimos los idiomas activos por seguridad.
const PERSONAJE_BASE_PATHS = [
  "/es/personajes",
  "/en/characters",
];

const nextConfig: NextConfig = {
  // Reduce el footprint de memoria en Railway: `next start` corre sobre el
  // bundle podado (.next/standalone) en vez de cargar node_modules completo.
  // ⚠ El server.js standalone hace `hostname = process.env.HOSTNAME || "0.0.0.0"`.
  // Docker setea HOSTNAME al ID del contenedor en TODO contenedor — sin forzar
  // HOSTNAME=0.0.0.0 en el comando de arranque (ver package.json → start), el
  // server queda escuchando solo en esa interfaz literal y el healthcheck de
  // Railway nunca lo alcanza (502 + crash-loop, ya reproducido y revertido el
  // 2026-07-11 — ver CLAUDE.md).
  output: "standalone",
  transpilePackages: ["maplibre-gl"],
  // ⚠ Optimización de imágenes DESACTIVADA a propósito para bajar costo de RAM en
  // Railway (2026-07-15). El costo del hosting es la RAM del servidor Node encendido
  // 24/7; `sharp` (la optimización on-the-fly de next/image) carga libs nativas y
  // dispara RAM/CPU en cada request de imagen. Como ya servimos nuestros propios
  // `.webp` (ver convención de imágenes en CLAUDE.md), las imágenes se sirven como
  // archivos estáticos cacheables, sin procesamiento en runtime. Tradeoff aceptado:
  // sin resize/srcset automático (payload algo mayor), pero el ancho de banda no es
  // el costo aquí — la RAM sí. Si algún día se migra a un host estático/CDN (plan de
  // costos, Opción B), esto ya queda alineado. Para reactivar sharp: quitar
  // `unoptimized` y volver a `formats: ["image/webp"]`.
  images: {
    unoptimized: true,
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
      { source: "/en/map", destination: "/en/celebrations", permanent: true },
    ];

    // El idioma quichua (qu) se retiró (2026-07-03). Redirigimos cualquier URL
    // /qu/* remanente a su equivalente en español para no romper enlaces viejos.
    // Los pases impresos codifican /es/, así que ningún imán queda afectado.
    const quRedirects = [
      { source: "/qu", destination: "/es", permanent: true },
      { source: "/qu/:path*", destination: "/es", permanent: true },
    ];

    return [...slugRedirects, ...mapaRedirects, ...quRedirects];
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
