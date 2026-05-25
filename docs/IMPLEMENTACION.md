# Guía de Implementación — Seres del Pase

Esta guía cubre **en qué orden construir el proyecto** y qué hacer exactamente en cada paso. Es complementaria al plan maestro (`PLAN.md`) y está pensada para ejecutarse sprint a sprint.

---

## Prerrequisitos técnicos

| Herramienta | Versión | Para qué |
|-------------|---------|----------|
| Node.js | ≥ 20 LTS | Runtime |
| pnpm | ≥ 9 | Gestor de paquetes del monorepo |
| Docker Desktop | latest | Directus en local |
| Git | ≥ 2.40 | Control de versiones |
| VS Code | latest | Editor recomendado |

**Extensiones de VS Code recomendadas:**
- ESLint, Prettier, Tailwind CSS IntelliSense, Prisma, GitLens

---

## Fase 0 — Preparación (antes de escribir código)

### 0.1 Crear cuenta en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Nombre: `seres-del-pase`, región: `South America (São Paulo)`
3. Copiar `Project URL` y `anon key` → pegar en `.env.local`
4. Copiar `service_role key` → pegar en `.env.local` (para NestJS)
5. En el SQL Editor, habilitar pgvector:
   ```sql
   create extension if not exists vector;
   ```

### 0.2 Crear cuenta en Railway (para Directus)

1. Ir a [railway.app](https://railway.app) → New project
2. Deploy a template → buscar "Directus"
3. Configurar variables de entorno de Directus:
   ```
   DB_CLIENT=pg
   DB_HOST=<host de Supabase Pooler>
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USER=postgres
   DB_PASSWORD=<password de Supabase>
   KEY=<string aleatorio 32+ chars>
   SECRET=<string aleatorio 32+ chars>
   ADMIN_EMAIL=tu@email.com
   ADMIN_PASSWORD=<password segura>
   ```
4. Abrir la URL de Directus → iniciar sesión con las credenciales de arriba

> **Alternativa local con Docker:**
> ```bash
> docker compose -f directus/docker-compose.yml up -d
> # Directus en http://localhost:8055
> ```

### 0.3 Configurar el schema en Directus

Una vez Directus esté corriendo, crear las colecciones que corresponden al schema Prisma:

**Colecciones a crear (en este orden por dependencias):**
1. `ubicaciones`
2. `tags`
3. `glosario_kichwa`
4. `media`
5. `personajes`
6. `variantes_personaje` (relación M2O con `personajes`)
7. `elementos_traje`
8. `pases`
9. `testimonios`
10. `personaje_elementos` (tabla pivote M2M)
11. `pase_personajes` (tabla pivote M2M)
12. `media_relaciones` (tabla pivote polimórfica)
13. `personaje_tags` (tabla pivote M2M)

**Para cada campo, configurar:**
- Tipo correcto (text, integer, datetime, etc.)
- Validación requerida donde aplique
- Interfaz apropiada (rich text para `descripcion`, image para media)

### 0.4 Instalar dependencias

```bash
pnpm install
```

---

## Fase 1 — MVP técnico (semanas 1–6)

### Sprint 1.1 — Base del frontend (semana 1)

**Objetivo:** Next.js corriendo, rutas básicas, componentes de layout.

```bash
# Verificar que todo funciona
pnpm dev
# Abrir http://localhost:3000/es → debe mostrar la landing
```

**Checklist:**
- [ ] Landing page (`/es`) muestra hero y grid de personajes placeholder
- [ ] Header con navegación funciona en móvil y desktop
- [ ] Fuente Fraunces carga correctamente
- [ ] Colores del design system aplicados (fondo oscuro, acento dorado)
- [ ] Skip-to-content link visible al presionar Tab

**Si algo falla:**
- Errores de módulos → `pnpm install` y reiniciar
- Error de `DIRECTUS_URL` → configura `.env.local` con valores placeholder por ahora

### Sprint 1.2 — Conexión a Directus (semana 2)

**Objetivo:** Datos reales fluyendo de Directus a Next.js.

1. Completar setup de Directus (sección 0.3)
2. Crear 2-3 personajes de prueba en Directus con contenido mínimo
3. Verificar que `lib/directus.ts` los devuelve:

```bash
# En apps/web, probar la query directamente:
node -e "
const { getPersonajes } = require('./lib/directus');
getPersonajes({}).then(console.log).catch(console.error);
"
```

4. La página `/es/personajes` debe mostrar los personajes creados

**Campos mínimos para un personaje de prueba en Directus:**
```
slug: aya-uma
nombre: Aya Uma
nombreKichwa: Aya Uma
resumen: El personaje central del pase, danzante de dos caras...
descripcion: [texto largo]
origen: prehispanico
publicadoEn: [fecha actual]
```

### Sprint 1.3 — Páginas de detalle (semana 3)

**Objetivo:** Página de personaje completa con SSG.

- [ ] `/es/personajes/aya-uma` muestra el detalle completo
- [ ] `generateStaticParams()` genera rutas en build
- [ ] Hero a pantalla completa con imagen (si hay foto)
- [ ] Testimonios con citas formateadas
- [ ] Tags en el pie
- [ ] Metadata OpenGraph correcta

**Añadir imagen de portada:**
1. En Directus, ir a Content → Personajes → Aya Uma
2. Subir imagen en el campo `multimedia` (tipo "imagen")
3. Rellenar `altText` obligatoriamente
4. `publicar` el ítem

### Sprint 1.4 — Pases y glosario (semana 4)

- [ ] Crear 2 pases en Directus con contenido mínimo
- [ ] `/es/pases` muestra pases agrupados por mes
- [ ] Crear 20 palabras en glosario kichwa
- [ ] `/es/glosario` muestra el glosario organizado por letra

### Sprint 1.5 — SEO y deploy (semanas 5–6)

**SEO técnico:**

```bash
# Crear archivo de sitemap
# apps/web/app/sitemap.ts
```

```typescript
import type { MetadataRoute } from "next";
import { getPersonajes, getPases } from "@/lib/directus";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const personajes = await getPersonajes({});
  const pases = await getPases({});

  const personajesUrls = personajes.flatMap((p) =>
    ["es", "en", "qu"].map((locale) => ({
      url: `https://seres-del-pase.ec/${locale}/personajes/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? Date.now()),
      priority: 0.9,
    }))
  );

  // ... pases, páginas estáticas

  return [...personajesUrls];
}
```

**Deploy a Vercel:**
1. Conectar repo a Vercel
2. Framework preset: Next.js
3. Root directory: `apps/web`
4. Configurar variables de entorno en dashboard de Vercel
5. Dominio → añadir en configuración

**Checklist de SEO:**
- [ ] `<title>` único en cada página
- [ ] `<meta description>` única con palabra clave principal
- [ ] `alt` en todas las imágenes
- [ ] JSON-LD en páginas de personaje
- [ ] `hreflang` en layout raíz
- [ ] Sitemap accesible en `/sitemap.xml`
- [ ] `robots.txt` configurado

---

## Fase 2 — Profundidad (semanas 7–10)

### Sprint 2.1 — Mapa interactivo

```bash
pnpm add maplibre-gl --filter @seres-del-pase/web
```

Crear `apps/web/app/[locale]/mapa/page.tsx` con:
- Componente client-only (MapLibre necesita el DOM)
- Fondo oscuro: usar estilo de MapTiler o Stadia Maps (gratuito para proyectos open)
- Pins por ubicación de pases y variantes regionales
- Drawer lateral al hacer click en un pin

> El componente de mapa debe ser `'use client'` y cargarse con `dynamic(() => import(...), { ssr: false })` para evitar errores de SSR.

### Sprint 2.2 — Búsqueda semántica con pgvector

1. Habilitar pgvector en Supabase (ya hecho en Fase 0)
2. En Prisma, el campo `embedding Unsupported("vector(1536)")` ya está definido
3. Generar embeddings al guardar contenido:

```bash
# Script para generar embeddings de personajes existentes
# apps/api/scripts/generate-embeddings.ts
```

```typescript
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI();

