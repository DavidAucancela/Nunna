# Seres del Pase — Plan Maestro del Proyecto

> Catálogo digital + experiencia inmersiva sobre los personajes tradicionales de los pases riobambeños (Diablo Huma, Curiquingue, Sacha Runa, Payasos, Perros, Diablos y más).

**Autor:** Jonathan David Aucancela Maguana
**Versión:** 1.0 — Mayo 2026
**Tipo de proyecto:** Catálogo cultural público + storytelling inmersivo (Opción A + D)

---

## 1. Visión y alcance

### 1.1 Qué es

Una plataforma web pública que documenta, explica y celebra los personajes (seres) de los pases tradicionales de Riobamba y la provincia de Chimborazo. Combina rigor de enciclopedia con narrativa visual de un reportaje de National Geographic o Pudding.cool.

### 1.2 Qué NO es (importante delimitarlo)

- No es una red social ni una wiki abierta a edición pública en V1.
- No es un sitio meramente turístico — el valor está en la profundidad cultural.
- No es un dashboard administrativo, aunque tenga un admin interno.
- No es solo HTML estático: es un sistema con backend, base de datos y CMS real.

### 1.3 Objetivos

1. **Cultural:** Preservar y difundir el conocimiento sobre los personajes del pase con rigor académico y respeto a la cosmovisión andina.
2. **Educativo:** Servir como recurso para estudiantes, docentes, investigadores y turistas culturales.
3. **Técnico:** Portafolio de altísima calidad que demuestre dominio de Next.js, NestJS, PostgreSQL, pgvector, diseño UX/UI y storytelling digital.
4. **Estratégico:** Abrir puertas a colaboraciones con la Casa de la Cultura Núcleo Chimborazo, GAD Municipal de Riobamba, ESPOCH y eventualmente plantear una tesis de maestría o publicación.

### 1.4 Público objetivo

| Segmento | Qué necesita | Prioridad |
|----------|--------------|-----------|
| Estudiantes y docentes ecuatorianos | Contenido confiable y citable | Alta |
| Comunidad kichwa y portadores de tradición | Representación respetuosa, kichwa visible | Alta |
| Turistas culturales (nacionales/internacionales) | Calendario, lugares, contexto | Media |
| Investigadores y antropólogos | Fuentes, referencias, datos descargables | Media |
| Diáspora ecuatoriana | Conexión emocional, audio/video | Media |

---

## 2. Arquitectura técnica

### 2.1 Stack final

**Frontend**
- Next.js 15.1 (App Router) + TypeScript estricto ✅
- Tailwind CSS **v3** (no v4 — incompatible con el monorepo) ✅
- Framer Motion (animaciones narrativas) — Fase 3
- Lenis (smooth scroll) — Fase 3
- next-intl v3 (es/qu/en) ✅
- MapLibre GL JS (mapas) — Fase 3

**Backend / Datos**
- PostgreSQL 16 vía Supabase ✅
- pgvector — Fase 3
- Directus en Railway (CMS headless) ✅ desplegado
- NestJS — esqueleto listo, deploy en Fase 3

**Media**
- Supabase Storage para imágenes y audios
- next/image + Sharp para optimización automática ✅

**Infraestructura (decisión final)**
- **Railway: frontend + Directus** — todo centralizado ✅
- Supabase: solo base de datos ✅
- GitHub Actions: CI ✅

> ⚠️ **Decisión tomada:** Todo en Railway, no Vercel. Ver `docs/IMPLEMENTACION.md`.

### 2.2 Por qué Directus en lugar de admin propio

Tu tiempo es finito. Construir un admin con CRUD, roles, permisos, subida de archivos y validación toma semanas. Directus te da todo eso en horas y se conecta directamente sobre tu Postgres existente (no impone schema propio). Cuando madures el proyecto, puedes migrar a admin custom si lo necesitas.

