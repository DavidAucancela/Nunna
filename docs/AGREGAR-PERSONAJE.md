# Agregar un personaje al catálogo

Todo lo que renderiza un personaje (grid de `/personajes`, ficha `/personajes/[slug]`, cross-sell,
`sitemap`, colección, logros, QR, siembra de códigos) sale de **una entrada en
`apps/web/lib/data/personajes.json`**. `getPersonajes()` / `getPersonaje()` no tienen listas fijas:
añadir la entrada + las imágenes es casi todo el trabajo.

> ⚠️ **Verifica el contenido antes de cargarlo.** Nombres originarios, historia, simbolismo y
> atribución del artesano son datos culturales: vienen de una fuente real (bibliografía, la
> comunidad, el propio artesano), no de memoria. **Cita las fuentes** en `narrativa.secreto` y en la
> `descripcion` cuando afirmes algo histórico. Licencia del contenido: CC BY-NC-SA 4.0.

> ⚠️ **El `slug` es un contrato permanente.** Se imprime en el QR del imán. Una vez impreso no se
> puede cambiar sin dejar 404s. Si algún día hay que renombrarlo: cambia `slug` en el JSON **y**
> agrega `{ from, to }` en `lib/data/slug-aliases.ts` (nunca lo borres). Elige el slug **antes** de
> generar los QR. Para nombres que pueden colisionar entre regiones usa desambiguador
> (`danzante-pujili`, `mama-negra-latacunga`); los slugs de Riobamba ya impresos se congelan.

---

## Los archivos

| Archivo | Qué aporta | ¿Obligatorio? |
|---|---|---|
| `apps/web/lib/data/personajes.json` | La entrada completa del personaje | **Sí** |
| `apps/web/public/personajes/[slug]/` | Carpeta de imágenes (una por slug) | **Sí** (al menos la portada) |
| `apps/web/public/headers/[slug]-banner.webp` | Banner landscape del hero de la ficha | Recomendado |
| `apps/web/public/personajes/personaje_ingreso/[slug]-inicio.webp` | Foto de escena del hero de `/desbloquear/[slug]` | Recomendado (cae a `imagenBanner`) |
| `apps/web/public/audio/[slug]-ambiente.mp3` | Audio ambiente opt-in del hero v2 | Opcional |
| `apps/web/lib/data/pases.json` | Cruza el personaje con una festividad (`personajeSlug`) | Recomendado |
| `apps/web/lib/data/recorrido.json` | Añade el personaje como parada de un recorrido | Opcional |

Nada en `messages/*.json` — no hay copy por personaje; el contenido vive en el JSON (solo español,
el locale `en` muestra el mismo texto).

---

## Paso 1 — Imágenes

Convención (ver CLAUDE.md § "Imágenes"): **una carpeta por slug**, nombre autodescriptivo
`[slug]-[seccion]-[descripcion].[ext]`. El `id` de cada `Media` es el nombre del archivo sin
extensión.

```
public/personajes/[slug]/
  [slug]-hero-figura-<desc>.webp      → imagenPortada (figura del imán, frontal, fondo limpio)
  [slug]-pase-<desc>.webp             → titulo:"en-pase"  (el personaje real en la festividad)
  [slug]-iman-<desc>.webp             → titulo:"proceso"  (el imán sobre fondo limpio)
  [slug]-taller-<desc>.webp           → titulo:"proceso"  (la pieza entre filamentos)
  [slug]-escenario-<desc>.webp        → titulo:"proceso"  (el imán compuesto en paisaje)
public/headers/[slug]-banner.webp     → imagenBanner (1376×768)
public/personajes/personaje_ingreso/[slug]-inicio.webp → imagenIngreso (landscape)
```

| Rol | Mínimo | Notas |
|---|---|---|
| `imagenPortada` | **1** | retrato ~2:3 (referencia 658×1014), ≥ 650 px de ancho — la lupa de `AnatomiaSection` la reencuadra al 420 % |
| `imagenBanner` | 1 | 1376×768; sin ella el hero cae a `OrigenPlaceholder` |
| `en-pase` | **3** | van **primero** en la galería + alimentan los waypoints del recorrido + las 3 primeras son el fallback de los beats del modo presentación |
| `iman` (proceso) | 1 | el producto físico |
| `taller` / `escenario` | 0 | opcionales |

