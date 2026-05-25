# CLAUDE.md — Seres del Pase

Catálogo digital + experiencia inmersiva sobre los personajes de los pases riobambeños.
Autor: Jonathan David Aucancela Maguana.

---

## Stack técnico

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend | Next.js 15.1 (App Router) + TypeScript | `apps/web/` |
| Estilos | Tailwind CSS v3 + PostCSS | `apps/web/tailwind.config.js` |
| i18n | next-intl v3 (es / qu / en) | `apps/web/i18n/` + `apps/web/messages/` |
| CMS | Directus headless (Railway o Docker local) | `directus/` |
| Backend | NestJS (búsqueda semántica + webhooks) | `apps/api/` |
| Base de datos | PostgreSQL 16 (Supabase) | `prisma/schema.prisma` |
| Monorepo | Turborepo + pnpm workspaces | `turbo.json`, `pnpm-workspace.yaml` |

---

## Cómo correr el proyecto

### Prerrequisitos
- Node.js ≥ 20, pnpm ≥ 9, Docker Desktop (para Directus local)

### Setup inicial (una sola vez)
```bash
cp .env.example apps/web/.env.local    # Rellenar con credenciales reales
pnpm install
```

### Desarrollo
```bash
# Todo el monorepo en paralelo
pnpm dev

# Solo el frontend (el más usado)
pnpm --filter @seres-del-pase/web dev --port 3030

# Solo la API NestJS
pnpm --filter @seres-del-pase/api dev

# Directus CMS local
docker compose -f directus/docker-compose.yml up -d
```

El frontend queda en **http://localhost:3000** (o 3030 si 3000 está ocupado).
Directus en **http://localhost:8055**.

### Variables de entorno requeridas (`apps/web/.env.local`)
```
DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=<token de Directus>
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_REVALIDATE_TOKEN=<string secreto>
```

---

## Estructura de archivos importante

```
apps/web/
├── app/[locale]/           → Rutas localizadas (SSG)
│   ├── layout.tsx          → Layout raíz con Header/Footer
│   ├── page.tsx            → Landing page
│   ├── personajes/
│   │   ├── page.tsx        → Listado de personajes
│   │   └── [slug]/page.tsx → Detalle de personaje (SSG con generateStaticParams)
│   ├── pases/page.tsx      → Listado de pases agrupados por mes
│   └── glosario/page.tsx   → Glosario kichwa A-Z
├── components/
│   ├── layout/Header.tsx   → Header fijo con nav y menú móvil
│   ├── layout/Footer.tsx   → Footer con 3 columnas
│   └── personajes/PersonajeCard.tsx → Card de personaje con imagen
├── lib/directus.ts         → Cliente SDK Directus (getPersonajes, getPersonaje, getPases, getGlosario)
├── i18n/
│   ├── routing.ts          → Locales (es/qu/en) y pathnames localizados
│   └── request.ts          → getRequestConfig para next-intl
├── messages/               → Traducciones JSON (es, qu, en)
├── styles/globals.css      → @tailwind base/components/utilities + fuente Fraunces
├── tailwind.config.js      → Config Tailwind v3 (CommonJS, NO .ts)
├── postcss.config.js       → tailwindcss + autoprefixer
└── next.config.ts          → next-intl plugin + image domains Supabase

apps/api/src/
├── busqueda/               → Full-text search (Fase 1) + semántico pgvector (Fase 2)
└── webhooks/               → Invalida caché Next.js cuando Directus actualiza

packages/types/src/index.ts → Tipos TypeScript del dominio completo
prisma/schema.prisma        → Schema PostgreSQL (sin pgvector activo, añadir en Fase 2)
```

---

## Diseño — paleta y tipografía

```
Fondo oscuro:   #0F0E0C   → bg-fondo-oscuro
Fondo claro:    #F5F1EA   → bg-fondo-claro
Acento rojo:    #B8312F   → bg-acento-rojo / text-acento-rojo
Acento dorado:  #C89B3C   → text-acento-dorado (etiquetas, subtítulos)
Acento jade:    #1F4D3F   → bg-acento-jade
Texto claro:    #EFEAE0   → text-texto-claro
Borde sutil:    #2A2724   → border-borde-sutil

Tipografía serif: Fraunces (Google Fonts) → font-serif
Tipografía sans:  Inter / system-ui       → font-sans
```

Modo oscuro por defecto — `<html class="dark">` en layout.tsx.

---

## Decisiones técnicas clave (no obvias)

