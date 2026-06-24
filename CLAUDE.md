# CLAUDE.md — Nunna

Catálogo digital de personajes ecuatorianos con imanes artesanales como producto físico.
El comprador escanea el QR de la tarjeta del imán → aterriza directamente en la ficha del personaje.
Autor: Jonathan David Aucancela Maguana.

---

## Modelo de negocio

**Producto físico:** imanes (magnetos para refrigeradora) de personajes de los pases riobambeños (Aya Uma, Curiquingue, etc.)
**Formato:** tarjeta temática — imagen del personaje en el frente, QR en el reverso
**QR en la tarjeta** → dirige a `/es/personajes/[slug]` (ficha completa del personaje)
**La ficha del personaje es el producto digital** — justifica la compra.

Flujo del comprador:
1. Escanea QR de la tarjeta → `/es/personajes/[slug]`
2. Ve la ficha completa: resumen → historia (leyenda + capítulos + dato del artesano) → galería
3. Cross-sell al pie → más imanes de otros personajes

Implicaciones técnicas:
- **Mobile-first absoluto** — el QR se escanea con el teléfono
- **La ficha debe cargar rápido y mostrar todo el contenido narrativo**
- **Cross-sell al pie de cada personaje** — "Conoce a los otros seres" → más imanes
- **OpenGraph rico** — si el comprador comparte en WhatsApp, la preview tiene que lucir bien

---