> `public/personajes/otros/` es un buzón para figuras sin ficha y material sin clasificar — **nada
> de ahí se referencia desde el JSON**. Si vas a publicar una figura que hoy vive en `otros/`,
> mueve y renombra sus archivos a `public/personajes/[slug]/`.

---

## Paso 2 — La entrada en `personajes.json`

Añade un objeto al array. Campos que el servicio (`lib/services/personajes.service.ts →
toPersonaje`) lee:

```jsonc
{
  "id": "cucurucho",                       // = slug
  "slug": "cucurucho",                     // ⚠ contrato QR permanente
  "nombre": "Cucurucho",
  "nombreKichwa": "…",                     // opcional — omítelo si la figura no tiene nombre kichwa
  "nombresAlt": ["…", "…"],                // 2–3 nombres alternativos (se muestran en StatsAnimados)
  "origen": "colonial",                    // "prehispanico" | "colonial" | "mestizo" | "mixto"
  "resumen": "74–119 palabras…",           // OG description + primera pantalla de la ficha
  "resumenCorto": "Una frase gancho.",     // opcional; si falta se corta la 1ª frase del resumen
  "descripcion": "<h2>…</h2><p>…</p>",     // HTML, 3–4 bloques h2+p
  "simbolismo": "2–3 frases.",             // opcional
  "experiencia": true,                     // activa hero "Despertar" + Anatomía (requiere imagenPortada)
  "audioAmbiente": "/audio/cucurucho-ambiente.mp3",  // opcional; botón mudo si falta el archivo
  "imagenPortada": "/personajes/cucurucho/cucurucho-hero-figura-frontal.webp",
  "imagenBanner": "/headers/cucurucho-banner.webp",
  "imagenIngreso": "/personajes/personaje_ingreso/cucurucho-inicio.webp",
  "narrativa": {
    "leyenda": "Una línea potente.",
    "secreto": "Dato del artesano (con fuente). Pie de la sección historia.",
    "capitulos": [
      { "titulo": "…", "texto": "3–4 oraciones." },
      { "titulo": "…", "texto": "…" },
      { "titulo": "…", "texto": "…" }
    ],
    "palabrasClave": ["…"]                 // opcional — términos a enfatizar; los kichwa muestran tooltip
  },
  "hotspots": [                            // 3–4 elementos del traje — solo se renderiza si experiencia:true
    {
      "id": "capirote",
      "x": 50, "y": 12,                    // % sobre imagenPortada (origen arriba-izquierda)
      "titulo": "El capirote",
      "cuerpo": "Significado (1–3 frases).",
      "material": "…",                     // opcional → fila "Material"
      "artesano": "…"                      // opcional → fila "Quién lo hace"
    }
  ],
  "multimedia": [
    {
      "id": "cucurucho-pase-procesion-gran-poder",   // = nombre del archivo sin extensión
      "tipo": "imagen",
      "url": "/personajes/cucurucho/cucurucho-pase-procesion-gran-poder.webp",
      "altText": "…",                      // ⚠ OBLIGATORIO
      "titulo": "en-pase",                 // "en-pase" (va primero) | "proceso" | omitir
      "descripcion": "Texto en hover.",
      "orden": 1
    }
  ],
  "variantes": [], "elementos": [], "apariciones": [], "testimonios": [], "tags": [],
  "publicadoEn": "2026-09-08T12:00:00",
  "createdAt": "2026-09-08T12:00:00",
  "updatedAt": "2026-09-08T12:00:00"
}
```

Notas:
- `toPersonaje()` inyecta `imagenPortada` como `multimedia[0]` automáticamente (id `${slug}-portada`).
  No la dupliques en el array.
- Sin `imagenPortada`, el personaje **no aparece** en `/personajes` (`withImage: true`) y
  `validate-data` **falla** si `experiencia: true`.
- `presentacion[]` (beats con visual + frase del autor) es opcional; si falta, los beats se derivan
  de `narrativa.capitulos` reusando las imágenes existentes. Ver CLAUDE.md § "Modo presentación".
- `origen` nuevo en el catálogo (p. ej. el primer `colonial`) crea un **grupo de logro nuevo** en
  `/mis-personajes` — no requiere código, pero tenlo presente.

---

## Paso 3 — Cruzar con una festividad (`pases.json`)

Para que la ficha muestre "N fiestas populares" (en vez del texto genérico) y el personaje aparezca
en el mapa nacional:

- **Festividad ya sembrada:** asígnale `"personajeSlug": "[slug]"` a un pase que hoy no tenga dueño.
  Es 1:1 — un pase, un personaje.
