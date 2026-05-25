# Changelog — Seres del Pase

---

## [0.2.0] — 2026-05-25 — MVP conectado + catálogo base

### Modelo de negocio definido
- Producto: llaveros 3D de personajes ecuatorianos con QR
- QR → `/es/personajes/[slug]` — la ficha del personaje es el producto digital
- Infraestructura: todo en Railway (no Vercel)

### Infraestructura
- Directus desplegado en Railway conectado a Supabase
- `apps/web/.env.local` configurado con credenciales reales de producción
- 13 colecciones creadas en Directus via `scripts/setup-directus.mjs`
- Script idempotente: se puede re-ejecutar sin duplicar datos

### Contenido cargado
- **8 personajes** con fichas completas: Aya Uma, Curiquingue, Sacha Runa, Payaso, Rey Moro, Capitán, Ángel, Perro
- **8 entradas** de glosario kichwa (Aya Uma, Aya, Uma, Kallpa, Pachamama, Hanan Pacha, Kay Pacha, Yanantin)
- **1 pase**: Corpus Christi de Riobamba con ubicación Centro Histórico
- Aya Uma vinculado al Corpus Christi como personaje principal

### Correcciones técnicas
- `i18n/request.ts`: tipo `AbstractIntlMessages` en lugar de `Record<string, unknown>`
- `lib/directus.ts`: eliminados campos `createdAt`/`updatedAt` (no existen en Directus — usar `date_created`)
- `lib/directus.ts`: fix de cast `as unknown as` para evitar error TS de conversión
- Campo `origen` en personajes: códigos cortos (`prehispanico | colonial | mestizo | mixto`)

### Documentación
- `CLAUDE.md`: reescrito con estado real, modelo de negocio, decisiones tomadas
- `docs/IMPLEMENTACION.md`: actualizado para Railway, fases actuales
- `docs/CHANGELOG.md`: este archivo
- Eliminado: `vercel.json` (decisión: Railway en lugar de Vercel)
- Eliminado: `docs/PLAN.md` (redundante con `Guia.md`)
- Memoria persistente: `project_modelo_negocio.md`

---

## [0.1.0] — 2026-05-25 — Estructura base + frontend funcional

### Añadido

**Monorepo**
- `package.json` raíz con Turborepo (build, dev, lint, type-check)
- `pnpm-workspace.yaml` + `turbo.json`
- `.gitignore`, `.env.example`, `README.md`
- `.github/workflows/ci.yml` con lint, type-check, build en Node 20

**Frontend — `apps/web`**
- Next.js 15.1 App Router + TypeScript estricto
- Rutas localizadas `app/[locale]/` con `generateStaticParams`
- Páginas: landing, /personajes, /personajes/[slug], /pases, /glosario
- Layout con skip-to-content, Header fijo, Footer
- Componentes: Header, Footer, PersonajeCard, Badge
- Sistema de diseño: paleta andina, Fraunces serif, modo oscuro
- i18n: es/qu/en con pathnames localizados
- Cliente Directus: `lib/directus.ts`

**Backend — `apps/api`**
- NestJS con Fastify adapter
- Módulo `busqueda`: full-text + semántico pgvector (esqueleto Fase 3)
- Módulo `webhooks`: invalida caché Next.js on-demand
- Swagger en `/docs`

**Paquetes compartidos**
- `packages/types`: tipos TypeScript del dominio
- `packages/ui`: componente Badge
- `packages/config`: TSConfig, ESLint base

**Base de datos**
- `prisma/schema.prisma` v5: todos los modelos del dominio

**Documentación**
- `CLAUDE.md`, `docs/IMPLEMENTACION.md`, `Guia.md`
- `docs/decisiones/`: ADRs (Tailwind v3, Prisma v5, Supabase)
- `.claude/skills/run-web/SKILL.md`

### Cambios respecto al plan original

| Plan | Cambio | Razón |
|------|--------|-------|
| Tailwind v4 | → v3 | No genera utilities en pnpm monorepo + Next.js 15.1 |
| `prisma@^6` | → `^5` | v6 cambió API de datasource |
| `tailwind.config.ts` | → `.js` CommonJS | PostCSS no carga configs TypeScript |
| `next dev --turbopack` | → `next dev` | `experimental.typedRoutes` incompatible |
| Vercel (frontend) | → Railway | Centralizar infraestructura |
