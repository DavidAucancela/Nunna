# Guía de Implementación — Seres del Pase

Estado al 2026-05-25. Las fases 0 y 1 están completas.
Esta guía cubre únicamente lo pendiente.

---

## Infraestructura actual (funcionando)

| Servicio | Estado | URL |
|---------|--------|-----|
| Directus CMS | ✅ Railway | `https://directus-production-d593.up.railway.app` |
| Base de datos | ✅ Supabase | `https://dhhesajpexcyainibwvl.supabase.co` |
| Frontend dev | ✅ Local | `http://localhost:3030/es` |
| Frontend prod | 🔄 Pendiente | Railway (siguiente paso) |

---

## Siguiente paso inmediato — Deploy en Railway

### Por qué Railway y no Vercel
Decisión tomada: todo en Railway para centralizar infraestructura. El Directus ya está ahí.
Railway hobby plan tiene cold starts (~8s sin tráfico). Si afecta la experiencia QR, pasar a Pro ($20/mes).

### Cómo hacer el deploy

**1. Preparar el repo**
```bash
git add -A
git commit -m "feat: railway deploy ready"
git push
```

**2. En Railway**
- New Project → Deploy from GitHub repo → seleccionar el repo
- Add Service → seleccionar el repo de nuevo (para el frontend)
- En Settings del servicio:
  - **Root Directory:** `apps/web`
  - **Build Command:** `cd ../.. && pnpm install && pnpm build --filter @seres-del-pase/web`
  - **Start Command:** `node apps/web/node_modules/.bin/next start -p $PORT`
  - **Watch Paths:** `apps/web/**`

**3. Variables de entorno en Railway**
```
DIRECTUS_URL=https://directus-production-d593.up.railway.app
DIRECTUS_STATIC_TOKEN=<token>
NEXT_PUBLIC_SUPABASE_URL=https://dhhesajpexcyainibwvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<JWT completo>
NEXT_REVALIDATE_TOKEN=seres-del-pase-revalidate-2026
NODE_ENV=production
```

**4. Dominio**
- Una vez desplegado, Railway da una URL `*.railway.app`
- Cuando se compre el dominio final, configurarlo en Railway → Settings → Domains
- El dominio va en los QR de los llaveros — debe ser el definitivo antes de imprimir

---

## Fase 2 — Optimización para QR (prioridad real)

El comprador escanea el QR → aterriza en `/es/personajes/[slug]`. Esa página tiene que impresionar en móvil en 3 segundos.

### 2.1 Página de detalle mobile-first
- Hero visible sin scroll: nombre del personaje legible en pantalla de 375px
- Tiempo de carga < 2s en 4G (sin imágenes pesadas sin optimizar)
- Sección "Otros Seres" al final para cross-sell de otros llaveros

### 2.2 Landing page redefinida
Actualmente es un catálogo cultural. Debe comunicar:
> "Tu llavero tiene una historia. Escanea el QR para descubrirla."

- Hero: explicar el concepto del QR
- Grid de personajes: "Hay 8 seres. ¿Cuál tienes tú?"
- CTA: dónde comprar (cuando haya punto de venta online)

### 2.3 OpenGraph para compartir en redes
```typescript
// En generateMetadata de [slug]/page.tsx
openGraph: {
  title: `${personaje.nombre} | Seres del Pase`,
  description: personaje.resumen,
  images: [{ url: imagenPortada.url, alt: imagenPortada.altText, width: 1200, height: 630 }],
  type: "article",
},
twitter: {
  card: "summary_large_image",
},
```

### 2.4 Imágenes de personajes
- Subir fotos en Directus admin → Media
- Rellenar `altText` (obligatorio, accesibilidad)
- Vincular a personaje via `imagenPortada`
- Las imágenes se sirven desde Supabase Storage, optimizadas por `next/image`

---

## Fase 3 — Experiencia inmersiva

Solo cuando el catálogo base tenga imágenes y el deploy esté estable.

### 3.1 Scroll narrativo
```bash
pnpm add lenis framer-motion --filter @seres-del-pase/web
```
- Lenis para smooth scroll
- Framer Motion para animaciones en scroll
- Regla: si notas la animación más que el contenido, quítala

### 3.2 Hotspots en el traje
- Imagen del traje completo con puntos clickeables
- Cada punto abre info del `ElementoTraje`
- Implementar con posicionamiento relativo + Framer Motion

### 3.3 Búsqueda semántica
Requiere: `OPENAI_API_KEY` + pgvector activo en Supabase
```sql
-- En Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE personajes ADD COLUMN embedding vector(1536);
```
La API NestJS ya tiene el esqueleto en `apps/api/src/busqueda/`.

### 3.4 Mapa y calendario
Funcionalidades secundarias. El mapa usa MapLibre GL JS (open-source).
El calendario usa los campos `mes` y `dia` que ya existen en la colección `pases`.

---

## Contenido: ficha mínima por personaje

Antes de marcar `publicadoEn`:
```
✓ slug          (kebab-case sin tildes: aya-uma)
✓ nombre        (nombre principal)
✓ nombreKichwa  (nombre en kichwa si aplica)
✓ resumen       (~150 palabras, aparece en la card y en meta description)
✓ descripcion   (~500-800 palabras en HTML rico)
✓ origen        (prehispanico | colonial | mestizo | mixto)
✓ imagenPortada (mínimo 1 foto con altText)
✓ publicadoEn   (fecha — null = borrador)
```

---

## Costos operativos

| Servicio | Costo | Notas |
|---------|-------|-------|
| Railway (Directus + Next.js) | ~$10-15/mes | Hobby plan. Pro $20/mes si cold starts afectan QR |
| Supabase (PostgreSQL) | Free tier | 500MB DB. Escalar cuando supere o necesite backups |
| Dominio | ~$15/año | Comprar en NIC.ec para `.ec`, o Namecheap para `.com` |
| OpenAI (embeddings, Fase 3) | ~$0.02/1M tokens | Mínimo |
| **Total aprox.** | **~$25-30/mes** | Con dominio prorrateado |

---

## Checklist accesibilidad (WCAG 2.2 AA)

Verificar antes de cada release:
- [ ] Contraste ≥ 4.5:1 en texto normal
- [ ] Todos los elementos interactivos accesibles por teclado
- [ ] `alt` descriptivo en todas las imágenes (no "imagen de…")
- [ ] `aria-label` en botones con solo ícono
- [ ] Transcripciones para audios (cuando se agreguen)
- [ ] `prefers-reduced-motion` respetado (ya en `globals.css`)
- [ ] Skip-to-content link funcional (ya en `layout.tsx`)

---

## Referencias

- [Next.js 15 App Router](https://nextjs.org/docs)
- [Directus SDK](https://docs.directus.io/packages/sdk.html)
- [next-intl](https://next-intl-docs.vercel.app)
- [Railway Deploy Docs](https://docs.railway.app/deploy/deployments)
- [Supabase + pgvector](https://supabase.com/docs/guides/ai/vector-columns)