async function generateEmbeddings() {
  const personajes = await prisma.personaje.findMany({
    where: { embedding: null },
  });

  for (const p of personajes) {
    const texto = `${p.nombre}. ${p.resumen}. ${p.descripcion}`;
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texto,
    });
    const vector = response.data[0]?.embedding ?? [];

    await prisma.$executeRaw`
      UPDATE personajes 
      SET embedding = ${`[${vector.join(",")}]`}::vector
      WHERE id = ${p.id}
    `;
    console.log(`✓ Embedding generado para: ${p.nombre}`);
  }
}

generateEmbeddings();
```

4. La API de NestJS ya tiene `busquedaSemantica()` implementada en `BusquedaService`
5. Actualizar el buscador del frontend para consumir este endpoint

### Sprint 2.3 — Modo claro/oscuro

```bash
pnpm add next-themes --filter @seres-del-pase/web
```

Envolver el layout en `ThemeProvider` y añadir el toggle al Header.

### Sprint 2.4 — i18n completo

- [ ] Traducir todas las strings de `messages/es.json` a `en.json`
- [ ] Revisión de `qu.json` por hablante nativo de kichwa (crítico)
- [ ] Verificar que `hreflang` funciona con Google Search Console

---

## Fase 3 — Storytelling inmersivo (semanas 11–14)

### Sprint 3.1 — Scroll narrativo

Instalar y configurar Lenis para smooth scroll:

```bash
pnpm add lenis --filter @seres-del-pase/web
```

```typescript
// apps/web/components/providers/SmoothScrollProvider.tsx
"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
```

### Sprint 3.2 — Animaciones con Framer Motion

```typescript
// Ejemplo: entrada en scroll para secciones
"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function FadeInSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

**Regla de oro:** si notas la animación más que el contenido, quítala.

### Sprint 3.3 — Hotspots interactivos

Componente para el traje del personaje con puntos de información:

