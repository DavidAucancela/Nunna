# CLAUDE.md — Nunna

Catálogo digital + experiencia de desempaque para llaveros 3D de personajes ecuatorianos.
El comprador escanea el QR del llavero → aterriza en la experiencia inmersiva del personaje.
Autor: Jonathan David Aucancela Maguana.

---

## Modelo de negocio

**Producto físico:** llaveros 3D de personajes de los pases riobambeños (Aya Uma, Curiquingue, etc.)
**QR en el llavero** → dirige a `/es/personajes/[slug]/historia` (experiencia inmersiva "El Despertar")
**La experiencia QR + la ficha del personaje son el producto digital** — justifican la compra.

Flujo del comprador:
1. Escanea QR → `/es/personajes/[slug]/historia`
2. Vive "El Despertar": invocación → nombre → leyenda → capítulos → secreto exclusivo
3. CTA al final → `/es/personajes/[slug]` (ficha completa pública)

Implicaciones técnicas:
- **Mobile-first absoluto** — el QR se escanea con el teléfono
- **La experiencia historia debe cargar rápido y ser inmersiva**
- **Cross-sell al pie de cada personaje** — "Conoce a los otros seres" → más llaveros
- **OpenGraph rico** — si el comprador comparte en WhatsApp, la preview tiene que lucir bien

---

## Stack técnico

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend | Next.js 15.1 (App Router) + TypeScript | `apps/web/` |
| Estilos | Tailwind CSS v3 + PostCSS | `apps/web/tailwind.config.js` |
| i18n | next-intl v3 (es / qu / en) | `apps/web/i18n/` + `apps/web/messages/` |
| Datos | JSON estático en repo | `apps/web/lib/data/` |
| Backend | NestJS (búsqueda semántica — Fase 3) | `apps/api/` |
| Base de datos | PostgreSQL 16 (Supabase — Fase 3) | `prisma/schema.prisma` |
| Monorepo | Turborepo + pnpm workspaces | `turbo.json`, `pnpm-workspace.yaml` |

> **Sin CMS.** Directus fue eliminado (2026-05-31) por costo. Los datos viven en JSON versionados en el repo.

---

## Infraestructura de producción

| Servicio | Plataforma | Notas |
|---------|------------|-------|
| Frontend (Next.js) | Railway | Único servicio activo |
| Base de datos | Supabase | Reservada para Fase 3 (búsqueda semántica) |

**Todo en Railway.** No usar Vercel — decisión tomada para centralizar infraestructura.

---

## Cómo correr el proyecto

### Prerrequisitos
- Node.js ≥ 20, pnpm ≥ 9

### Desarrollo
```bash
pnpm install

# Frontend (puerto 3030)
pnpm --filter @seres-del-pase/web dev --port 3030

# Solo API NestJS
pnpm --filter @seres-del-pase/api dev
```

Frontend: **http://localhost:3030/es**

### Variables de entorno (`apps/web/.env.local`)
```
# Reservadas para Fase 3 (búsqueda semántica con pgvector)
NEXT_PUBLIC_SUPABASE_URL=https://dhhesajpexcyainibwvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT>
```

No se necesitan variables de entorno para correr el frontend en desarrollo — los datos vienen del JSON.

---

## Estructura de archivos importante

