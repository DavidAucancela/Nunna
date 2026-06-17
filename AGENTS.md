# Nunna — AGENTS.md

Catálogo digital de personajes ecuatorianos. Imanes artesanales como producto físico; QR en tarjeta → ficha del personaje.

**Leer `CLAUDE.md` primero** — contiene especificación detallada del producto, negocio, paleta, estado actual, y guías narrativas. Este archivo solo captura lo que un agente probablemente adivinaría mal.

## Comandos

```bash
pnpm install                          # instalar todo
pnpm --filter @seres-del-pase/web dev --port 3030   # frontend en :3030
pnpm build                            # build SSG completo (usa turbo — solo web)
pnpm --filter @seres-del-pase/web type-check        # tsc --noEmit
pnpm --filter @seres-del-pase/web lint              # next lint
node scripts/build-route.mjs                        # snap rutas del recorrido a calles (OSRM, autor)
```

Sin variables de entorno para desarrollo frontend.

## Monorepo

```
apps/web/       → Next.js 15.5 App Router (activo)
apps/api/       → NestJS (Fase 3 — inactivo, ni intentar tocar)
packages/types/ → @seres-del-pase/types — contratos compartidos
packages/ui/    → @seres-del-pase/ui — componentes base (react 19 peer)
packages/config/→ ESLint + TSConfig base
packages/utils/ → utilidades
packages/database/ → wrappers Prisma
```

Package manager: pnpm@9.12.0 (>=9). Node >=20.

## Stack particularidades

- **Tailwind v3** (no v4). `tailwind.config.js` CommonJS (PostCSS no carga `.ts`).
- **Turbopack desactivado** — incompatible con `experimental.typedRoutes`. No intentar activar.
- **Prisma v5** (no v6/v7). Solo para Fase 3, no tocar ahora.
- **next-intl v3**. `i18n/request.ts` usa `.default` en dynamic import — sin eso React da error de serialización.
- **Sin `force-dynamic`** en páginas. SSG puro con `generateStaticParams`. Solo 3 locales: `es`, `qu`, `en`.
- **Sin test framework configurado** — no hay jest/vitest ni tests escritos.

## Capa de datos

Todas las páginas importan de `@/lib/data`:
```ts
import { getPersonajes, getPersonaje, getPases, getGlosario } from "@/lib/data";
```

Los datos viven en `apps/web/lib/data/*.json` (versión git, sin CMS). Para editar contenido: editar JSON → commit → Railway redeploya.

## Infra

**Todo en Railway.** SSG export, `railpack.json` define build/start. No Vercel.

## Gotchas técnicos

- **MapLibre** (`PaseMapSection.tsx`): CARTO raster CDN `dark_all`, NO endpoint GL vector JSON. Fijar altura en px desde el wrapper antes de `new maplibregl.Map()`; `ResizeObserver` en el wrapper. Atribución `{ compact: true }`, nunca `false`. **Mapa estático** (`fitBounds`, sin `flyTo`) — la cámara no persigue el scroll. Contenedor `sticky top-16 h-[calc(100vh-4rem)]` (bajo el navbar fijo). Init async con guard `cancelled`.
- **Recorrido multi-pase** (`lib/data/recorrido.json` = `{ defaultPaseSlug, pases[] }`) vía `getRecorridos()`, no hardcodear en el TSX. La geometría `ruta` la genera `node scripts/build-route.mjs` (OSRM) — no editarla a mano. Editar coords ancla → re-correr el script. Selector visible con ≥2 pases; fotos rotativas por waypoint (`[imagen, ...imagenesExtra]`).
- **Assets** (reorg 2026-06-14): imágenes de pases en `public/informacion_pases/`, video del hero en `public/pases-videos/`. NO carpetas con espacios en `public/`.
- **text-shimmer** (`HeroSection.tsx`): aplicar en cada `motion.span`, no en el `h1` padre — `scale` en whileHover rompe `background-clip: text` heredado.
- **Parallax** (`ParallaxHero.tsx`): usa `imagenBanner ?? imagen` (banner primero, retrato fallback). Sin banner → `OrigenPlaceholder`.
- **Galería**: 3 tabs según campo `titulo` del multimedia: `undefined`/`"retrato"` → "El personaje", `"proceso"` → "El imán", `"en-pase"` → "En el pase".
- **Ficha personaje**: 6 secciones en orden: Hero → Resumen → Chips datos → Historia (leyenda + capítulos + secreto) → Galería → Cross-sell.
- **Imagen naming**: `public/personajes/[slug].png` (portada), `[slug]-banner.png` (hero), `[slug]-presentacion.png` (galería imán).
- **`altText` obligatorio** en todas las imágenes. Kichwa primero en nombres.

## Sobre CLAUDE.md

`CLAUDE.md` contiene: modelo de negocio, paleta de colores, tabla de personajes con estado de imágenes, ética de contenido, y decisiones técnicas históricas. Mantener sincronizado si se cambian aspectos fundamentales.
