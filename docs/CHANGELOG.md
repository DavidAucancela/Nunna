# Changelog — Seres del Pase

---

## [0.3.0] — 2026-07-12 — Rediseño cinematográfico de la ficha + fixes de desbloqueo

> ⚠ Entre 0.2.0 y esta versión hubo trabajo no registrado aquí (eliminación de Directus,
> desbloqueo de imanes, experiencia v2 fases 1/4, retiro del quichua/glosario, etc.).
> El registro fiel de ese período vive en `CLAUDE.md` (Estado actual + Decisiones) y el
> historial de git. Esta entrada cubre los PR #45 y #46.

### Rediseño cinematográfico de `/personajes/[slug]` (PR #46)

**Componentes nuevos** (`modules/personajes/`)
- `QuoteRevelacion.tsx` — "La Voz del Espíritu": el resumen editorial se pinta palabra por
  palabra sincronizado al scroll; comilla con glow del acento; línea de los tres mundos
  (Uku/Kay/Hanan Pacha) con hover, solo para origen prehispánico
- `StatsAnimados.tsx` — "Los Números Sagrados": ficha de datos como tarjetas con tilt 3D,
  íconos SVG que se dibujan (chakana / máscara / convergencia) y contador animado de
  festividades (cruce real con `pases.json`)
- `SecretoRitual.tsx` — "El Ritual del Desbloqueo": partículas doradas orbitando la card
  sellada → convergencia → destello radial → texto que se descifra carácter a carácter →
  sello circular "SECRETO REVELADO"; una sola vía (revelado queda revelado)
- `PersonajesEscenario.tsx` — cross-sell como escenario teatral 3D: tarjeta central al
  frente, laterales en perspectiva (`rotateY ±15°`); hover/tap la trae al centro y muestra
  su leyenda como texto de relación. Reemplaza a `PersonajesCarrusel` en la ficha
- `hooks/useParticleCanvas.ts` — canvas nativo compartido (modos `drift`/`orbit`,
  `converge()`, cleanup rAF, apagado con reduced-motion)
- `hooks/useTilt3D.ts` — tilt 3D con springs según posición del mouse

**Componentes refactorizados**
- `HeroDespertar.tsx` — entrada cinematográfica al despertar (zoom-out 1.35→1.0 + blur que
  se disuelve), 12 puntos de luz en canvas, ondas concéntricas en el botón de audio mientras
  suena, indicador de scroll como línea SVG que se dibuja
- `NarrativaSection.tsx` — número de capítulo con flip split-flap, serpiente SVG de progreso
  entre capítulos (puntos clicables), `palabrasClave` del JSON enfatizadas en los capítulos y
  términos kichwa con tooltip de traducción (glosario **tentativo** — revisar con hablante
  nativo); el secreto delega en `SecretoRitual`
- `AnatomiaSection.tsx` — zoom suave (1.22) hacia el hotspot activo con `transformOrigin` en
  el pin (queda anclado); anillos concéntricos escalonados tipo onda sonora en el pin activo
- `GaleriaSection.tsx` — efecto carta al hover (elevación + glow del acento), swipe
  horizontal en el lightbox, caption con entrada desde abajo

**Tipos y datos**
- `Narrativa.palabrasClave?` y `PersonajeListItem.leyenda?` en `@seres-del-pase/types`;
  `toListItem()` mapea la leyenda (texto de relación del escenario)

**Decisiones**
- Sin GSAP (decisión previa del proyecto se mantiene): todo con Framer Motion + canvas nativo
- Anatomía sigue vertical en móvil (IntersectionObserver) — el scroll horizontal scroll-linked
  es lo que iOS Safari congela
- Todo respeta `prefers-reduced-motion` y los acentos por origen existentes

### Fixes de verificación del desbloqueo (PR #45)
- El submit respeta `checkCodeStatus` en tiempo real; solo bloquea ante código CONFIRMADO
  como inválido, nunca por error de red/RPC (la función faltaba en el Supabase de producción
  y el primer fix bloqueaba todos los canjes)
- Con sesión activa ya no se pide correo (canje directo por `redeemCode`)
- `DespertarAnimation.tsx` — animación a pantalla completa tras el canje: grid 2×2 de los 4
  personajes que se ilumina según la colección y navega a la ficha (~2.2s; inmediata con
  `prefers-reduced-motion`)

### Infraestructura
- `output: "standalone"` probado y **revertido** (PR #44 → revert): ~156MB vs ~384MB en local,
  pero 502 total al desplegar en Railway. No reintroducir sin reproducir el fallo real
  (ver decisión en `CLAUDE.md`)

### Documentación
- `CLAUDE.md`: registra PR #45/#46 y la decisión del revert de standalone
- `docs/CHANGELOG.md`: esta entrada

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