## Stack técnico

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend | Next.js 15.5 (App Router) + TypeScript | `apps/web/` |
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
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              → usa MainContent
│   │   ├── page.tsx                → Landing
│   │   ├── personajes/
│   │   │   ├── page.tsx            → Grid de personajes
│   │   │   └── [slug]/page.tsx     → ★★ DESTINO QR — ficha completa con historia
│   │   ├── pases/page.tsx
│   │   ├── calendario/page.tsx     → Pases y Festividades
│   │   ├── glosario/page.tsx
│   │   ├── mapa/page.tsx
│   │   └── sobre/page.tsx
│   └── api/health/route.ts         → healthcheck Railway
├── components/                     → SOLO compartidos entre módulos
│   ├── layout/                     → Header, Footer, MainContent (wrapper pt-16 + footer)
│   └── ui/                         → FadeUp, AnimatedCounter, ScrollProgress, ScrollToTop,
│                                     WhatsAppShare, OrigenPlaceholder, LenisProvider
├── modules/                        → ★ Componentes por feature
│   ├── home/components/            → HeroSection, PaseMapSection (recorrido), PersonajesShowcase,
│   │                                 ProductoSection, OrigenesSection, StatsSection, MarqueeStrip, CtaFinal
│   ├── personajes/components/      → PersonajeCard, ParallaxHero, HeroDespertar (★ hero v2 inmersivo),
│   │                                 GaleriaSection (3 tabs), NarrativaSection, PersonajesCarrusel,
│   │                                 HotspotsViewer (sin uso), SimbolismoSection (sin uso)
│   ├── festividades/components/    → CalendarioGrid
│   └── glosario/components/        → GlosarioClient
├── lib/
│   ├── data.ts                     → ★ barrel — re-exporta lib/services/*
│   ├── services/                   → personajes.service.ts (toPersonaje, merge multimedia),
│   │                                 pases.service.ts, glosario.service.ts,
│   │                                 recorrido.service.ts (getRecorridos — multi-pase del mapa)
│   ├── data/
│   │   ├── personajes.json         → 9 personajes con narrativa, hotspots, imagenBanner, multimedia
│   │   │                             (+ flags v2: experiencia, audioAmbiente)
│   │   ├── glosario.json           → 16 entradas kichwa
│   │   ├── pases.json              → pases con fechas y rutas (grid /pases, /mapa, /calendario)
│   │   └── recorrido.json          → mapa "Un pase, un camino": { defaultPaseSlug, pases[] }
│   └── origen-styles.ts            → Estilos por tipo de origen
├── public/
│   ├── personajes/                 → Imágenes planas [slug]-*.png (retrato, banner, en-pase, presentación)
│   ├── informacion_pases/          → Imágenes de los pases (antes public/pases/, movidas 2026-06-14)
│   ├── pases-videos/               → Video de fondo del hero (pase-perros.mp4)
│   └── audio/                      → Audio ambiente del hero v2 ([slug]-ambiente.mp3) — ver README
├── i18n/routing.ts                 → Locales + pathnames
├── messages/                       → es.json / qu.json / en.json (incluye secciones "historia" y "experiencia")
├── tailwind.config.js              → CommonJS, NO .ts
└── next.config.ts
```

---

## Capa de datos — `lib/data.ts`

Todas las páginas importan de `@/lib/data` (nunca de Directus ni de APIs externas).

```ts
import { getPersonajes, getPersonaje, getPases, getGlosario } from "@/lib/data";
```

`lib/data.ts` es solo un barrel; la lógica vive en `lib/services/*.service.ts`.
`toPersonaje()` (en `personajes.service.ts`) construye el array `multimedia` mergeando:
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
| `imagenBanner` en JSON → `public/personajes/[slug]-banner.png` | Hero de la ficha (`ParallaxHero`) | Landscape 1376×768 |
| `multimedia[].url` con `titulo:"proceso"` → `public/personajes/[slug]-presentacion.png` | Galería tab "El imán" | Libre |
| `multimedia[].url` con `titulo:"en-pase"` | Galería tab "En el pase" + waypoints del recorrido | Libre |
| sin `titulo` / `titulo:"retrato"` | Galería tab "El personaje" | Libre |

> **Imágenes de pases** (grid `/pases`, `/mapa`, `/calendario`): en `public/informacion_pases/`,
> referenciadas por `pases.json` y `mapa/page.tsx` como `/informacion_pases/[archivo]`.
> **Video del hero**: `public/pases-videos/pase-perros.mp4` (poster fallback = `aya-uma-banner.png`).
> **Audio del hero v2**: `public/audio/[slug]-ambiente.mp3` (referenciado por `audioAmbiente` en
> `personajes.json`). Opt-in, sin autoplay; si falta el archivo, el botón aparece pero no suena.
> Ver `public/audio/README.md` para los nombres exactos esperados.
> No usar carpetas con espacios en `public/` — rompen las URLs.

### Galería — convención del campo `titulo`

```json
{
  "id": "aya-uma-presentacion",
  "tipo": "imagen",
  "url": "/personajes/aya-uma-presentacion.png",
  "altText": "Imán Aya Uma — presentación individual",
  "titulo": "proceso",
  "descripcion": "Texto que aparece en hover",
  "orden": 1
}
```

| `titulo` | Tab en galería |
|----------|---------------|
| `undefined` / `"retrato"` | El personaje |
| `"proceso"` | El imán |
| `"en-pase"` | En el pase |

> Terminología estandarizada a **"imán"** en todo el código y datos (commit `b749f53`, 2026-06-11). No reintroducir "llavero".

---

## Ficha pública — ruta `/personajes/[slug]`

**Propósito:** destino del QR — ficha completa, la historia va integrada (no existe ruta `/historia` separada).

### Estructura de la ficha (desde 2026-06-04)

```
1. Hero               → HeroDespertar (si experiencia:true) | ParallaxHero (resto) — imagen + nombre + origen
2. Resumen            → 1 párrafo lead editorial
3. Ficha de datos     → origen (color acento) + festividad + nombresAlt
4. Historia           → leyenda (cita centrada) + capítulos numerados + secreto del artesano
5. GaleriaSection     → 3 tabs: El personaje / El imán / En el pase
6. Cross-sell         → grid de otros personajes con imagen
```

**Eliminado de la ficha:** SimbolismoSection, HotspotsViewer, Testimonios, Tags, WhatsAppShare, ScrollProgress.

### Datos en `personajes.json` que usa la ficha

```json
"narrativa": {
  "leyenda": "Frase poderosa de una línea.",
  "secreto": "Dato del artesano que aparece al pie de la historia.",
  "capitulos": [
    { "titulo": "Título del capítulo", "texto": "3–4 oraciones." },
    { "titulo": "...", "texto": "..." },
    { "titulo": "...", "texto": "..." }
  ]
}
```

`palabrasClave` existe en el JSON pero ya no se usa (era para FaseLeyenda, eliminada).

### i18n — claves del namespace `historia`

```json
"historia": {
  "titulo_seccion": "Su historia",
  "leyenda_label": "Leyenda",
  "secreto_label": "El artesano revela",
  "volver": "Volver a los personajes"
}
```

### i18n — claves del namespace `experiencia` (hero v2 "Despertar")

```json
"experiencia": {
  "preludio": "Has despertado a",
  "despertar": "Despertar a {nombre}",
  "toca_para_despertar": "Toca para despertar",
  "activar_sonido": "Activar sonido",
  "silenciar": "Silenciar",
  "descubrir": "Descubrir"
}
```

> ⚠ Las cadenas kichwa (`qu.json`) de este namespace son **tentativas** — pendiente revisión
> con hablante nativo antes de producción.

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
- Build de producción SSG sin errores
- Eliminación completa de Directus
- Favicons SVG
- Renombrado marca a "Nunna"
- Nav fusionado — "Pases y Festividades" en un solo punto
- Rediseño ficha de personaje — parallax, lead editorial, galería
- **Banners profesionales** en el hero de 4 personajes (Aya Uma, Diablos de lata, Payaso, Perro)
- **Galería "El imán"** con imágenes de presentación individual para 3 personajes
- **Deploy en producción** → https://nunnaec-production.up.railway.app/
- **Adaptación producto imanes** — llaveros → imanes, QR → ficha directa, historia integrada en ficha (2026-06-04)
- **Ficha completa como destino QR** — Hero + Resumen + Historia (leyenda + capítulos + secreto) + Galería + Cross-sell
- **Fix shimmer título landing** — `text-shimmer` movido de `h1` a cada `motion.span` individual (2026-06-10)
- **Fix mapa "Un pase, un camino"** — tiles CARTO Dark Matter via raster CDN + height forzada antes de init MapLibre (2026-06-10)
- **Rediseño sección recorrido** — split-screen mapa (55%) + panel narrador (45%) con scroll-driven storytelling (`PaseMapSection.tsx`, 2026-06-10)
- **Reorganización a `modules/`** — componentes por feature en `modules/<feature>/components/`; `components/` solo layout y ui
- **Terminología "imán" estandarizada** + multimedia en-pase/proceso para Aya Uma, Payaso, Perro y Diablos de lata (2026-06-11)
- **Fix video del hero** — ruta corregida (`/pases-videos/`) + poster fallback; sin parpadeo (2026-06-14)
- **Reubicación de assets** — `public/pases/` → `informacion_pases/` (imágenes) + `pases-videos/` (video); limpieza de duplicados
- **Recorrido multi-pase** (`PaseMapSection.tsx` + `recorrido.json`, PR #13, 2026-06-16):
  - Datos en `recorrido.json` `{ defaultPaseSlug, pases[] }` vía `getRecorridos()`; rutas snapeadas a calles con `scripts/build-route.mjs` (OSRM)
  - Mapa estático (`fitBounds`, sin `flyTo` → sin lag); punto rojo viaja sincronizado al scroll
  - Panel: fotos rotativas con crossfade, `dato` por waypoint, panel finale con CTA a `/calendario`
  - Selector de pases (visible con ≥2); re-init del mapa al cambiar de pase
  - Anclaje bajo el navbar (`sticky top-16 h-[calc(100vh-4rem)]`)
  - 3 pases sembrados: Instituto Tecnológico (real), Mercado Santa Rosa y Niño Rey de la Paz (demo)
- **Experiencia v2 — Fase 1 "Despertar"** (`HeroDespertar.tsx`, 2026-06-22):
  - Hero inmersivo del destino del QR: pantalla negra inicial → al primer tap/scroll despierta
  - Parallax multicapa (scroll + mouse) sobre la imagen única; nombre letra a letra ("Has despertado a {nombre}")
  - Toggle de sonido **opt-in** (sin autoplay) con audio ambiente por personaje (`audioAmbiente`)
  - Respeta `prefers-reduced-motion` y funciona en tema **claro y oscuro**
  - Activado por flag `experiencia: true` en `personajes.json` (hoy: aya-uma, payaso, perro, diablos-de-lata);
    si es `false`/ausente cae al `ParallaxHero` original. Ver decisión técnica abajo.

### 🔄 Siguiente
- **Merge PR #13** (`fix/hero-poster-y-map-reinit-race` → `main`) y redeploy en Railway
- **Recorrido — datos reales** de Mercado Santa Rosa y Niño Rey de la Paz: coords ancla exactas
  (hoy aproximadas), qué personajes desfilan en cada uno, y fotos propias (hoy reusan las existentes).
  Tras editar coords: correr `node scripts/build-route.mjs`
- Añadir los demás pases de `pases.json` al recorrido (hoy 3 de ~10)
- Añadir `imagenBanner` y fotos a los 5 personajes sin imagen (Curiquingue, Sacha Runa, Rey Moro, Capitán, Ángel)
- Fotografías reales "En el pase" (`titulo: "en-pase"`) y del imán físico (`titulo: "proceso"`) para la galería
- **Experiencia v2** — colocar los 4 audios reales en `public/audio/`; revisar cadenas kichwa del namespace
  `experiencia` con hablante nativo; continuar Fases 2-12 (identidad/ficha viva, cosmovisión rostro dual,
  anatomía con `HotspotsViewer`, números con `AnimatedCounter`, etc.)

### ⏳ Fase 2
- Modo claro/oscuro ✅ (toggle junto a los idiomas, commit `58c591e`)
- Página de detalle de pase (`/pases/[slug]`)

### ⏳ Fase 3
- Hotspots interactivos en el traje (componente `HotspotsViewer.tsx` ya existe, datos en JSON)
- Mapa interactivo (MapLibre — dependencia ya instalada)

### ❌ Descartado
- **Búsqueda semántica** (pgvector + Supabase + NestJS) — funcionalidad cancelada (2026-06-21).
  Se eliminó la página/ruta `/buscar` y su botón del navbar. Ver decisión abajo.

---

## Decisiones técnicas clave

### Experiencia inmersiva v2 — hero "Despertar" (2026-06-22)
Rediseño de la ficha `/personajes/[slug]` (destino del QR) hacia scrollytelling inmersivo
(plan de 12 fases del autor). **Fase 1 implementada**; el resto pendiente.
- **Una sola ruta, mejora progresiva.** La v2 vive en la **misma** ruta del QR (no `/experiencia/[slug]`)
  para no romper el contrato de URL de los imanes impresos. Se activa por personaje, no globalmente.
- **Flag por datos:** campo `experiencia: true` en `personajes.json` → la ficha renderiza `HeroDespertar`;
  si es `false`/ausente cae al `ParallaxHero` original (degradación limpia para los personajes sin imágenes).
  Campos nuevos en `@seres-del-pase/types` (`experiencia`, `audioAmbiente`) y mapeados en `personajes.service.ts`.
- **Stack:** `framer-motion` + Lenis (ya instalados). **No se agregó GSAP** — choca con el monorepo
  (Turbopack ya desactivado por `typedRoutes`) y hoy nada lo justifica.
- **Audio opt-in, sin autoplay** (`public/audio/[slug]-ambiente.mp3`): toggle de silencio muy visible;
  volumen fijo 0.32 al activar. Si falta el archivo el botón aparece pero no suena.
- **Ambos temas:** los tokens `fondo-oscuro`/`fondo-claro` se **invierten** vía CSS vars en `.dark`
  (`fondo-oscuro` = bg de la página en ambos temas), así el gradiente del hero funde a la página sin banda.
- **Reduce motion:** `useReducedMotion()` apaga parallax (scroll y mouse), rotaciones y pulsos.
- **Reutilizable para fases siguientes (ya en el repo, dormido):** `HotspotsViewer.tsx` (Fase 4 — aya-uma
  ya tiene `hotspots`), `AnimatedCounter.tsx` (Fase 5), `SimbolismoSection` + campo `simbolismo` (Fase 3).
- ⚠ Cadenas kichwa del namespace `experiencia` son **tentativas** — revisar con hablante nativo.

### Calendario — solo meses con pases (2026-06-22)
- `/calendario` ya **no** muestra el grid de los 12 meses. `CalendarioGrid` presenta **solo los meses con
  eventos** como chips con contador (Ene · Abr · Nov · Dic); al elegir uno se ven sus pases **agrupados por
  día** en grid de tarjetas (`PaseCard` con imagen de `informacion_pases` + tipo/horario/ruta/personaje).
- **Fiestas de Riobamba** = dos fechas: **21 abr** (`fiestas-riobamba`, independencia 1820 + Batalla de Tapi
  1822) y **11 nov** (`primer-grito-riobamba`, primer grito 1820). `nino-familia` = 6 ene.

### Hero del inicio — siempre oscuro en ambos temas (2026-06-22)
- El hero es un **video oscuro**: en modo claro los tokens invertidos lavaban el video. Se fuerza el tema
  oscuro **solo en esa sección** (clase `dark` + `bg-fondo-oscuro` en el `<section>`) para conservar el
  contraste en ambos modos. No convertirlo en "claro".

### "Cómo funciona" — stepper con foco + carrusel móvil (`ProductoSection.tsx`, 2026-06-22)
- **Paso 01 (imán):** fondo = foto del diablo de lata en pase borrosa/atenuada; el imán va grande y centrado
  con **máscara radial** que difumina su fondo blanco (la imagen del imán trae fondo blanco, no es recorte).
- **Niveles con foco (`StepperList`, compartido):** las 3 categorías **siempre visibles**; la activa enfocada
  y las demás reducidas/desenfocadas (`blur`+`opacity`+`scale`).
- **Desktop:** escena anclada (sticky), el scroll cambia el nivel. **Móvil:** **carrusel táctil**
  (swipe/botones/tap), **no depende del scroll** (robusto en iOS); el scroll del desktop se ignora en móvil
  (`track.offsetParent === null`).

### Búsqueda semántica descartada ⚠ (2026-06-21)
- La **búsqueda semántica no se implementará**. Era el motivo principal de Supabase/pgvector y NestJS en Fase 3.
- Se eliminó: la página `app/[locale]/buscar/page.tsx`, la ruta `/buscar` (+ `/maskanakuy` qu / `/search` en) en `i18n/routing.ts`, el botón de búsqueda del `Header`, y las claves `nav.buscar` (es/qu/en).
- **No reintroducir** un botón ni ruta de búsqueda. Si en el futuro se quiere buscar, replantear desde cero.
- Supabase/pgvector quedan sin uso real; si no aparece otro caso de Fase 3 que los necesite, considerar retirarlos.

### Navbar — 3 secciones visibles en móvil (2026-06-21)
- El navbar móvil muestra **las 3 secciones inline** (Pases, Calendario, Glosario) — ya no hay menú hamburguesa.
- El selector de idioma en móvil es un **botón compacto** (`locale` actual + chevron) que abre un popover; en escritorio son pills siempre visibles.
- Mantener el header en **una sola fila** (~64px): muchos lugares dependen de `top-16`/`pt-16` (MainContent, sticky de `PaseMapSection`). No añadir una segunda fila.

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
- `imagenBanner` → landscape 1376×768 con texto de marca, para hero grande
- `ParallaxHero` usa `imagenBanner ?? imagen` (banner primero, retrato como fallback)
- Personajes sin `imagenBanner` muestran `OrigenPlaceholder` artístico en el hero

### Parallax en la ficha de personaje
- Framer Motion `useScroll` + `useTransform` en `ParallaxHero.tsx`
- El contenedor de imagen se extiende `-15%` arriba y abajo
- `y` va de `"0%"` a `"25%"` → imagen más lenta que el scroll
- Respeta `prefers-reduced-motion` con `useReducedMotion()`

### Tailwind CSS
- **v3, no v4** — v4 no genera utilities en pnpm monorepo + Next.js 15.5
- **tailwind.config.js CommonJS** — PostCSS no carga `.ts`
- **Turbopack desactivado** — incompatible con `experimental.typedRoutes`

### Prisma
- **v5, no v6/v7** — v6 cambió API de datasource
- Supabase reservado exclusivamente para Fase 3

### next-intl
- `i18n/request.ts` usa `.default` en dynamic import — sin esto React tira error de serialización

### QR — contrato de URL permanente ⚠
El QR de cada imán físico codifica `/[locale]/personajes/<slug>`. Una vez impreso, **esa URL es inmutable** — si cambia, el imán ya vendido da 404 y no hay forma de arreglarlo desde la web.
- **Los slugs de `personajes.json` son un contrato permanente. Nunca renombres un slug a secas.** Para renombrar: cambia el `slug` en el JSON **y** agrega `{ from: "<viejo>", to: "<nuevo>" }` en `lib/data/slug-aliases.ts`. Nunca borres un alias.
- `next.config.ts` (`redirects()`) genera un `308` por cada alias × idioma (`/es/personajes`, `/qu/runakunamanta`, `/en/characters` — deben coincidir con `i18n/routing.ts`). Los redirects de next.config corren **antes** del middleware de next-intl, así que la URL localizada del QR coincide directo.
- Slug muerto sin alias → `app/[locale]/personajes/[slug]/not-found.tsx` (404 amable con salida al catálogo; copy en namespace `error`: `personaje_titulo` / `personaje_desc` / `ver_catalogo`).
- **Riesgo de infraestructura (no resoluble por código):** el QR codifica también el dominio. Hoy es el subdominio autogenerado de Railway (`nunnaec-production.up.railway.app`); si se cambia de hosting o se renombra el proyecto, **todos los imanes impresos se rompen**. Antes de imprimir a escala, usar un **dominio propio** apuntado a Railway.

### text-shimmer con Framer Motion (`HeroSection.tsx`)
- **No poner `text-shimmer` en el padre** cuando los hijos son `motion.span` con `whileHover`
- El problema: `scale` en `whileHover` crea un nuevo compositing layer para el span; ese layer hereda `color: transparent` del padre pero pierde acceso al gradiente `background-clip: text` del `h1` → letra invisible
- **Solución**: aplicar `text-shimmer` directamente en cada `motion.span`, no en el `h1` contenedor

### MapLibre GL en PaseMapSection (`PaseMapSection.tsx`)
- **Dos layouts por breakpoint** (2026-06-21): el recorrido por **scroll-pinned** (sticky `300vh`) es frágil
  en móvil — iOS Safari **congela las animaciones ligadas al scroll** durante el desplazamiento por inercia,
  así que en el teléfono el recorrido se veía a saltos/congelado. Solución:
  - **Móvil** (`max-width:767px`, vía `matchMedia` → estado `isMobile`): **carrusel táctil** sin scroll —
    mapa fijo arriba + tarjeta abajo con botones ‹ ›, **swipe** horizontal y **pines tocables**. La navegación
    mueve `activeIdx` por la secuencia `[-1, ...waypoints, finaleIdx]` y `goToIdx()` pinta el mapa a ese punto.
  - **Escritorio**: se mantiene el scroll-driven original (sin cambios de UX).
  - El handler de scroll (`useMotionValueEvent`) hace `if (isMobileRef.current) return`; los hooks se llaman
    siempre (el `return` del layout móvil va **después** de todos los hooks). `paintMap(p, full?)` es el
    pintor compartido (ruta de progreso + dot + pines); `mapHeader`/`storyCard` se reutilizan en ambos layouts.
  - El init del mapa incluye `isMobile` en sus deps → al cruzar el breakpoint el contenedor cambia y el mapa
    se reconstruye; tras `load` repinta el `activeIdx` vigente (rotación de pantalla a mitad de recorrido).
- **Datos del recorrido en JSON (multi-pase)**: `lib/data/recorrido.json` tiene la forma
  `{ defaultPaseSlug, pases: [{ paseSlug, paseNombre, centro, zoom, ruta, waypoints }] }`.
  `getRecorridos()` (`lib/services/recorrido.service.ts`) une cada waypoint con `personajes.json`
  (nombre kichwa-first, `narrativa.leyenda`, altText) y pasa el campo opcional `dato`. El componente
  recibe `recorridos` como prop desde `page.tsx` — no editar datos en el TSX.
- **Agregar un pase al recorrido**: añadir un objeto a `pases[]` con `paseSlug` (debe existir en
  `pases.json`), `centro`/`zoom`, e waypoints con `coord` ancla por personaje; el selector de pases
  aparece solo cuando hay ≥2. Luego correr el script de ruta (abajo) para generar la geometría.
- **Ruta sobre calles reales**: `scripts/build-route.mjs` toma los `coord` de los waypoints, pide a
  OSRM la ruta que los une, y hornea la geometría densa en `ruta` + alinea los `coord` de los pines a
  la calle. Correr `node scripts/build-route.mjs` cuando cambien anclas/pases. Necesita red; producción
  queda estática (cero llamadas en runtime, sigue SSG). ⚠ El demo OSRM público (`router.project-osrm.org`)
  solo corre perfil **car**; el `/foot/` de la URL se ignora → la ruta sigue sentidos de auto. Para
  ruta peatonal real, usar OpenRouteService/Valhalla.
- **Mapa estático (sin lag)**: la cámara NO persigue el scroll. `fitBounds` encuadra toda la ruta al
  cargar y nunca se mueve; el punto rojo viaja sobre el mapa fijo sincronizado al scroll. No usar `flyTo`
  por waypoint (causaba lag/"settling" mientras la animación de 1s competía con el scroll).
- **Fotos rotativas**: cada waypoint cicla por `[imagen, ...imagenesExtra]` cada 3.5s con crossfade
  (estado `photoIdx`, indicador clicable). La imagen es `flex-1` (llena el panel); texto compacto debajo.
- **Panel finale**: al pasar `FINALE_THRESHOLD` (~0.97 del scroll) se muestra un panel de cierre con
  CTA a `/calendario`, aprovechando el tramo final del scroll (índice centinela `waypoints.length`).
- **Selector de pases**: etiqueta "Cambia de pase" + pestañas; visible solo con ≥2 pases.
- **Switch de pase = re-init**: cambiar `activePaseSlug` reconstruye el mapa vía el cleanup del
  `useEffect` (`map.remove()`); el init async tiene guard `cancelled` tras el `await import` para no
  dejar mapas huérfanos si se cambia de pase mientras el import está pendiente.
- **Sticky bajo el navbar**: el contenedor usa `sticky top-16 h-[calc(100vh-4rem)]` (el Header es
  `fixed`, 64px); con `top-0` el contenido se metía detrás del navbar.
- **Tiles**: usar CARTO raster CDN `dark_all`, no el endpoint GL vector JSON que requiere auth
  - URL: `https://{a,b,c,d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
  - El endpoint `/gl/dark-matter-gl-style/style.json` fue deprecado/requiere API key desde 2023
  - Atribución CARTO/OSM obligatoria → `attributionControl: { compact: true }`, nunca `false`
- **Altura del contenedor**: fijar `container.style.height` en px (leída del wrapper `h-[45vh]`/`md:h-full`)
  **antes** de `new maplibregl.Map()` — MapLibre lee `offsetHeight` al inicializar; `absolute inset-0`
  no resuelve la altura antes del primer paint → devuelve 300px (default MapLibre)
- **ResizeObserver sobre el wrapper**: re-sincroniza la altura en px y llama `map.resize()` (mobile rotate, etc.)
- **Init perezoso**: el mapa se inicializa vía IntersectionObserver (`rootMargin: "100% 0px"`) cuando la
  sección se acerca al viewport — no descargar maplibre-gl/tiles si el usuario no llega a la sección
- **prefers-reduced-motion**: `useReducedMotion()` controla las transiciones del panel y la rotación de
  fotos (se desactiva); el video del hero también respeta `motion-safe`
- MapLibre versión: `^4.7.1`

### Infraestructura
- **Todo en Railway** — no Vercel

---

## Personajes en producción

| Slug | Nombre | Origen | Retrato | Banner | Narrativa | Experiencia v2 |
|------|--------|--------|---------|--------|-----------|----------------|
| aya-uma | Aya Uma | prehispanico | ✅ | ✅ | ✅ | ✅ |
| curiquingue | Curiquingue | prehispanico | ❌ | ❌ | ✅ | ❌ |
| sacha-runa | Sacha Runa | prehispanico | ❌ | ❌ | ✅ | ❌ |
| payaso | Payaso | mixto | ✅ | ✅ | ✅ | ✅ |
| rey-moro | Rey Moro | colonial | ❌ | ❌ | ✅ | ❌ |
| capitan | Capitán | colonial | ❌ | ❌ | ✅ | ❌ |
| angel | Ángel | colonial | ❌ | ❌ | ✅ | ❌ |
| perro | Perro | prehispanico | ✅ | ✅ | ✅ | ✅ |
| diablos-de-lata | Diablos de lata | mestizo | ✅ | ✅ | ✅ | ✅ |

> **Experiencia v2** = flag `experiencia: true` en el JSON → usa `HeroDespertar`. Requiere imágenes
> completas; los 4 activos coinciden con los que tienen retrato + banner. Audio en `public/audio/`.

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

# Recorrido del mapa — snap de rutas a calles (OSRM). Correr tras editar
# coords ancla de waypoints en recorrido.json. Necesita red; no toca runtime.
node scripts/build-route.mjs

# Prisma (Fase 3)
./apps/api/node_modules/.bin/prisma generate --schema=prisma/schema.prisma
./apps/api/node_modules/.bin/prisma migrate dev --schema=prisma/schema.prisma --name <nombre>
```