### Tailwind CSS
- **Usar v3, no v4.** Tailwind v4 con Next.js 15.1 en pnpm monorepo no genera utilities correctamente.
- **tailwind.config.js debe ser CommonJS** (`.js` con `module.exports`), NO TypeScript. PostCSS no puede cargar `.ts` config.
- **postcss debe instalarse como dependencia directa**: `pnpm add -D postcss` en `apps/web`. Sin esto los `@tailwind` directives pasan sin procesar.
- **Turbopack desactivado**: `experimental.typedRoutes` no es compatible con Turbopack. El dev script usa `next dev` sin `--turbopack`.

### Prisma
- **Prisma v5, no v6/v7.** v6+ cambió la API de datasource y rompe el workflow estándar.
- **MediaRelacion es polimórfica**: Prisma no soporta FKs tipadas a múltiples modelos con el mismo campo. La tabla existe en DB pero se consulta con `$queryRaw`.
- **pgvector desactivado en Fase 1**: el campo `embedding` se añade en Fase 2 manualmente con `ALTER TABLE personajes ADD COLUMN embedding vector(1536);`.

### next-intl
- `messages` en `i18n/request.ts` debe usar `.default` al hacer import dinámico: `(await import(...)).default`. Sin esto, se pasa el módulo completo y React tira error de serialización.
- Pathnames localizados configurados en `i18n/routing.ts` para las 3 lenguas.

### Directus como CMS
- Los datos fluyen: Directus (Railway) → SDK en `lib/directus.ts` → Server Components de Next.js.
- `publicadoEn: { _nnull: true }` en las queries — si un ítem no tiene fecha de publicación, no aparece en el sitio.
- Multimedia usa relaciones polimórficas (M2M con `entidadTipo` + `entidadId`). En Directus se configura como una relación Many-to-Many con campo extra.

---

## Estado actual del proyecto

### Fase 0 → 1 (en progreso)
- [x] Monorepo configurado (Turborepo + pnpm)
- [x] Schema Prisma completo
- [x] Frontend base: landing, personajes, pases, glosario, layout
- [x] i18n (es/qu/en) con rutas localizadas
- [x] Componentes: Header, Footer, PersonajeCard, Badge
- [x] Sistema de diseño: paleta andina, Fraunces serif, modo oscuro
- [x] Cliente Directus configurado
- [x] CI/CD con GitHub Actions
- [ ] Supabase configurado (necesita credenciales reales)
- [ ] Directus levantado con colecciones creadas
- [ ] Primer personaje cargado con contenido real
- [ ] Deploy en Vercel

### Pendiente Fase 2
- [ ] Mapa con MapLibre
- [ ] Calendario de festividades
- [ ] Búsqueda semántica con pgvector
- [ ] Audios de narraciones
- [ ] Modo claro/oscuro con next-themes

### Pendiente Fase 3
- [ ] Scroll narrativo con Lenis + Framer Motion
- [ ] Hotspots interactivos en imágenes del traje
- [ ] Línea de tiempo histórica

---

## Comandos frecuentes

```bash
# Instalar dependencias
pnpm install

# Desarrollo frontend
pnpm --filter @seres-del-pase/web dev

# Build completo
pnpm build

# Type check
pnpm type-check

# Directus local
docker compose -f directus/docker-compose.yml up -d
docker compose -f directus/docker-compose.yml down

# Prisma (desde raíz del monorepo)
./apps/api/node_modules/.bin/prisma generate --schema=prisma/schema.prisma
./apps/api/node_modules/.bin/prisma migrate dev --schema=prisma/schema.prisma --name <nombre>
```

---

## Colecciones a crear en Directus (orden de dependencias)

1. `ubicaciones`
2. `tags`
3. `glosario_kichwa`
4. `media`
5. `personajes`
6. `variantes_personaje` (M2O → personajes)
7. `elementos_traje`
8. `pases`
9. `testimonios`
10. `personaje_elementos` (M2M: personajes ↔ elementos_traje)
11. `pase_personajes` (M2M: pases ↔ personajes)
12. `media_relaciones` (polimórfica: media → personajes | pases | elementos_traje)
13. `personaje_tags` (M2M: personajes ↔ tags)

---

## Ética y contenido

- **Kichwa primero**: "Aya Uma" antes que "Diablo Huma". Nunca castellanizar como nombre principal.
- **`altText` obligatorio** en todas las imágenes. No negociable.
- **Citar fuentes** en cada `Testimonio`. El proyecto se distingue por el rigor académico.
- **`publicadoEn: null`** = borrador, no aparece en el sitio.
- **Fotos de personas**: solo con máscara/traje puestos, o con consentimiento escrito.
- **Licencia**: código MIT, contenido CC BY-NC-SA 4.0.
