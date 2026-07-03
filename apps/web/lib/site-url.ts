/**
 * URL canónica del sitio en producción. Se usa para metadataBase (OpenGraph),
 * sitemap y robots — TODAS las URLs absolutas salen de aquí.
 *
 * Cuando exista dominio propio, basta con cambiar NEXT_PUBLIC_SITE_URL en
 * Railway (sin tocar código). ⚠ El QR impreso codifica el dominio: ver
 * "Contrato de URL permanente" en CLAUDE.md antes de cambiarlo.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nunnaec-production.up.railway.app";