### 2.3 Diagrama de arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                         USUARIO FINAL                         │
└──────────────┬─────────────────────────┬─────────────────────┘
               │                         │
        Web (mobile/desktop)         API pública (V2)
               │                         │
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│     Next.js 15 (Railway)  │  │   NestJS API (Railway)   │
│  - SSG personajes         │  │   - Búsqueda semántica   │
│  - ISR pases              │  │   - Endpoints públicos   │
│  - Storytelling           │  │   - Webhooks Directus    │
└──────────────┬────────────┘  └──────────────┬───────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
            ┌─────────────────────────────────┐
            │     Directus (Railway)          │
            │  - Admin panel                  │
            │  - Auth + permisos              │
            │  - Webhooks                     │
            └─────────────────┬───────────────┘
                              ▼
            ┌─────────────────────────────────┐
            │   PostgreSQL + pgvector         │
            │   (Supabase)                    │
            └─────────────────┬───────────────┘
                              ▼
            ┌─────────────────────────────────┐
            │   Supabase Storage              │
            │   (imágenes, audios)            │
            └─────────────────────────────────┘
```

---

## 3. Modelo de datos

Diseñado pensando en flexibilidad cultural (un personaje no es lo mismo en Cacha que en Licto) y rigor académico (cada afirmación tiene fuente).

### 3.1 Entidades principales

```prisma
// schema.prisma — referencial, adaptable a Directus también