```
apps/web/
├── app/[locale]/
│   ├── layout.tsx                  → usa MainContent (oculta header/footer en /historia)
│   ├── page.tsx                    → Landing
│   ├── personajes/
│   │   ├── page.tsx                → Grid de personajes
│   │   └── [slug]/
│   │       ├── page.tsx            → ★ Ficha pública del personaje
│   │       └── historia/page.tsx   → ★★ PANTALLA QR — experiencia "El Despertar"
│   ├── calendario/page.tsx         → Pases y Festividades
│   └── glosario/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx              → se oculta en rutas /historia
│   │   ├── Footer.tsx
│   │   └── MainContent.tsx         → wrapper client que controla pt-16 y footer según ruta
│   ├── historia/                   → ★ Experiencia inmersiva QR
│   │   ├── HistoriaExperiencia.tsx → orquestador de fases (Client)
│   │   ├── CapituloScroll.tsx      → sección de capítulo full-height (Client)
│   │   ├── SecretoFinal.tsx        → sección dorada con secreto + CTAs (Client)
│   │   └── fases/
│   │       ├── FaseInvocacion.tsx  → negro + símbolo del origen girando (Client)
│   │       ├── FaseNombre.tsx      → wipe reveal del nombre (Client)
│   │       └── FaseLeyenda.tsx     → typewriter + imagen blur→nítida (Client)
│   ├── personajes/
│   │   ├── PersonajeCard.tsx       → usa imagenPortada (retrato)
│   │   ├── ParallaxHero.tsx        → usa imagenBanner primero, fallback a imagen (Client)
│   │   ├── SimbolismoSection.tsx
│   │   └── GaleriaSection.tsx      → 3 tabs: El personaje / El llavero / En el pase (Client)
│   └── ui/                         → FadeUp, AnimatedCounter, ScrollProgress, WhatsAppShare, OrigenPlaceholder
├── lib/
│   ├── data.ts                     → ★ Acceso a datos — merge multimedia portada + JSON
│   ├── data/
│   │   ├── personajes.json         → 9 personajes con narrativa, hotspots, imagenBanner, multimedia
│   │   ├── glosario.json           → 16 entradas kichwa
│   │   └── pases.json              → 7 pases con fechas y rutas
│   └── origen-styles.ts            → Estilos por tipo de origen
├── public/
│   ├── personajes/                 → Imágenes (ver tabla de personajes más abajo)
│   └── pases/                      → Imágenes de los pases
├── i18n/routing.ts                 → Locales + pathnames
├── messages/                       → es.json / qu.json / en.json (incluye sección "historia")
├── tailwind.config.js              → CommonJS, NO .ts
└── next.config.ts
```

---

## Capa de datos — `lib/data.ts`

Todas las páginas importan de `@/lib/data` (nunca de Directus ni de APIs externas).

```ts
import { getPersonajes, getPersonaje, getPases, getGlosario } from "@/lib/data";
```

`toPersonaje()` construye el array `multimedia` mergeando:
1. `imagenPortada` del JSON → como `multimedia[0]` con id `${slug}-portada`
2. Las entradas adicionales del array `multimedia` del JSON (presentaciones, grupo, etc.)

Para agregar o editar contenido: editar directamente los archivos JSON en `lib/data/` y hacer commit.
Las páginas son **SSG puro** — `generateStaticParams` + sin `force-dynamic`.

---

## Imágenes — convenciones

### Tipos de imagen por personaje

| Campo / archivo | Uso | Formato |
|----------------|-----|---------|
| `imagenPortada` en JSON → `public/personajes/[slug].png` | Tarjetas del grid (`PersonajeCard`) | Retrato portrait |
| `imagenBanner` en JSON → `public/personajes/[slug]-banner.png` | Hero de la ficha (`ParallaxHero`) + FaseLeyenda QR | Landscape 1376×768 |
| `multimedia[].url` con `titulo:"proceso"` → `public/personajes/[slug]-presentacion.png` | Galería tab "El llavero" | Libre |
| `multimedia[].url` con `titulo:"en-pase"` | Galería tab "En el pase" | Libre |
| sin `titulo` / `titulo:"retrato"` | Galería tab "El personaje" | Libre |

### Galería — convención del campo `titulo`

```json
{
  "id": "aya-uma-presentacion",
  "tipo": "imagen",
  "url": "/personajes/aya-uma-presentacion.png",
  "altText": "Llavero Aya Uma — presentación individual",
  "titulo": "proceso",
  "descripcion": "Texto que aparece en hover",
  "orden": 1
}
```

| `titulo` | Tab en galería |
|----------|---------------|
| `undefined` / `"retrato"` | El personaje |
| `"proceso"` | El llavero |
| `"en-pase"` | En el pase |

---

## Experiencia "El Despertar" — ruta `/historia`

