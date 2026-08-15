# Changelog — Seres del Pase

---

## [0.5.0] — 2026-08-15 — Mapa nacional MapLibre, fixes de producción y setup de Resend

Cubre PR #63–#68. #63 (mapa nacional + fusión de `/calendario`) ya estaba documentado en
`CLAUDE.md` (sección `/pases`); esta entrada se enfoca en los fixes y features posteriores,
descubiertos al revisar el sitio recién desplegado.

### Fixes en producción (PR #64, #65, #66)

- **Crash al navegar fuera de `/pases`** (`MapaEcuador.tsx`): los 4 `useEffect` del mapa
  limpian en orden de declaración al desmontar; el cleanup del efecto de Hover corría
  después del de Init (que ya había llamado `map.remove()`), y seguía llamando
  `setFeatureState` sobre un mapa MapLibre ya destruido → `Cannot read properties of
  undefined (reading 'setFeatureState')`, tumbaba toda la app. Fix: ref `mapRemovedRef`
  marcado en el cleanup de Init, respetado por el cleanup de Hover.
- **Mapa nacional se veía completamente en negro**: `maplibre-gl` trae su propia hoja de
  estilos con `.maplibregl-map { position: relative }`, que se aplica al contenedor apenas
  se inicializa el mapa y le gana a la clase `absolute` de Tailwind por orden de carga de
  CSS. Sin `position: absolute`, `inset-0` deja de funcionar, el contenedor colapsa a
  `height: 0`, y MapLibre cae a su canvas por defecto (480×300). Fix: mover
  `position`/`inset` a inline style (máxima especificidad, gana siempre sobre cualquier
  stylesheet externa).
- **Fotos de portada desactualizadas**: nuevas fotos del imán (fondo transparente,
  recortadas al bounding box) para Payaso, Diablos de lata y Perro — la de Perro traía
  mucho espacio vacío alrededor de la figura en el archivo original. Aya Uma no cambió.
  Mismo path que las portadas actuales (`public/personajes/[slug].webp`), sin tocar
  `personajes.json` ni ningún componente.
- **Resumen editorial se veía como un muro de texto** en `QuoteRevelacion.tsx` (reproducido
  en Aya Uma): el `resto` plegado bajo "Leer más" se pintaba en un solo `<p>` con el string
  crudo de `personajes.json`; cuando el resumen trae varios párrafos separados por línea en
  blanco, el navegador colapsa esos `\n\n` a un espacio. Fix: separar `resto` por línea en
  blanco y renderizar cada párrafo en su propio `<p>` con espaciado entre ellos.

### Selector de pases en `RecorridosProvincia.tsx` (PR #67 — ⚠ ver Pendientes)

Provincias con varios pases trazados (ej. Chimborazo, 3 rutas) solo mostraban todas las
rutas a la vez, con los personajes visibles únicamente al pasar el mouse por cada marcador
del mapa uno por uno. Los chips de la leyenda (color ↔ pase) ahora son botones:
- **"Todos"** — comportamiento original, las N rutas a la vez.
- **Un pase específico** — atenúa/oculta las demás rutas y marcadores, la cámara encuadra
  solo esa ruta (`fitBounds`), y aparece una grilla "Personajes de este pase" (foto + link
  a la ficha) para no depender de pasar el mouse marcador por marcador.
- Con un solo pase trazado no cambia nada (sigue como leyenda simple, sin botón).

### Email del magic-link — Resend como SMTP custom (PR #68, solo docs)

El correo del magic-link (`ColeccionProvider.signInWithEmail`) sale hoy por el SMTP
compartido de Supabase: rate-limit bajo, mala reputación de IP (cae en spam) y sin
branding. Se agrega el runbook completo (`supabase/RESEND-SETUP.md`) + plantillas HTML
branded (`supabase/email-templates/{magic-link,confirm-signup}.html`) para configurar
Resend como SMTP custom de Supabase Auth. **No toca código de la app** — mismo
`signInWithOtp`, mismo `?unlock_code=` en la URL. Los pasos manuales (verificar dominio en
Resend, cargar credenciales en el dashboard de Supabase, pegar las plantillas) quedan
pendientes de ejecución — ver Pendientes abajo.

### Pendientes

- **⚠ PR #67 no llegó a `main`.** Se abrió con base `fix/mapa-ecuador-setfeaturestate-crash`
  (para poder probarlo, ya que sin esos fixes el mapa no renderiza) y se mergeó ahí — pero
  esa rama se mergeó a `main` de forma independiente por otro PR (#64), dejando el commit
  del selector de pases (`eb7f322`) huérfano en una rama que ya no apunta a nada útil desde
  `main`. El código no se perdió (`git ls-remote` confirma que
  `feat/selector-pases-recorrido` sigue en origin), pero **hay que abrir un PR nuevo de
  `feat/selector-pases-recorrido` contra `main`** para que el selector de pases llegue a
  producción.
- **Resend**: pasos manuales fuera del repo (dominio verificado, credenciales SMTP,
  plantillas pegadas en el dashboard) — sin esto el gating sigue funcionando igual, solo
  que el correo sigue saliendo del SMTP default de Supabase.
- **WhatsApp como canal alternativo** (código de desbloqueo o magic-link): evaluado a nivel
  de viabilidad, no implementado. Dos rutas posibles — Supabase Phone Auth + Twilio Verify
  (nativo, pero requiere número de WhatsApp Business aprobado por Meta, trámite de
  días/semanas) o reenviar el mismo magic-link por WhatsApp desde un endpoint server-side
  nuevo (primer uso real de `SERVICE_ROLE_KEY` en runtime, rompe un poco el "sin backend
  propio"). Sin decisión tomada.

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