- **Festividad nueva:** añade el objeto a `pases.json` (ver `docs/AGREGAR-PROVINCIA.md` para la
  forma completa) con `provincia` (debe existir en `provincias.json`), `mes` (para que aparezca en
  el calendario y marque su provincia) y `personajeSlug`.

---

## Paso 4 — Añadirlo a un recorrido (`recorrido.json`, opcional)

Añade un waypoint a `pases[].waypoints[]` del recorrido correspondiente:

```jsonc
{ "personajeSlug": "danzante", "coord": [lng, lat], "label": "Danzante", "orden": 5 }
```

Esto lo muestra en el mapa multi-ruta de `/pases` (`RecorridosProvincia`) **y** le da su sección de
recorrido 3D en la ficha (`PaseInmersivoGated`). Un waypoint sin `personajeSlug` es "inline" (trae
`nombre`/`leyenda` propios, sin link a ficha).

**Tras editar cualquier `coord`:** `node scripts/build-route.mjs` (necesita red — hornea la
geometría OSRM y alinea los pines a la calle; producción queda estática).

---

## Paso 5 — QR + códigos de desbloqueo

El gating es **global** (`gatingActive = !!supabase`): con Supabase configurado, una ficha **sin
códigos sembrados es inalcanzable** (redirige a `/desbloquear/[slug]` y no hay código válido). Si el
imán se va a vender, siembra códigos en la misma entrega.

```bash
# QR de imprenta (uno por personaje, apuntando al dominio propio)
NEXT_PUBLIC_SITE_URL=https://nunna-ecu.com node scripts/generate-qr.mjs
#   → apps/web/public/qr/qr-[slug].png

# Sembrar códigos (requiere SUPABASE_SERVICE_ROLE_KEY; --dry-run = solo CSV)
node --env-file=apps/web/.env.local scripts/seed-codes.mjs \
  --slug [slug] --count 20 --batch lote-N > codes-[slug].csv
```

`codes-*.csv` está en `.gitignore` — nunca se commitea. La RPC `redeem_code(p_code,
p_expected_slug)` ya valida por personaje (`wrong_character`), sin cambios de schema.

---

## Paso 6 — Verificar

```bash
pnpm validate-data                                # integridad referencial (corre en CI y antes del build)
pnpm --filter @seres-del-pase/web type-check
pnpm --filter @seres-del-pase/web lint
pnpm --filter @seres-del-pase/web test
pnpm build                                        # SSG completo
graphify update .                                 # refrescar el grafo
```

Checklist manual (dev en `:3030`, **y en un móvil real** — el QR se escanea con el teléfono):
- [ ] `/es/personajes` → la card nueva aparece (con candado si el gating está activo)
- [ ] `/es/personajes/[slug]` sin sesión → redirige a `/es/desbloquear/[slug]`
- [ ] Canje con un código del CSV → `DespertarAnimation` muestra **todas** las figuras del catálogo
- [ ] Ficha desbloqueada: hero Despertar · gancho + "Leer más" · StatsAnimados · Cuándo verlo /
      Recorrido 3D · modo presentación · Anatomía con hotspots · Galería · cross-sell
- [ ] Código de otro personaje en `/desbloquear/[slug]` → `wrong_character`, no canjea
- [ ] `/es/pases` → provincia del pase marcada; sección Calendario lo lista
- [ ] `/mis-personajes` → progreso y logros cuentan al personaje nuevo
- [ ] Compartir la ficha en WhatsApp → la preview OG luce bien
- [ ] Escanear `qr-[slug].png` con la cámara → aterriza en la ficha

---

## Qué NO hay que tocar (escala solo)

`app/sitemap.ts`, `generateStaticParams` de la ficha y de `/desbloquear`, `PersonajesGrid`,
`PersonajesEscenario` (cross-sell), `/mis-personajes` + logros, `scripts/generate-qr.mjs`,
`scripts/seed-codes.mjs`, `scripts/validate-data.mjs`, los tests — todos iteran el JSON.

## Qué SÍ tiene listas a mano

- `modules/home/components/MarqueeStrip.tsx` — `ITEMS` con los nombres del marquee de la landing.
- `modules/home/components/StatsSection.tsx` — contadores ("N seres documentados"). Componente
  dormido (no montado), pero el número queda desfasado.
- `app/[locale]/personajes/page.tsx` — `PROXIMOS` (personajes "próximamente"): si el nuevo estaba
  ahí, quítalo de esa lista.
