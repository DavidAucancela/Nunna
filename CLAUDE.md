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
| i18n | next-intl v3 (es / en) | `apps/web/i18n/` + `apps/web/messages/` |
| Datos | JSON estático en repo | `apps/web/lib/data/` |
| Auth + colección | Supabase (Postgres) | `supabase/schema.sql` |
| Monorepo | Turborepo + pnpm workspaces | `turbo.json`, `pnpm-workspace.yaml` |

> **Sin CMS.** Directus fue eliminado (2026-05-31) por costo. Los datos viven en JSON versionados en el repo.

---

## Infraestructura de producción

| Servicio | Plataforma | Notas |
|---------|------------|-------|
| Frontend (Next.js) | Railway | Único servicio activo |
| Auth + colección | Supabase | **Activo** desde 2026-06-24 (desbloqueo de imanes) — magic-link + tablas `unlock_codes`/`user_unlocks` |

**Todo en Railway.** No usar Vercel — decisión tomada para centralizar infraestructura.
**Supabase ya no está "solo reservado":** lo usa el desbloqueo de imanes (auth + colección). El contenido
sigue en JSON estático; Supabase entra solo en runtime para auth/colección. Ver decisión técnica abajo.

---

## Cómo correr el proyecto

### Prerrequisitos
- Node.js ≥ 20, pnpm ≥ 9

### Desarrollo
```bash
pnpm install

# Frontend (puerto 3030)
pnpm --filter @seres-del-pase/web dev --port 3030
```

> `apps/api/` (NestJS) y `prisma/` se eliminaron (2026-07-02) — eran exclusivamente para la búsqueda
> semántica, descartada el 2026-06-21. No quedó ningún otro uso real; ver docs/PLAN-V3.md Fase 4.

Frontend: **http://localhost:3030/es**

### Variables de entorno (`apps/web/.env.local`)
```
# Auth + colección (desbloqueo de imanes)
NEXT_PUBLIC_SUPABASE_URL=https://dhhesajpexcyainibwvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT>

# URL canónica (OG/sitemap/robots — lib/site-url.ts). Opcional: si falta, cae
# al dominio de Railway. Cuando haya dominio propio, cambiarla aquí y en Railway.
NEXT_PUBLIC_SITE_URL=https://nunnaec-production.up.railway.app
```

