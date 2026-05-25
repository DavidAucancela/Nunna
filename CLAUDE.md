# CLAUDE.md — Seres del Pase

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
- **Cross-sell al pie de cada personaje** — "Conoce a los otros seres" → más llaveros
- **OpenGraph rico** — si el comprador comparte en WhatsApp, la preview tiene que lucir bien

---

## Stack técnico

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend | Next.js 15.1 (App Router) + TypeScript | `apps/web/` |
| Estilos | Tailwind CSS v3 + PostCSS | `apps/web/tailwind.config.js` |
| i18n | next-intl v3 (es / qu / en) | `apps/web/i18n/` + `apps/web/messages/` |
| CMS | Directus headless (Railway) | `directus/` |
| Backend | NestJS (búsqueda semántica + webhooks) | `apps/api/` |
| Base de datos | PostgreSQL 16 (Supabase) | `prisma/schema.prisma` |
| Monorepo | Turborepo + pnpm workspaces | `turbo.json`, `pnpm-workspace.yaml` |

---

## Infraestructura de producción

| Servicio | Plataforma | URL |
|---------|------------|-----|
| CMS (Directus) | Railway | `https://directus-production-d593.up.railway.app` |
| Frontend (Next.js) | Railway | pendiente deploy |
| Base de datos | Supabase | `https://dhhesajpexcyainibwvl.supabase.co` |

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

Frontend: **http://localhost:3030/es** · Directus admin: **https://directus-production-d593.up.railway.app/admin**

### Variables de entorno (`apps/web/.env.local`) — ya configurado
```
DIRECTUS_URL=https://directus-production-d593.up.railway.app
DIRECTUS_STATIC_TOKEN=<token>
NEXT_PUBLIC_SUPABASE_URL=https://dhhesajpexcyainibwvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT>
NEXT_REVALIDATE_TOKEN=seres-del-pase-revalidate-2026
```

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
│   ├── pases/page.tsx
│   └── glosario/page.tsx
├── components/
│   ├── layout/Header.tsx
│   ├── layout/Footer.tsx
│   └── personajes/PersonajeCard.tsx
├── lib/directus.ts                 → Cliente SDK Directus
├── i18n/routing.ts                 → Locales + pathnames
├── i18n/request.ts                 → next-intl config
├── messages/                       → es.json / qu.json / en.json
├── tailwind.config.js              → CommonJS, NO .ts
└── next.config.ts

scripts/
├── setup-directus.mjs             → Crea 13 colecciones (idempotente, ya ejecutado)
└── seed-personajes.mjs            → Carga 8 personajes base (ya ejecutado)
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
- Frontend: todas las páginas base con estilos
- i18n es/qu/en con rutas localizadas
- Directus en Railway + Supabase conectados
- 13 colecciones creadas en Directus
- 8 personajes con fichas completas + 8 entradas glosario + 1 pase
- Build de producción sin errores

### 🔄 Siguiente
- Deploy Next.js en Railway
- Optimizar página de detalle para móvil (experiencia QR)
- Redefinir landing page orientada al producto

### ⏳ Fase 2
- Imágenes de personajes en Directus
- Sección cross-sell al pie de cada personaje
- Modo claro/oscuro

### ⏳ Fase 3
- Scroll narrativo (Lenis + Framer Motion)
- Hotspots interactivos en el traje
- Búsqueda semántica (pgvector + OpenAI)
- Mapa y calendario

---

## Decisiones técnicas clave

### Tailwind CSS
- **v3, no v4** — v4 no genera utilities en pnpm monorepo + Next.js 15.1
- **tailwind.config.js CommonJS** — PostCSS no carga `.ts`
- **postcss como dep directa** en `apps/web`
- **Turbopack desactivado** — incompatible con `experimental.typedRoutes`

### Prisma
- **v5, no v6/v7** — v6 cambió API de datasource
- **pgvector en Fase 3** — `ALTER TABLE personajes ADD COLUMN embedding vector(1536)`

### next-intl
- `i18n/request.ts` usa `.default` en dynamic import — sin esto React tira error de serialización

### Directus
- `publicadoEn: { _nnull: true }` en todas las queries
- Campos `createdAt`/`updatedAt` NO existen — Directus usa `date_created`/`date_updated`
- Campo `origen` en personajes: código corto `prehispanico | colonial | mestizo | mixto`

### Infraestructura
- **Todo en Railway** — no Vercel
- Railway hobby plan tiene cold starts (~8s si inactivo). Monitorear impacto en experiencia QR

---

## Colecciones Directus (ya creadas — no recrear)

`ubicaciones` → `tags` → `glosario_kichwa` → `media` → `personajes` → `variantes_personaje` → `elementos_traje` → `pases` → `testimonios` → `personaje_elementos` → `pase_personajes` → `media_relaciones` → `personaje_tags`

Para recrear desde cero: `node scripts/setup-directus.mjs`

---

## Personajes en producción

| Slug | Nombre | Origen |
|------|--------|--------|
| aya-uma | Aya Uma | prehispanico |
| curiquingue | Curiquingue | prehispanico |
| sacha-runa | Sacha Runa | prehispanico |
| payaso | Payaso | mixto |
| rey-moro | Rey Moro | colonial |
| capitan | Capitán | colonial |
| angel | Ángel | colonial |
| perro | Perro | prehispanico |

---

## Ética y contenido

- **Kichwa primero**: "Aya Uma" antes que "Diablo Huma"
- **`altText` obligatorio** en todas las imágenes
- **Citar fuentes** en cada testimonio
- **`publicadoEn: null`** = borrador, no aparece en el sitio
- **Licencia**: código MIT, contenido CC BY-NC-SA 4.0

---

## Comandos frecuentes

```bash
pnpm --filter @seres-del-pase/web dev --port 3030   # desarrollo
pnpm build                                            # build completo
pnpm type-check                                       # verificar tipos

node scripts/setup-directus.mjs    # recrear colecciones (idempotente)
node scripts/seed-personajes.mjs   # cargar personajes base

# Prisma
./apps/api/node_modules/.bin/prisma generate --schema=prisma/schema.prisma
./apps/api/node_modules/.bin/prisma migrate dev --schema=prisma/schema.prisma --name <nombre>
```