Al escanear el QR del llavero se abre `/es/personajes/[slug]/historia`. Es SSG puro (noindex).

### Flujo de fases (auto-play → scroll)

| Fase | Descripción | Duración |
|------|-------------|----------|
| 1 — Invocación | Negro + símbolo del origen (Chakana/Espiral/Rombo) con glow | 3.8s auto |
| 2 — Nombre | Nombre en display-lg con clip-path wipe + StaggerLetters | 3.5s auto |
| 3 — Leyenda | `narrativa.leyenda` con typewriter + `imagenBanner` emerge del blur | ~4s auto |
| 4 — Capítulos | 3 secciones full-height scroll con gradiente del origen | scroll |
| 5 — Secreto | Fondo dorado — `narrativa.secreto` exclusivo para llavero | scroll |
| 6 — CTA | Botón → ficha del personaje | clic |

Botón "Saltar" (X) fijo top-right durante las fases 1–3.

### Datos necesarios en `personajes.json`

```json
"narrativa": {
  "leyenda": "Frase poderosa de una línea.",
  "secreto": "Dato exclusivo no publicado en la ficha.",
  "capitulos": [
    { "titulo": "Título del capítulo", "texto": "3–4 oraciones." },
    { "titulo": "...", "texto": "..." },
    { "titulo": "...", "texto": "..." }
  ]
}
```

### Header/Footer en `/historia`

`MainContent.tsx` (client) detecta `pathname.endsWith("/historia")` y:
- Elimina `pt-16` del `<main>` (sin header no hace falta)
- Oculta el `<Footer>`

`Header.tsx` retorna `null` cuando `pathname.endsWith("/historia")`.

---

## Diseño — paleta y tipografía

```
Fondo oscuro:  #0F0E0C  → bg-fondo-oscuro
Fondo claro:   #F5F1EA  → bg-fondo-claro
Acento rojo:   #B8312F  → text-acento-rojo
Acento dorado: #C89B3C  → text-acento-dorado
Acento jade:   #1F4D3F  → bg-acento-jade
Texto claro:   #EFEAE0  → text-texto-claro
Borde sutil:   #2A2724  → border-borde-sutil

Serif: Fraunces (Google Fonts) → font-serif
Sans:  Inter / system-ui       → font-sans
```

Modo oscuro por defecto.

---

## Estado actual

### ✅ Completado
- Monorepo Turborepo + pnpm funcional
- Frontend: todas las páginas con estilos completos (landing, personajes, detalle, pases, calendario, glosario, sobre, mapa)
- i18n es/qu/en con rutas localizadas
- Datos estáticos: 9 personajes (con `narrativa`, `hotspots`, `imagenBanner`, `multimedia`), 16 entradas glosario, 7 pases
- Build de producción SSG sin errores — 82 rutas prerrenderizadas (incluye 27 rutas `/historia`)
- Eliminación completa de Directus
- Favicons SVG
- Renombrado marca a "Nunna"
- Nav fusionado — "Pases y Festividades" en un solo punto
- Rediseño ficha de personaje — parallax, lead editorial, simbolismo, galería
- **Experiencia "El Despertar"** — 6 fases inmersivas para el QR del llavero
- **Banners profesionales** en el hero de 4 personajes (Aya Uma, Diablos de lata, Payaso, Perro)
- **Galería "El llavero"** con imágenes de presentación individual para 3 personajes

### 🔄 Siguiente
- Deploy Next.js en Railway
- Añadir `imagenBanner` y fotos a los 5 personajes sin imagen (Curiquingue, Sacha Runa, Rey Moro, Capitán, Ángel)
- Fotografías reales "En el pase" para la galería (`titulo: "en-pase"`)

### ⏳ Fase 2
- Modo claro/oscuro
- Página de detalle de pase (`/pases/[slug]`)

### ⏳ Fase 3
- Hotspots interactivos en el traje (componente `HotspotsViewer.tsx` ya existe, datos en JSON)
- Búsqueda semántica (pgvector + Supabase + NestJS)
- Mapa interactivo (MapLibre — dependencia ya instalada)