```typescript
// apps/web/components/personajes/TrajeHotspots.tsx
// Implementar con Framer Motion y posicionamiento relativo sobre imagen
```

---

## Accesibilidad — Checklist WCAG 2.2 AA

Verificar antes de cada release:

- [ ] Contraste de color ≥ 4.5:1 para texto normal (usar [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))
- [ ] Todos los elementos interactivos accesibles por teclado (Tab, Enter, Space)
- [ ] `aria-label` en botones con solo ícono
- [ ] `alt` descriptivo en todas las imágenes (no "imagen de…")
- [ ] Transcripciones disponibles para audios
- [ ] Subtítulos en videos
- [ ] `prefers-reduced-motion` respetado (ya en `globals.css`)
- [ ] Skip-to-content link funcional (ya en `layout.tsx`)
- [ ] Focus visible en todos los elementos interactivos
- [ ] Anuncios de navegación dinámica con `aria-live`

---

## Comandos útiles del día a día

```bash
# Desarrollo (todos los apps en paralelo)
pnpm dev

# Solo el frontend
pnpm dev --filter @seres-del-pase/web

# Solo la API
pnpm dev --filter @seres-del-pase/api

# Build completo (igual que CI)
pnpm build

# Type check sin build
pnpm type-check

# Lint
pnpm lint

# Migraciones de Prisma
cd apps/api
npx prisma migrate dev --name <nombre-de-la-migración>
npx prisma studio        # GUI para ver/editar datos

# Directus local (si usas Docker)
docker compose -f directus/docker-compose.yml up -d
docker compose -f directus/docker-compose.yml down
```

---

## Variables de entorno requeridas por app

### `apps/web` (Next.js)

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `DIRECTUS_URL` | URL de Directus (local o Railway) | Sí |
| `DIRECTUS_STATIC_TOKEN` | Token de acceso a Directus | Sí |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública de Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | Sí |
| `NEXT_REVALIDATE_TOKEN` | Token secreto para revalidación on-demand | Sí |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Dominio en Plausible Analytics | No |

### `apps/api` (NestJS)

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `API_DATABASE_URL` | PostgreSQL connection string (Supabase) | Sí |
| `API_PORT` | Puerto del servidor (default: 3001) | No |
| `OPENAI_API_KEY` | Para generar embeddings (Fase 2) | Fase 2 |
| `WEBHOOK_SECRET` | Secret para validar webhooks de Directus | Sí |
| `NEXT_REVALIDATE_URL` | URL del frontend para invalidar caché | Sí |
| `NEXT_REVALIDATE_TOKEN` | Token compartido con el frontend | Sí |

---

## Costos operativos

| Servicio | Tier inicial | Cuándo escalar |
|----------|-------------|----------------|
| Vercel | Free (Hobby) | Al superar 100GB bandwidth |
| Supabase | Free (500MB DB) | Al superar 500MB o necesitar backups diarios |
| Railway (Directus) | ~$5-10/mes | Siempre — no hay free tier real |
| Dominio .ec | ~$15/año | Desde el inicio |
| OpenAI (embeddings) | ~$0.02 / 1M tokens | Mínimo |
| **Total aprox.** | **$10-15/mes** | — |

---

## Contenido: ficha mínima por personaje

Antes de publicar un personaje en Directus:

```
✓ slug (kebab-case, sin tildes)
✓ nombre (castellano)
✓ nombreKichwa (si aplica)
✓ resumen (2-3 oraciones, ~150 palabras)
✓ descripcion (texto largo, ~500-800 palabras)
✓ origen (prehispanico / colonial / mestizo / mixto)
✓ mínimo 1 foto con altText
✓ mínimo 1 testimonio con cita bibliográfica
✓ mínimo 1 tag
✓ publicadoEn (fecha — si es null, no aparece en el sitio)
```

---

## Decisiones pendientes

Antes de avanzar en estas áreas, tomar la decisión correspondiente:

1. **¿Directus o Sanity?** La estructura actual usa Directus. Si prefieres Sanity, actualizar `apps/web/lib/directus.ts` con el cliente de Sanity y los GROQ queries equivalentes.

2. **¿MDX en lugar de CMS?** Si vas a gestionar el contenido tú solo y no necesitas UI de admin, puedes reemplazar todo el CMS con archivos `.mdx` en `apps/web/content/personajes/`. Más simple, menos infraestructura.

3. **¿Supabase Auth o Directus Auth?** Para el panel de admin solo hay un editor (tú), Directus Auth es suficiente. Si en el futuro quieres usuarios públicos, añadir Supabase Auth.

4. **¿Dominio `.ec`?** Recomendado para posicionamiento local. Registro en [NIC.ec](https://www.nic.ec/).

---

## Referencias y recursos

- [Next.js 15 App Router Docs](https://nextjs.org/docs)
- [Directus SDK Docs](https://docs.directus.io/packages/sdk.html)
- [Supabase + pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [next-intl Docs](https://next-intl-docs.vercel.app)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js/docs/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Turborepo Handbook](https://turbo.build/repo/docs)
