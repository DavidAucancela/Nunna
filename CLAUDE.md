# CLAUDE.md — Nunna

Catálogo digital + experiencia de desempaque para llaveros 3D de personajes ecuatorianos.
El comprador escanea el QR del llavero → aterriza en la ficha del personaje.
Autor: Jonathan David Aucancela Maguana.

---

## Modelo de negocio

**Producto físico:** llaveros 3D de personajes de los pases riobambeños (Aya Uma, Curiquingue, etc.)
**QR en el llavero** → dirige a `/es/personajes/[slug]`
**La página de detalle del personaje es el producto digital** — es lo que justifica la compra.

Implicaciones técnicas:
- **Mobile-first absoluto** — el QR se escanea con el teléfono
- **La página de detalle debe cargar rápido y verse impresionante al primer render**
- **Cross-sell al pie de cada personaje** — "Conoce a los otros personajes" → más llaveros
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
│   ├── layout.tsx
│   ├── page.tsx                    → Landing
│   ├── personajes/
│   │   ├── page.tsx                → Grid de personajes
│   │   └── [slug]/page.tsx         → ★ PANTALLA PRINCIPAL DEL QR
│   ├── pases/page.tsx              → (sin enlace en nav — fusionado en calendario)
│   ├── calendario/page.tsx         → Pases y Festividades (nav item activo)
│   └── glosario/page.tsx
├── components/
│   ├── layout/Header.tsx           → Nav: Personajes | Mapa | Pases y Festividades | Glosario
│   ├── layout/Footer.tsx
│   ├── calendario/CalendarioGrid.tsx
│   ├── glosario/GlosarioClient.tsx
│   ├── home/HeroSection.tsx
│   ├── personajes/
│   │   ├── PersonajeCard.tsx
│   │   ├── PersonajeCardProximo.tsx
│   │   ├── ParallaxHero.tsx        → ★ Hero con parallax Framer Motion (Client)
│   │   ├── SimbolismoSection.tsx   → Interlude cinematográfico del simbolismo (Client)
│   │   └── GaleriaSection.tsx      → Galería 3 categorías con scroll horizontal (Client)
│   └── ui/                         → FadeUp, AnimatedCounter, ScrollProgress, WhatsAppShare, OrigenPlaceholder
├── lib/
│   ├── data.ts                     → ★ Acceso a datos (reemplaza Directus)
│   ├── data/
│   │   ├── personajes.json         → 9 personajes completos
│   │   ├── glosario.json           → 16 entradas kichwa
│   │   └── pases.json              → 7 pases con fechas y rutas
│   └── origen-styles.ts            → Estilos por tipo de origen
├── public/
│   ├── personajes/                 → Imágenes de personajes (aya-uma, payaso, perro, diablos-de-lata)
│   └── pases/                      → Imágenes de los pases
├── i18n/routing.ts                 → Locales + pathnames
├── i18n/request.ts                 → next-intl config
├── messages/                       → es.json / qu.json / en.json
├── tailwind.config.js              → CommonJS, NO .ts
└── next.config.ts
```

---

## Capa de datos — `lib/data.ts`

Todas las páginas importan de `@/lib/data` (nunca de Directus ni de APIs externas).

```ts
import { getPersonajes, getPersonaje, getPases, getGlosario } from "@/lib/data";
```

Para agregar o editar contenido: editar directamente los archivos JSON en `lib/data/` y hacer commit.
Las páginas son **SSG puro** — se prerenderizan en build, sin requests en runtime.

---

## Galería de personajes — convención de imágenes

La ficha de cada personaje (`[slug]/page.tsx`) muestra una galería con 3 categorías.
Las imágenes se guardan en el array `multimedia` del JSON de cada personaje.
El campo `titulo` en cada objeto `Media` determina en qué categoría aparece:

| `titulo` | Categoría en la galería |
|----------|------------------------|
| `undefined` / `"retrato"` | El personaje (incluye la imagen de portada) |
| `"proceso"` | El llavero (proceso de creación artesanal) |
| `"en-pase"` | En el pase (personaje en la festividad) |

Ejemplo para agregar una imagen al JSON:
```json
{
  "id": "aya-uma-proceso-1",
  "tipo": "imagen",
  "url": "/personajes/aya-uma-proceso.jpg",
  "altText": "Artesano trabajando la máscara del Aya Uma",
  "titulo": "proceso",
  "descripcion": "Tallado de la máscara en madera de balsa",
  "orden": 1
}
```

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
- Datos estáticos: 9 personajes, 16 entradas glosario, 7 pases en JSON versionado
- Imágenes de 4 personajes en `public/personajes/` (Aya Uma, Payaso, Perro, Diablos de lata)
- Imágenes de 5 pases en `public/pases/`
- Build de producción SSG sin errores — todas las rutas se prerenderizan estáticamente
- Eliminación completa de Directus (CMS, Redis, PostGIS, Bucket dados de baja en Railway)
- Favicons SVG
- **Renombrado marca a "Nunna"** — títulos, metadata OG, footer, WhatsApp share, altText
- **"seres" → "personajes"** en todos los textos visibles (es/en/qu)
- **Nav fusionado** — "Pases y fiestas" eliminado, "Calendario" → "Pases y Festividades", todos los links apuntan a `/calendario`
- **Rediseño ficha de personaje** — parallax real en hero, lead editorial grande, simbolismo cinematográfico, galería con 3 categorías (El personaje / El llavero / En el pase)

### 🔄 Siguiente
- Deploy Next.js en Railway
- Añadir imágenes a los 5 personajes sin foto (Curiquingue, Sacha Runa, Rey Moro, Capitán, Ángel)
- Fotografías reales del personaje, proceso de llavero y personaje en pase para la galería

### ⏳ Fase 2
- Modo claro/oscuro
- Página de detalle de pase (`/pases/[slug]`) — actualmente la ruta existe pero no tiene slug page

### ⏳ Fase 3
- Scroll narrativo (Lenis + Framer Motion — dependencias ya instaladas)
- Hotspots interactivos en el traje
- Búsqueda semántica (pgvector + Supabase + NestJS)
- Mapa interactivo (MapLibre — dependencia ya instalada)

---

## Decisiones técnicas clave

### Marca: "Nunna"
- El nombre público del sistema es **Nunna** (antes "Seres del Pase")
- Los nombres de paquetes internos del monorepo (`@seres-del-pase/web`, `@seres-del-pase/types`, etc.) **no se cambian** — son identificadores técnicos, no afectan al usuario
- Los comandos de desarrollo siguen usando `@seres-del-pase/web`

### Sin CMS — datos en JSON
- **Directus eliminado** (2026-05-31) — Railway costaba ~$15-20/mes extra por Directus + Redis + PostGIS + Bucket
- Los datos viven en `apps/web/lib/data/*.json`, versionados en git
- Para editar contenido: editar el JSON y hacer `git push` → Railway redeploya automáticamente
- Las páginas son SSG puro — `generateStaticParams` + sin `force-dynamic`

### Parallax en la ficha de personaje
- Implementado con Framer Motion `useScroll` + `useTransform` en `ParallaxHero.tsx`
- El contenedor de imagen se extiende `-15%` arriba y abajo de la sección para cubrir el offset
- `y` va de `"0%"` a `"25%"` → imagen más lenta que el scroll = profundidad
- Respeta `prefers-reduced-motion` con `useReducedMotion()`
- Funciona en iOS Safari (usa transforms GPU, no `background-attachment: fixed`)

### Tailwind CSS
- **v3, no v4** — v4 no genera utilities en pnpm monorepo + Next.js 15.1
- **tailwind.config.js CommonJS** — PostCSS no carga `.ts`
- **postcss como dep directa** en `apps/web`
- **Turbopack desactivado** — incompatible con `experimental.typedRoutes`

### Prisma
- **v5, no v6/v7** — v6 cambió API de datasource
- **pgvector en Fase 3** — `ALTER TABLE personajes ADD COLUMN embedding vector(1536)`
- Supabase reservado exclusivamente para Fase 3

### next-intl
- `i18n/request.ts` usa `.default` en dynamic import — sin esto React tira error de serialización

### Infraestructura
- **Todo en Railway** — no Vercel
- Un solo servicio activo: Next.js (antes eran 5: Next.js + Directus + Redis + PostGIS + Bucket)

---

## Personajes en producción

| Slug | Nombre | Origen | Imagen |
|------|--------|--------|--------|
| aya-uma | Aya Uma | prehispanico | ✅ |
| curiquingue | Curiquingue | prehispanico | ❌ |
| sacha-runa | Sacha Runa | prehispanico | ❌ |
| payaso | Payaso | mixto | ✅ |
| rey-moro | Rey Moro | colonial | ❌ |
| capitan | Capitán | colonial | ❌ |
| angel | Ángel | colonial | ❌ |
| perro | Perro | prehispanico | ✅ |
| diablos-de-lata | Diablos de lata | mestizo | ✅ |

Para agregar un personaje: editar `apps/web/lib/data/personajes.json` con la estructura existente.

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
pnpm type-check                                       # verificar tipos

# Prisma (Fase 3)
./apps/api/node_modules/.bin/prisma generate --schema=prisma/schema.prisma
./apps/api/node_modules/.bin/prisma migrate dev --schema=prisma/schema.prisma --name <nombre>
```
