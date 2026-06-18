import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["maplibre-gl"],
  images: {
    // Los assets ya están pre-comprimidos a WebP pequeño en public/.
    // Servirlos estáticos evita que el optimizador AVIF en runtime sature
    // la instancia de Railway (causaba imágenes vacías al cargar grids).
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