No se necesitan variables de entorno para correr el frontend en desarrollo — los datos vienen del JSON.
Sin las de Supabase el gating queda apagado (todo visible), que es lo cómodo en dev.

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
│   │   ├── pases/
│   │   │   ├── page.tsx            → Grid + mapa "Un pase, un camino" (/mapa se fusionó aquí, con redirect)
│   │   │   └── [slug]/page.tsx     → Detalle de pase (scaffold mínimo — solo datos logísticos, sin historia editorial)
│   │   ├── calendario/page.tsx     → Pases y Festividades
│   │   ├── desbloquear/page.tsx    → ★ canje de código de 6 chars (desbloqueo de imán)
│   │   ├── mis-personajes/page.tsx → ★ colección del usuario + progreso + logros
│   │   └── sobre/page.tsx
│   └── api/health/route.ts         → healthcheck Railway
├── components/                     → SOLO compartidos entre módulos
│   ├── auth/                       → ColeccionProvider (sesión + colección Supabase, useColeccion/useDesbloqueo)
│   ├── layout/                     → Header, Footer, MainContent (wrapper pt-16 + footer)
│   └── ui/                         → FadeUp, AnimatedCounter, ScrollProgress, ScrollToTop,
│                                     WhatsAppShare, OrigenPlaceholder, LenisProvider
├── modules/                        → ★ Componentes por feature
│   ├── home/components/            → HeroSection, PaseMapSection (recorrido), PersonajesShowcase,
│   │                                 ProductoSection, OrigenesSection, StatsSection, MarqueeStrip, CtaFinal
│   ├── personajes/components/      → PersonajeCard, ParallaxHero, HeroDespertar (★ hero v2 inmersivo),
│   │                                 HeroGated/AnatomiaGated (★ gating por desbloqueo),
│   │                                 AnatomiaSection (★ Fase 4 — hotspots scroll-driven),
│   │                                 GaleriaSection (3 tabs), NarrativaSection, PersonajesCarrusel,
│   │                                 HotspotsViewer (superseded por AnatomiaSection), SimbolismoSection (sin uso)
│   ├── desbloqueo/components/      → DesbloquearForm, ColeccionClient (★ desbloqueo de imanes)
│   └── festividades/components/    → CalendarioGrid
├── lib/
│   ├── supabase/client.ts          → ★ cliente Supabase browser (auth + colección; null si faltan envs)
│   ├── data.ts                     → ★ barrel — re-exporta lib/services/*
│   ├── services/                   → personajes.service.ts (toPersonaje, merge multimedia),
│   │                                 pases.service.ts,
│   │                                 recorrido.service.ts (getRecorridos — multi-pase del mapa)
│   ├── data/
│   │   ├── personajes.json         → 4 personajes publicados (con narrativa, hotspots, imagenBanner,
│   │   │                             multimedia + flags v2: experiencia, audioAmbiente); los 5 sin
│   │   │                             imágenes se retiraron (2026-06-29) hasta tener assets
│   │   ├── pases.json              → pases con fechas y rutas (grid /pases, /mapa, /calendario);
│   │   │                             `personajeSlug` = clave de cruce con personajes.json
│   │   └── recorrido.json          → mapa "Un pase, un camino": { defaultPaseSlug, pases[] }
│   ├── origen-styles.ts            → Estilos por tipo de origen
│   ├── site-url.ts                 → SITE_URL (NEXT_PUBLIC_SITE_URL; base de OG/sitemap/robots)
│   └── seo.ts                      → localeAlternates() — canonical + hreflang por página
├── public/
│   ├── personajes/                 → Imágenes planas [slug]-*.png (retrato, banner, en-pase, presentación)
│   ├── informacion_pases/          → Imágenes de los pases (antes public/pases/, movidas 2026-06-14)
│   ├── pases-videos/               → Video de fondo del hero (main-header.mp4, 4.4 MB comprimido)
│   └── audio/                      → Audio ambiente del hero v2 ([slug]-ambiente.mp3) — ver README
├── i18n/routing.ts                 → Locales + pathnames
├── messages/                       → es.json / en.json (incluye secciones "historia" y "experiencia")
├── tailwind.config.js              → CommonJS, NO .ts
└── next.config.ts
```

---

## Capa de datos — `lib/data.ts`

Todas las páginas importan de `@/lib/data` (nunca de Directus ni de APIs externas).

```ts
import { getPersonajes, getPersonaje, getPases } from "@/lib/data";
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
> **Video del hero**: `public/pases-videos/main-header.mp4` (poster = `main-header-poster.jpg`).
> Comprimido a 960×540 CRF 30 (6 MB, 2026-07-03) — **trae audio propio** (pista AAC 96k, no un
> `<audio>` separado). El `<video>` arranca `muted` (exigencia de autoplay del navegador) y el botón
> grande de sonido (`HeroSection.tsx`, esquina inferior derecha) alterna `video.muted` con el primer
> gesto del usuario — mismo patrón que el toggle de audio ambiente en `HeroDespertar`. Si se reemplaza
> el video, mantener el presupuesto (~6 MB) y preservar la pista de audio al comprimir con ffmpeg
> (`-c:a aac -b:a 96k`, no omitir `-c:a`).
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
4b. AnatomiaSection   → (experiencia + hotspots) Fase 4: visual sticky con pines + cards scroll-driven
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

**`hotspots[]` (Fase 4 — `AnatomiaSection`):** cada elemento del traje con coords `%` calibradas a
`imagenPortada` (la figura del imán). `material` y `artesano` son opcionales (se muestran como filas
etiquetadas en la card). Solo se renderiza si el personaje tiene `experiencia: true`.

```json
"hotspots": [
  {
    "id": "cuernos",
    "x": 50, "y": 12,                         // % sobre imagenPortada (origen arriba-izquierda)
    "titulo": "Los 12 cuernos",
    "cuerpo": "Significado del elemento (1–3 frases).",
    "material": "Cuernos dorados con cintas",  // opcional → fila "Material"
    "artesano": "Quién lo fabrica / dato"      // opcional → fila "Quién lo hace"
  }
]
```

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

### i18n — claves del namespace `anatomia` (Fase 4)

```json
"anatomia": {
  "eyebrow": "Anatomía del personaje",
  "titulo": "Cada pieza cuenta algo",
  "hint": "Desplázate para recorrer cada elemento del traje.",
  "contador": "Elemento {n} de {total}",
  "material": "Material",
  "artesano": "Quién lo hace"
}
```

> ⚠ Las cadenas kichwa de `anatomia` también son **tentativas** — revisar con hablante nativo.

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
- Frontend: todas las páginas con estilos completos (landing, personajes, detalle, pases, calendario, sobre, mapa)
- i18n es/en con rutas localizadas (el idioma quichua `qu` se retiró — 2026-07-03)
- Datos estáticos: 4 personajes publicados (con `narrativa`, `hotspots`, `imagenBanner`, `multimedia`), 14 pases
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
- **Experiencia v2 — Fase 4 "Anatomía"** (`AnatomiaSection.tsx`, 2026-06-23):
  - Diagrama interactivo: visual sticky (imán) con pines numerados sobre el `imagenPortada`; cada elemento
    del traje se activa **en secuencia al scroll** (IntersectionObserver, robusto en iOS — no scroll-linked)
  - Card por elemento con significado + `material` + `artesano` (campos nuevos opcionales en `Hotspot`)
  - Pines clicables (saltan a su bloque); mini-nav de elementos; respeta `prefers-reduced-motion` y ambos temas
  - Datos: `hotspots[]` en `personajes.json` (aya-uma 4, payaso 3, perro 3, diablos-de-lata 4), coords
    calibradas a la figura del imán y textos derivados de la narrativa/descripción ya autorizada
  - Gate: `experiencia && hotspots?.length && imagenPortada`; se inserta entre Historia y Galería
- **Desbloqueo de imanes + colección sincronizada** (PR #25/#26, desplegado 2026-06-28):
  - Código de 6 caracteres bajo la tarjeta → canje atómico vía Supabase (RPC `redeem_code`) → colección por
    cuenta (magic-link). La URL del QR no cambia, pero la ficha es gated desde 2026-06-29 (redirect a
    `/desbloquear/[slug]` si no está en la colección). Ver decisión técnica abajo.
  - Páginas `/desbloquear` y `/mis-personajes` (progreso + logros derivados); pestaña condicional en el nav.
  - Ficha gated: experiencia inmersiva = premio del desbloqueo (`HeroGated`/`AnatomiaGated`).
  - **En producción:** schema aplicado, lote-1 sembrado, envs en Railway, redirect en Supabase Auth configurado.
  - Cadenas kichwa de namespaces `desbloquear`/`coleccion`/`logros` **tentativas** — revisar con hablante nativo.
- **CI arreglado** (2026-06-28): conflicto de versión pnpm resuelto + `.eslintrc.json` añadido al web app +
  lint/type-check acotado a `@seres-del-pase/web` (la API NestJS no tiene config ESLint).
- **Navbar rediseñado** (2026-06-29):
  - Banderas de idioma: 🇪🇸 ES / 🇪🇨 QU / 🇺🇸 EN; mobile solo flag en botón compacto, popover con flag + label
  - Glosario eliminado del navbar (accesible por footer); Personajes siempre visible
  - Scroll to top instantáneo al navegar por cualquier link del navbar
- **Grid `/personajes` con gating** (2026-06-29):
  - `PersonajesGrid.tsx` componente cliente; cards muestran candado + botón a `/desbloquear` si no desbloqueado
  - Sin `FadeUp` en la grilla (causaba flash negro en mobile por hydration con `opacity:0`)
  - `unlocked = !gatingActive || !ready || coleccion.has(slug)` — sin Supabase todos accesibles
- **Stories mode mobile — sección "Un pase, un camino"** (2026-06-29):
  - Mapa fijo 45dvh en la parte superior; imagen rotativa + texto del waypoint en la parte inferior
  - Barra de navegación con flechas ‹ › visibles + puntos clicables; swipe horizontal también funciona
  - Progress bars al borde inferior del mapa; `easeTo` al waypoint activo, `fitBounds` en inicio/finale
  - `attributionControl: false` — oculta el card "CARTO / OpenStreetMap" del mapa
  - Link "Ver ficha" de waypoints → `/personajes` (catálogo)
- **CalendarioGrid rediseñado** (2026-06-29):
  - Grid 2 columnas (era 1); lightbox al clic en cards con foto (zoom nativo touch-action: pinch-zoom)
  - `PaseCard`: imagen `aspect-[4/3]`, badge tipo sobre imagen, ícono zoom hover, metadatos compactos
- **Landing — CTAs intercambiados** (2026-06-29):
  - Hero: "Escanea tu QR" abre `QrScanner` (lazy); `MagneticButton` acepta `onClick` además de `href`
  - `CtaFinal`: "Conoce el proyecto" → `/sobre`
- **ProductoSection — "Cómo funciona" mobile** (2026-06-29):
  - Reemplaza carrusel táctil por pasos apilados verticalmente con `whileInView` al hacer scroll
  - Visual + número grande + título + texto; separador dorado entre pasos; desktop sin cambios
- **Auditoría v3 — Fases 0/1/2 del plan** (`docs/PLAN-V3.md`, 2026-07-01):
  - **Fase 0 (bugs):** `metadataBase` ahora sale de `NEXT_PUBLIC_SITE_URL` (`lib/site-url.ts`) con fallback
    al dominio de Railway — arregla previews de WhatsApp que apuntaban a `seres-del-pase.ec`; `pases.json`
    cruza con personajes por `personajeSlug` (el nombre queda solo como display — arregla huérfanos Rey
    Moro/Curiquingue); `GatedPageRedirect` redirige a `/desbloquear/[slug]` (conserva el personaje del QR);
    `*.tsbuildinfo` al gitignore; videos sin uso borrados de `public/pases-videos/`
  - **Fase 1 (performance móvil):** optimización de imágenes de Next **activada** (se quitó
    `images.unoptimized` — WebP + srcset; sharp viene integrado en `next start` desde Next 15);
    video del hero comprimido 11.9 MB → 4.4 MB (960×540, CRF 32, sin audio)
  - **Fase 2 (SEO):** `app/sitemap.ts` (páginas públicas × 3 locales con hreflang), `app/robots.ts`
    (disallow /mis-personajes), `app/manifest.ts` (PWA básica); canonical + hreflang por página vía
    `localeAlternates()` (`lib/seo.ts`) en todas las páginas públicas incluida la ficha

### 🔄 Siguiente
- Añadir `imagenBanner` y fotos a los 5 personajes sin imagen (Curiquingue, Sacha Runa, Rey Moro, Capitán, Ángel)
- Fotografías reales "En el pase" (`titulo: "en-pase"`) y del imán físico (`titulo: "proceso"`) para la galería
- **Audios reales** del hero v2 en `public/audio/` (4 archivos: `[slug]-ambiente.mp3` por personaje con `experiencia: true`)
- **Revisar kichwa** de namespaces `desbloquear`/`coleccion`/`logros`/`experiencia`/`anatomia` con hablante nativo
- **Recorrido — datos reales** de Mercado Santa Rosa y Niño Rey de la Paz: coords ancla exactas, personajes que
  desfilan, fotos propias. Tras editar coords en `recorrido.json`: `node scripts/build-route.mjs`
- Añadir los demás pases de `pases.json` al recorrido (hoy 3 de ~10)
- **Experiencia v2** — Fases 2, 3, 5-12 del plan de 12 fases (Fases 1 y 4 ya implementadas)

### ⏳ Fase 2
- Modo claro/oscuro — el toggle se implementó (commit `58c591e`) pero hoy **no está en el Header**;
  el sitio corre solo en oscuro (`html.dark` fijo en layout). Reintroducirlo es opcional.
- Página de detalle de pase (`/pases/[slug]`)

### ⏳ Fase 3
- Hotspots interactivos en el traje ✅ (implementados como `AnatomiaSection.tsx` — Fase 4 v2, 2026-06-23)
- Mapa interactivo (MapLibre — dependencia ya instalada)

### ❌ Descartado
- **Búsqueda semántica** (pgvector + Supabase + NestJS) — funcionalidad cancelada (2026-06-21).
  Se eliminó la página/ruta `/buscar` y su botón del navbar. Ver decisión abajo.

---

## Decisiones técnicas clave

### Desbloqueo de imanes + colección sincronizada (desplegado 2026-06-28)
Convierte la compra física en una experiencia que **sube de nivel**: cada tarjeta trae un **código de 6
caracteres** impreso debajo; al canjearlo, el personaje entra a la **colección sincronizada por cuenta** del
usuario y su ficha desbloquea la experiencia inmersiva. Branch: `feature/desbloqueo-coleccion-imanes`.
- **La URL del QR no cambia** (`/[locale]/personajes/[slug]` — contrato de URL intacto), pero desde
  2026-06-29 **la ficha es gated** (decisión del autor, ratificada 2026-07-01): el visitante sin el
  personaje en su colección es redirigido client-side a `/desbloquear/[slug]` (`GatedPageRedirect`),
  que conserva el contexto del personaje escaneado. La **única llave de desbloqueo es el código de 6
  caracteres** (vía accesible: se escribe a mano, sin cámara).
  ⚠ Limitación conocida: el gating es client-side sobre HTML SSG — el contenido narrativo viaja en el
  HTML (view-source lo revela) y hay un flash breve de la ficha antes del redirect. Si se quiere un
  teaser real, hay que partir la ficha en secciones client gated (pendiente, ver docs/PLAN-V3.md A5).
- **⚠ Enciende Supabase en producción** (auth + colección). Se aparta del principio "todo estático / sin
  backend"; es el costo de la sincronización entre dispositivos (decisión explícita del autor). El sitio
  **sigue siendo SSG**: Supabase solo entra en runtime para auth y colección; el contenido sigue en JSON.
- **Backend** (`supabase/schema.sql`, aplicar a mano en el proyecto Supabase):
  - `unlock_codes` (catálogo de códigos; **sin policies RLS de lectura** → nunca se exponen al cliente).
  - `user_unlocks` (colección por usuario; RLS: cada quien lee solo la suya).
  - RPC `redeem_code(p_code, p_expected_slug default null)` `SECURITY DEFINER` → canje atómico (un solo
    `UPDATE ... WHERE redeemed_by IS NULL`); devuelve status tipado: `ok` / `invalid` / `wrong_character` /
    `already_yours` / `already_redeemed_by_other` / `not_authenticated`. **Toda validación es server-side.**
    ⚠ **Validación por personaje (2026-07-04):** si `p_expected_slug` no es null y el código pertenece a
    OTRO personaje, devuelve `wrong_character` sin canjear (cada personaje solo acepta sus propios códigos).
    `check_code_valid(p_code, p_expected_slug default null)` acepta el mismo parámetro opcional. La firma
    de ambas RPC cambió → el schema hace `drop function` de las versiones de 1 argumento antes de recrear.
    **Re-aplicar `supabase/schema.sql` a mano tras este cambio.** Backward-compatible: `/desbloquear`
    genérico (sin slug) pasa null y canjea el personaje que traiga el código.
- **Siembra de códigos:** `scripts/seed-codes.mjs` genera códigos únicos de 6 caracteres (alfabeto sin
  ambiguos: sin `I/L/O/0/1`) por personaje e imprime un CSV `code,personaje_slug` para imprenta. Resuelve
  `@supabase/supabase-js` vía `createRequire` anclado a `apps/web` (la dep no está en la raíz del workspace).
  `node --env-file=.env.local scripts/seed-codes.mjs --count 20 --batch lote-1 > codes.csv` (`--dry-run` para
  solo el CSV, sin tocar la DB).
- **Cliente/estado:** `lib/supabase/client.ts` (degrada a `supabase=null` si faltan envs) +
  `components/auth/ColeccionProvider.tsx` (`useColeccion()`, `useDesbloqueo(slug)`), montado en `layout.tsx`
  dentro de `NextIntlClientProvider`. Cache en `localStorage` (`nunna:coleccion`) para hidratar sin parpadeo.
  Auth: **magic-link** por email (`signInWithOtp`), sin contraseñas. El código viaja de dos formas
  redundantes hacia el regreso del enlace: (1) en la propia URL del `emailRedirectTo` como
  `?unlock_code=` — sobrevive aunque el correo se abra en **otro navegador o dispositivo** — y (2) en
  `localStorage` (`nunna:pending_code`) como respaldo same-device. El **formulario**
  (`DesbloquearForm.tsx`) prioriza el query param sobre localStorage y lo canjea al volver del enlace
  (no el provider, para mostrar el resultado). Supabase solo limpia el `#hash` de tokens al procesar el
  magic-link (flujo implicit, confirmado en `auth-js`), nunca el query string, así que `?unlock_code=`
  llega intacto. ⚠ **Fix 2026-07-03**: antes el código *solo* vivía en localStorage — si la persona
  llenaba el formulario en un dispositivo y abría el correo en otro (frecuente), el auto-canje nunca
  disparaba y quedaba varada en el paso 1 (pantalla de código) sin ningún mensaje de error. Ver tests
  `signInWithEmail` en `ColeccionProvider.test.tsx`.
  ⚠ **Fix 2026-07-04 (redirección + robustez):** en un canje exitoso (`ok`/`already_yours`) el formulario
  **redirige directo a `/personajes/[slug]`** (`router.replace`) en vez de mostrar una pantalla de éxito
  estática — el usuario aterriza en la ficha inmersiva tras el enlace. `redeemCode` ya añadió el slug a la
  colección local, así que `GatedPageRedirect` no rebota. Las pantallas `success`/`already_yours` quedan
  solo como fallback (canje sin slug, no debería ocurrir). Además el auto-canje **reintenta** ante un
  `not_authenticated` transitorio (ventana breve tras el clic donde la sesión existe pero `getUser()` aún
  no valida el JWT nuevo) en vez de caer a la fase "email" mostrando el código.
- **Gating de la ficha (degradación segura):** `HeroGated` y `AnatomiaGated` reemplazan a
  `HeroDespertar`/`AnatomiaSection` directos. Lógica vía `useDesbloqueo(slug)`:
  - Sin `experiencia` → `ParallaxHero` (igual que siempre).
  - **Si Supabase no está configurado** (`gatingActive=false`) → muestra la experiencia inmersiva como hoy
    (no rompe nada en builds sin envs). **En Railway hay que poner las envs o el gating queda apagado.**
  - `experiencia` + desbloqueado → `HeroDespertar` + `AnatomiaSection`.
  - `experiencia` + bloqueado → `ParallaxHero` (teaser) + CTA a `/desbloquear`; Anatomía oculta (no duplica CTA).
  - **SSR-safe:** hasta `resolved` (mounted && ready) se renderiza el teaser, igual en server y primer paint
    del cliente → sin mismatch de hidratación.
- **Rutas nuevas** (`i18n/routing.ts`): `/desbloquear` y `/mis-personajes` (qu **tentativo**). La pestaña
  "Mis personajes" en el `Header` aparece **condicional** cuando `coleccion.size > 0` (mantiene 1 fila).
- **Logros derivados, no almacenados:** `/mis-personajes` calcula insignias cruzando la colección con el
  campo `origen` de `personajes.json` (completar un origen, juntar los 9). Progreso con barra.
- **i18n:** namespaces nuevos `desbloquear` / `coleccion` / `logros` + `nav.mis_personajes` en es/qu/en
  (kichwa **tentativo**, revisar con hablante nativo).
- **Despliegue completado (2026-06-28):** schema SQL aplicado en Supabase, lote-1 de códigos sembrado,
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas en Railway, URL de producción
  (`https://nunnaec-production.up.railway.app/**`) permitida como redirect del magic-link en Supabase Auth.

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

### Quichua (locale `qu`) y glosario retirados ⚠ (2026-07-03)
En el marco del giro a escala nacional (ver `docs/PLAN-ESCALA-ECUADOR.md`), se retiró el **idioma
quichua como opción de UI** y la **feature de glosario** por completo.
- **i18n queda en `es` (default) + `en`.** `routing.ts` ya no lista `qu`; se borró `messages/qu.json`.
  El selector del `Header` muestra solo ES 🇪🇨 / EN 🇺🇸 (la bandera de ES pasó a la de Ecuador, coherente
  con el alcance nacional).
- **Glosario eliminado entero:** ruta `/glosario` (+ `/glossary`), `app/[locale]/glosario/`,
  `modules/glosario/`, `lib/services/glosario.service.ts`, `lib/data/glosario.json`, el export
  `getGlosario` del barrel, el link del footer, y la clave `nav.glosario`. `validate-data.mjs` y el
  healthcheck ya no lo referencian.
- **Redirect de compatibilidad:** `next.config.ts` manda cualquier `/qu/*` remanente a `/es` (308).
  Los imanes impresos codifican `/es/`, así que **ningún QR queda afectado** (contrato intacto).
- **No reintroducir** el locale `qu` ni el glosario sin una decisión explícita. Los **nombres kichwa
  de los personajes (`nombreKichwa`) se conservan** — son contenido, no la UI retirada (ver Ética).
- ⚠ Deuda: varios cambios históricos abajo mencionan `qu`/glosario como parte del estado de su fecha;
  se dejan como registro. El estado **actual** es el de esta decisión.

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
| payaso | Payaso | mixto | ✅ | ✅ | ✅ | ✅ |
| perro | Perro | prehispanico | ✅ | ✅ | ✅ | ✅ |
| diablos-de-lata | Diablos de lata | mestizo | ✅ | ✅ | ✅ | ✅ |

> **Retirados hasta tener imágenes** (2026-06-29): Curiquingue, Sacha Runa, Rey Moro, Capitán y Ángel
> se sacaron de `personajes.json` (su narrativa está en el historial de git). El grid muestra sus cards
> "próximamente" (`PersonajeCardProximo`, lista `PROXIMOS` en `personajes/page.tsx`). Al reincorporarlos,
> reutilizar los **mismos slugs** (contrato QR) y devolverles su `personajeSlug` en `pases.json`.

> **Experiencia v2** = flag `experiencia: true` en el JSON → usa `HeroDespertar` (Fase 1) + `AnatomiaSection`
> (Fase 4, si tiene `hotspots[]`). Requiere imágenes completas; los 4 activos coinciden con los que tienen
> retrato + banner. Audio del hero en `public/audio/`. Hotspots: aya-uma 4, payaso 3, perro 3, diablos 4.

Para agregar un personaje: editar `apps/web/lib/data/personajes.json` con la estructura existente.
Para agregar imágenes: copiar a `public/personajes/` y actualizar `imagenPortada` / `imagenBanner` / `multimedia` en el JSON.

---

## Ética y contenido

- **Nombre originario primero** (en el CONTENIDO, no en la UI): "Aya Uma" antes que "Diablo Huma".
  Aplica a los nombres de los personajes (`nombreKichwa` y equivalentes de cada lengua/región del
  Ecuador). Nota: el idioma quichua como **opción de UI** (locale `qu`) y el glosario kichwa se
  retiraron (2026-07-03, ver decisión abajo) — eso no afecta este principio de contenido.
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

# Desbloqueo de imanes — sembrar códigos de 6 caracteres en Supabase (genera CSV para imprenta).
# Requiere SUPABASE_SERVICE_ROLE_KEY. --dry-run = solo CSV, sin tocar la DB.
node --env-file=.env.local scripts/seed-codes.mjs --count 20 --batch lote-1 > codes.csv

# Integridad de datos — referencias huérfanas entre personajes.json/pases.json/recorrido.json.
# Corre automáticamente antes de `pnpm build` y en CI; puede invocarse suelto:
pnpm validate-data

# Tests unitarios (servicios de lib/data + flujo de canje mockeando Supabase)
pnpm --filter @seres-del-pase/web test
```