model Personaje {
  id              String   @id @default(cuid())
  slug            String   @unique               // diablo-huma
  nombre          String                          // "Diablo Huma"
  nombreKichwa    String?                         // "Aya Uma"
  nombresAlt      String[]                        // ["Diabluma", "Aya Huma"]
  resumen         String   @db.Text               // 1-2 párrafos
  descripcion     String   @db.Text               // descripción larga
  simbolismo      String?  @db.Text
  origen          String?  @db.Text               // prehispánico, colonial, mestizo
  embedding       Unsupported("vector(1536)")?    // para búsqueda semántica

  variantes       VariantePersonaje[]
  elementos       PersonajeElemento[]
  apariciones     PasePersonaje[]
  multimedia      Media[]                         // polimórfico vía MediaRelacion
  testimonios     Testimonio[]
  tags            PersonajeTag[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  publicadoEn     DateTime?
}

model VariantePersonaje {
  id              String   @id @default(cuid())
  personajeId     String
  personaje       Personaje @relation(fields: [personajeId], references: [id])
  nombre          String                          // "Diablo Huma de Cacha"
  region          String                          // "Cacha, Chimborazo"
  diferencias     String   @db.Text
  ubicacionId     String?
  ubicacion       Ubicacion? @relation(fields: [ubicacionId], references: [id])
}

model ElementoTraje {
  id              String   @id @default(cuid())
  slug            String   @unique
  nombre          String                          // "Máscara de Aya Uma"
  nombreKichwa    String?
  descripcion     String   @db.Text
  material        String?                         // cuero, lana, plumas
  significado     String?  @db.Text
  personajes      PersonajeElemento[]
  multimedia      Media[]
}

model PersonajeElemento {
  personajeId     String
  elementoId      String
  obligatorio     Boolean  @default(true)         // hay elementos opcionales
  notas           String?
  personaje       Personaje @relation(fields: [personajeId], references: [id])
  elemento        ElementoTraje @relation(fields: [elementoId], references: [id])
  @@id([personajeId, elementoId])
}

model Pase {
  id              String   @id @default(cuid())
  slug            String   @unique
  nombre          String                          // "Pase del Niño Rey de Reyes"
  fechaTipo       String                          // "fija" | "movil"
  fechaDescripcion String                         // "6 de enero" | "Corpus Christi"
  mes             Int?                            // para ordenar calendario
  dia             Int?
  resumen         String   @db.Text
  historia        String   @db.Text
  ubicacionId     String?
  ubicacion       Ubicacion? @relation(fields: [ubicacionId], references: [id])
  personajes      PasePersonaje[]
  multimedia      Media[]
  testimonios     Testimonio[]
}

model PasePersonaje {
  paseId          String
  personajeId     String
  rol             String?                         // "principal" | "acompañante"
  notas           String?
  pase            Pase @relation(fields: [paseId], references: [id])
  personaje       Personaje @relation(fields: [personajeId], references: [id])
  @@id([paseId, personajeId])
}

model Ubicacion {
  id              String   @id @default(cuid())
  nombre          String                          // "Cacha"
  parroquia       String?
  canton          String?  @default("Riobamba")
  provincia       String?  @default("Chimborazo")
  pais            String?  @default("Ecuador")
  latitud         Float
  longitud        Float
  descripcion     String?  @db.Text
  pases           Pase[]
  variantes       VariantePersonaje[]
}

model Media {
  id              String   @id @default(cuid())
  tipo            String                          // "imagen" | "audio" | "video"
  url             String
  urlThumb        String?
  titulo          String?
  descripcion     String?
  altText         String                          // OBLIGATORIO, accesibilidad
  autor           String?                         // créditos del fotógrafo/audio
  licencia        String?                         // "CC BY-NC-SA 4.0"
  fecha           DateTime?
  ubicacionId     String?
  // relaciones polimórficas vía tabla MediaRelacion
  relaciones      MediaRelacion[]
}

model MediaRelacion {
  mediaId         String
  entidadTipo     String                          // "personaje" | "pase" | "elemento"
  entidadId       String
  orden           Int      @default(0)            // para galerías ordenadas
  media           Media @relation(fields: [mediaId], references: [id])
  @@id([mediaId, entidadTipo, entidadId])
}

model Testimonio {
  id              String   @id @default(cuid())
  texto           String   @db.Text
  autor           String                          // "Sr. Manuel Yumi, prioste 2018"
  cargo           String?
  fecha           DateTime?
  fuente          String?                         // libro, entrevista, video
  url             String?                         // si es online
  citaBibliografica String? @db.Text              // formato APA o similar
  personajeId     String?
  paseId          String?
  personaje       Personaje? @relation(fields: [personajeId], references: [id])
  pase            Pase? @relation(fields: [paseId], references: [id])
}

model Tag {
  id              String   @id @default(cuid())
  slug            String   @unique
  nombre          String                          // "cosmovisión andina"
  descripcion     String?
  personajes      PersonajeTag[]
}

model PersonajeTag {
  personajeId     String
  tagId           String
  personaje       Personaje @relation(fields: [personajeId], references: [id])
  tag             Tag @relation(fields: [tagId], references: [id])
  @@id([personajeId, tagId])
}

model GlosarioKichwa {
  id              String   @id @default(cuid())
  palabra         String   @unique               // "aya"
  traduccion      String                          // "espíritu, alma"
  pronunciacion   String?                         // IPA
  contexto        String?  @db.Text
  ejemplos        String[]
}

model Usuario {
  id              String   @id @default(cuid())
  email           String   @unique
  nombre          String
  rol             String   @default("lector")    // admin | editor | lector
  // Directus maneja auth, este modelo es de referencia
}
```

### 3.2 Decisiones clave del modelo

- **Personaje vs Variante:** El Diablo Huma como concepto vive en `Personaje`; sus formas locales (Cacha, Licto, Calpi) en `VariantePersonaje`. Evita duplicar y permite comparar.
- **Multimedia polimórfica:** Una foto puede pertenecer a un personaje, un pase o un elemento del traje. `MediaRelacion` resuelve esto sin tablas duplicadas.
- **Testimonios separados:** Cada afirmación cultural fuerte debe poder citarse. Esto te diferencia de Wikipedia mal hecha.
- **Embedding vectorial en Personaje:** Para búsqueda semántica tipo "personajes asociados al carnaval andino" o "máscaras con cuernos".
- **`altText` obligatorio:** Accesibilidad + SEO.

---

## 4. Estructura del repositorio (monorepo)

```
seres-del-pase/
├── apps/
│   ├── web/                  # Next.js 15 — sitio público
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (marketing)/
│   │   │   │   │   ├── page.tsx              # Landing
│   │   │   │   │   └── sobre/page.tsx        # Acerca del proyecto
│   │   │   │   ├── personajes/
│   │   │   │   │   ├── page.tsx              # Listado
│   │   │   │   │   └── [slug]/page.tsx       # Detalle (SSG)
│   │   │   │   ├── pases/
│   │   │   │   ├── elementos/
│   │   │   │   ├── mapa/
│   │   │   │   ├── calendario/
│   │   │   │   ├── glosario/
│   │   │   │   └── buscar/
│   │   ├── components/
│   │   ├── lib/              # cliente Directus, utils
│   │   └── styles/
│   └── api/                  # NestJS — solo endpoints custom
│       └── src/
│           ├── busqueda/     # semántica con pgvector
│           └── webhooks/     # invalida cache cuando Directus actualiza
├── packages/
│   ├── ui/                   # componentes compartidos (shadcn-based)
│   ├── types/                # tipos TypeScript del schema
│   └── config/               # eslint, tsconfig, tailwind base
├── directus/                 # configuración Directus (extensions, snapshots)
├── docs/
│   ├── arquitectura.md
│   ├── contenido-guia.md
│   └── decisiones/           # ADRs (Architecture Decision Records)
├── .github/workflows/
├── turbo.json
├── package.json
└── README.md
```

Gestor: **pnpm + Turborepo**. Más rápido que npm/yarn y mejor para monorepos.

---

## 5. Diseño y experiencia (la parte D)

### 5.1 Principios de diseño

1. **Editorial, no dashboard.** Inspiración: Pudding.cool, NYT interactive, Google Arts & Culture, sitios de documentales independientes.
2. **La foto manda.** Las máscaras y trajes son visualmente potentes. Foto a sangrado, tipografía limpia encima.
3. **Mobile-first real.** El 70%+ del tráfico será móvil. Diseña primero para 375px de ancho.
4. **Modo oscuro por defecto.** Los trajes y máscaras lucen brutales sobre fondo oscuro. Modo claro como opción.
5. **Pausado, no apurado.** Animaciones lentas, mucho aire, lectura tranquila. No es TikTok.

### 5.2 Sistema de diseño

**Paleta** (inspirada en textiles andinos sin caer en folclorismo)
```
--color-fondo-oscuro:   #0F0E0C   (casi negro, cálido)
--color-fondo-claro:    #F5F1EA   (crema textil)
--color-acento-rojo:    #B8312F   (rojo cochinilla)
--color-acento-dorado:  #C89B3C   (dorado andino)
--color-acento-jade:    #1F4D3F   (verde montaña)
--color-texto-oscuro:   #1A1A1A
--color-texto-claro:    #EFEAE0
--color-borde-sutil:    #2A2724
```

**Tipografía**
- Titulares: **Fraunces** (serif moderna con personalidad, opentype rica) o **PP Editorial New** (si tienes licencia)
- Cuerpo: **Inter** o **Geist** (limpia, multilingüe, soporta caracteres especiales kichwa)
- Kichwa cuando se cita: **misma tipografía cursiva o ligero contraste**, nunca en otra fuente que se vea "exótica"

**Escalas**
- Type scale: 1.250 (Major Third) para legibilidad densa
- Spacing: múltiplos de 4px
- Container max: 1280px, lectura 720px

### 5.3 Páginas clave y su tratamiento

**Landing**
- Hero: video o foto de pantalla completa de un Diablo Huma en movimiento, con título sobreimpreso.
- Scroll revela: introducción al proyecto, 4-6 personajes destacados en grid, llamado a explorar el calendario.
- CTA primario: "Conocer los seres" / CTA secundario: "Próximo pase en X días".

**Página de personaje** (la joya del sitio)
- Hero a pantalla completa con foto del personaje, nombre en kichwa + español.
- Scroll narrativo (parte D): historia desplegándose con animaciones, citas de testimonios apareciendo, fotos de variantes locales en paralaje.
- Sección "Elementos del traje" con hotspots interactivos sobre una imagen del personaje completo.
- Galería de variantes regionales con mapa lateral.
- Audio: pronunciación del nombre en kichwa + narración corta de la historia.
- Testimonios con foto y crédito.
- Personajes relacionados.
- Citas y referencias al pie (estilo académico).

**Mapa**
- MapLibre con fondo oscuro custom (no Google Maps default).
- Pins por ubicación, agrupados por pase.
- Click en pin → drawer lateral con info y enlaces.

**Calendario**
- Vista anual con pases distribuidos por mes.
- Click en pase → página del pase.
- Filtro por tipo (religioso, agrícola, mestizo).

**Buscador**
- Búsqueda híbrida: full-text + semántica con pgvector.
- Filtros: tipo de entidad, región, elementos.
- Atajos de teclado (⌘K) inspirados en Linear / Vercel.

### 5.4 Animaciones (con cabeza)

- Entrada de scroll: fades cortos (300ms), nada de bouncing.
- Paralaje sutil en imágenes de fondo.
- Hover de cards: leve scale (1.02) + cambio de sombra.
- Transiciones de página: fade simple, no overlays elaborados (rompen el flow editorial).
- **Regla:** Si una animación llama la atención sobre sí misma en lugar del contenido, sobra.

---

## 6. Plan de contenido

Esta es la parte que decide si el proyecto se respeta o no.

### 6.1 Personajes para MVP (10 personajes prioritarios)

Foco en el **Pase del Niño Rey de Reyes de Riobamba** (6 de enero) por ser el más emblemático del cantón. Sugerencia inicial — valida con fuentes locales:

1. **Aya Uma / Diablo Huma** — el central
2. **Curiquingue** — danzante con plumaje
3. **Sacha Runa** — hombre del bosque, musgo
4. **Payaso del pase** — distinto del payaso de circo
5. **Perro** — personaje guardián/cómico
6. **Diablo** — sincrético, colonial-andino
7. **Capariche** — barrendero ceremonial
8. **Yumbo** — danzante amazónico
9. **Caporal** — capataz, autoridad
10. **Pingullero / músico** — el sonido del pase

### 6.2 Pases / Festividades para V1

| Pase | Fecha | Lugar |
|------|-------|-------|
| Pase del Niño Rey de Reyes | 6 enero | Riobamba centro |
| Corpus Christi | Junio (móvil) | Pungalá, Licto |
| Inti Raymi | Junio | Cacha y comunidades |
| Pawkar Raymi | Marzo | Comunidades indígenas |
| Carnaval de Guaranda (referencia) | Febrero | Bolívar (vecino) |

### 6.3 Fuentes recomendadas (consultar y citar)

- **Casa de la Cultura Ecuatoriana, Núcleo Chimborazo** — archivo de pases y festividades.
- **Instituto Nacional de Patrimonio Cultural (INPC)** — inventario de patrimonio inmaterial.
- **Botero, Luis Fernando** — *Indios, tierra y cultura* y otros textos sobre Chimborazo.
- **Naranjo, Marcelo** — *La cultura popular en el Ecuador*, tomo Chimborazo.
- **Tesis de antropología de PUCE, UCE, FLACSO** sobre pases riobambeños.
- **Testimonios directos** de priostes, danzantes, artesanos mascareros (Cacha, San Juan, Licto).

### 6.4 Ética del contenido

- **Pide permiso para fotos de personas reales.** Si fotografiaste un pase, ten autorización o usa solo rostros cubiertos por máscara.
- **Crédito siempre.** Fotógrafo, comunidad, prioste.
- **Distingue cosmovisión andina de sincretismo colonial.** El Aya Uma prehispánico ≠ el "diablo" cristiano que le superpusieron. Explícalo, no lo aplanes.
- **Kichwa antes que la castellanización.** "Aya Uma" primero, "Diablo Huma" como nombre castellanizado, no al revés.
- **Sin folclorismo decorativo.** Nada de "los inditos coloridos". Tono respetuoso, académico-accesible.
- **Licencia del contenido propio:** Creative Commons BY-NC-SA 4.0 es razonable.

### 6.5 Plantilla de ficha (qué información mínima debe tener cada personaje)

```
- Nombre principal (con su forma kichwa si aplica)
- Nombres alternativos / regionales
- Resumen (2-3 oraciones)
- Origen e historia (prehispánico/colonial/mestizo, fuentes)
- Simbolismo y significado cultural
- Descripción del traje (con elementos enlazados)
- Variantes regionales documentadas
- Pases en que aparece
- Mínimo 3 fotos (frontal, detalle, en contexto de pase)
- 1 audio de pronunciación + 1 audio de narración corta
- Mínimo 2 testimonios con cita
- Mínimo 3 referencias bibliográficas
- Tags
```

---

## 7. Roadmap por fases

> Estado actualizado al 2026-05-25.

### ✅ Fase 0+1 — COMPLETADA

- [x] Monorepo Turborepo + pnpm
- [x] Schema Prisma v5 completo
- [x] Directus desplegado en Railway + conectado a Supabase
- [x] 13 colecciones creadas en Directus
- [x] 8 personajes con fichas completas (Aya Uma, Curiquingue, Sacha Runa, Payaso, Rey Moro, Capitán, Ángel, Perro)
- [x] Páginas: landing, listado personajes, detalle personaje, pases, glosario
- [x] i18n es/qu/en con rutas localizadas
- [x] Build de producción sin errores
- [x] Decisión de infraestructura: todo en Railway (no Vercel)

**Modelo de negocio definido:** llaveros 3D con QR → ficha del personaje

### 🔄 Fase 2 — Producto QR (en curso)

Prioridad redefinida por el modelo de negocio. El QR dirige a la ficha del personaje.

- [ ] **Deploy en Railway** — urgente, los llaveros están en producción
- [ ] Página de detalle del personaje optimizada para móvil (experiencia QR)
- [ ] Landing page orientada al concepto: "escanea el QR de tu llavero"
- [ ] Sección cross-sell al pie de cada personaje ("Conoce los otros seres")
- [ ] Imágenes de personajes en Directus
- [ ] OpenGraph rico para compartir en redes
- [ ] Modo claro/oscuro

### ⏳ Fase 3 — Storytelling inmersivo

- [ ] Scroll narrativo (Lenis + Framer Motion)
- [ ] Hotspots interactivos sobre imágenes del traje
- [ ] Búsqueda semántica con pgvector (requiere OPENAI_API_KEY)
- [ ] Audio de narraciones (pronunciación kichwa + historia)
- [ ] Mapa interactivo con MapLibre
- [ ] Calendario de festividades

### ⏳ Fase 4 — Comunidad y difusión

- [ ] API pública documentada (Swagger)
- [ ] Sección académica con PDFs descargables
- [ ] AR con WebXR — ver la máscara en tu cámara

---

## 8. SEO y descubrimiento

Este sitio puede dominar Google para búsquedas como "Diablo Huma significado", "Aya Uma", "Pase del Niño Rey de Reyes Riobamba" — hoy no hay buen contenido digital sobre esto.

**Checklist técnico**
- Static Site Generation (SSG) para todas las páginas de personajes y pases
- `<title>` y `<meta description>` únicos por página, optimizados con palabra clave
- Schema.org JSON-LD: `DefinedTerm`, `Event`, `Place`, `ImageObject`
- Sitemap XML con `<priority>` y `<lastmod>`
- OpenGraph + Twitter Cards con imagen específica por personaje
- Hreflang correcto para es/qu/en
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms (Next + buena optimización de imágenes te dejan ahí)

**Contenido**
- Una página = una intención de búsqueda
- Encabezados jerárquicos (H1 único, H2 secciones, H3 subsecciones)
- Alt text descriptivo en imágenes
- URLs limpias: `/es/personajes/aya-uma` no `/personajes?id=5`

---

## 9. Internacionalización y accesibilidad

**i18n**
- Estructura: `/es/...`, `/qu/...` (kichwa), `/en/...`
- `next-intl` con archivos JSON por idioma
- Traducción profesional o validada por hablante nativo de kichwa (no Google Translate)
- Selector visible en header

**Accesibilidad (WCAG 2.2 AA mínimo)**
- Contraste de color verificado (≥4.5:1 texto normal)
- Navegación completa por teclado
- `aria-label` en iconos
- `alt` descriptivo en todas las imágenes (no solo "imagen de…")
- Transcripciones de audios
- Subtítulos en videos
- `prefers-reduced-motion` respetado en animaciones
- Skip-to-content link

---

## 10. Seguridad y operación

- Auth de Directus protegido con 2FA en cuentas admin
- Variables de entorno nunca en repo (usa el secret manager de Railway)
- Backups automáticos de Supabase (Pro plan los incluye diarios) o script propio a S3 si te quedas en Free
- Rate limiting en API pública (Upstash Redis o middleware de NestJS)
- CSP headers configurados
- Política de privacidad y términos de uso (necesarios incluso sin recolectar datos personales sensibles)

---

## 11. Costos estimados (USD/mes)

| Servicio | Costo actual | Cuando crezca |
|----------|-------------|---------------|
| Railway (Directus + Next.js) | ~$10-15/mes Hobby | $20 Pro (sin cold starts) |
| Supabase (PostgreSQL) | ✅ Free (500MB DB) | $25 Pro |
| Dominio | — | ~$15/año |
| **Total actual** | **~$10-15/mes** | **~$40-60/mes** |

> Railway Hobby tiene cold starts (~8s sin tráfico). Si afecta la experiencia QR, pasar a Pro.

---

## 12. Consideraciones legales y éticas finales

1. **Derechos de imagen:** Consentimiento escrito o uso de imágenes con rostro cubierto/máscara.
2. **Patrimonio cultural inmaterial:** Aunque es de dominio público culturalmente, hay protocolos de respeto. Idealmente consulta con la comunidad portadora antes de publicar.
3. **Atribución de fotos:** Crédito obligatorio incluso para amigos/familiares que te cedan material.
4. **Licencia del sitio:** Código en MIT en GitHub público (suma a portafolio), contenido en CC BY-NC-SA 4.0.
5. **No comercializar imágenes de personas identificables** sin contrato.

---

## 13. Próximos pasos concretos (esta semana)

1. **Hoy/mañana:** Crear el repo `seres-del-pase` en GitHub privado. Abrir el board (GitHub Projects o Linear).
2. **Esta semana:** Empezar la investigación de contenido en Notion/Obsidian. Mínimo 3 personajes con su ficha completa.
3. **Próxima semana:** Wireframes en Figma de landing + detalle de personaje.
4. **Semana 3:** Setup monorepo + Directus en local + primera página estática con contenido real.

---

## 14. Métricas de éxito (a 6 meses)

- 10+ personajes documentados con calidad académica
- 3+ pases con calendario, ubicación y galería
- Lighthouse 95+ en todas las páginas
- Mencionado por al menos una institución cultural ecuatoriana
- 500+ visitantes orgánicos mensuales
- Top 3 en Google para "Aya Uma" y "Diablo Huma significado"
- Portafolio que abre conversaciones laborales serias

---

## Apéndice A — Stack alternativo más simple (si Directus te incomoda)

Si prefieres no introducir Directus:

- **CMS:** Sanity.io (generoso free tier, GROQ query language)
- **O Markdown + MDX:** Contenido en archivos `.mdx` dentro del repo, sin DB para contenido. Más control, menos UX para no-técnicos.
- **Si lo gestionas tú solo:** MDX es perfectamente válido y rapidísimo.

## Apéndice B — Decisiones que tendrás que tomar tú

1. ¿Vas solo o sumas a alguien (diseñador, fotógrafo, lingüista kichwa)?
2. ¿Buscas auspicio institucional desde el inicio o lo construyes solo y luego presentas?
3. ¿Repo público desde día 1 (transparencia) o privado hasta el lanzamiento?
4. ¿Open contributions de la comunidad o curaduría cerrada?

---

**Fin del plan v1.0.** Versiónalo en git como `docs/PLAN.md` y actualízalo cuando las decisiones cambien.