---

## Decisiones técnicas clave

### Marca: "Nunna"
- El nombre público del sistema es **Nunna**
- Los paquetes internos del monorepo (`@seres-del-pase/web`, etc.) **no se cambian** — son identificadores técnicos

### Sin CMS — datos en JSON
- **Directus eliminado** (2026-05-31) — Railway costaba ~$15-20/mes extra
- Los datos viven en `apps/web/lib/data/*.json`, versionados en git
- Para editar contenido: editar el JSON y hacer `git push` → Railway redeploya automáticamente
- Las páginas son SSG puro — `generateStaticParams` + sin `force-dynamic`

### Imágenes — `imagenBanner` vs `imagenPortada`
- `imagenPortada` → retrato portrait, para tarjetas pequeñas (`PersonajeCard`)
- `imagenBanner` → landscape 1376×768 con texto de marca, para hero grande y FaseLeyenda
- `ParallaxHero` usa `imagenBanner ?? imagen` (banner primero, retrato como fallback)
- Personajes sin `imagenBanner` muestran `OrigenPlaceholder` artístico en el hero

### Parallax en la ficha de personaje
- Framer Motion `useScroll` + `useTransform` en `ParallaxHero.tsx`
- El contenedor de imagen se extiende `-15%` arriba y abajo
- `y` va de `"0%"` a `"25%"` → imagen más lenta que el scroll
- Respeta `prefers-reduced-motion` con `useReducedMotion()`

### Tailwind CSS
- **v3, no v4** — v4 no genera utilities en pnpm monorepo + Next.js 15.1
- **tailwind.config.js CommonJS** — PostCSS no carga `.ts`
- **Turbopack desactivado** — incompatible con `experimental.typedRoutes`

### Prisma
- **v5, no v6/v7** — v6 cambió API de datasource
- Supabase reservado exclusivamente para Fase 3

### next-intl
- `i18n/request.ts` usa `.default` en dynamic import — sin esto React tira error de serialización

### Infraestructura
- **Todo en Railway** — no Vercel

---

## Personajes en producción

| Slug | Nombre | Origen | Retrato | Banner | Narrativa |
|------|--------|--------|---------|--------|-----------|
| aya-uma | Aya Uma | prehispanico | ✅ | ✅ | ✅ |
| curiquingue | Curiquingue | prehispanico | ❌ | ❌ | ✅ |
| sacha-runa | Sacha Runa | prehispanico | ❌ | ❌ | ✅ |
| payaso | Payaso | mixto | ✅ | ✅ | ✅ |
| rey-moro | Rey Moro | colonial | ❌ | ❌ | ✅ |
| capitan | Capitán | colonial | ❌ | ❌ | ✅ |
| angel | Ángel | colonial | ❌ | ❌ | ✅ |
| perro | Perro | prehispanico | ✅ | ✅ | ✅ |
| diablos-de-lata | Diablos de lata | mestizo | ✅ | ✅ | ✅ |

Para agregar un personaje: editar `apps/web/lib/data/personajes.json` con la estructura existente.
Para agregar imágenes: copiar a `public/personajes/` y actualizar `imagenPortada` / `imagenBanner` / `multimedia` en el JSON.

---

## Ética y contenido

- **Kichwa primero**: "Aya Uma" antes que "Diablo Huma"
- **`altText` obligatorio** en todas las imágenes
- **Citar fuentes** en cada testimonio
- **Licencia**: código MIT, contenido CC BY-NC-SA 4.0

---

## Comandos frecuentes

```bash
pnpm --filter @seres-del-pase/web dev --port 3030   # desarrollo
pnpm build                                            # build completo
pnpm --filter @seres-del-pase/web type-check         # verificar tipos

# Prisma (Fase 3)
./apps/api/node_modules/.bin/prisma generate --schema=prisma/schema.prisma
./apps/api/node_modules/.bin/prisma migrate dev --schema=prisma/schema.prisma --name <nombre>
```
