# Plan de integración — Cucurucho + Danzante

> Dos personajes nuevos al catálogo. Fecha del plan: 2026-09-08.
> Decisiones de identidad tomadas por el autor (ver §1).
> Rama de trabajo: `feat/personajes-cucurucho-danzante`, rebasada sobre `origin/main` @ `5f849db`
> (#77 — ya incluye carpeta-por-slug de imágenes #76, `imagenIngreso`, `PaseInmersivoGated` y
> `recorridoDePersonaje()`). El plan asume ese estado.

---

## 0. Qué encontró la revisión

La arquitectura es **data-driven casi por completo**: `getPersonajes()` / `getPersonaje()` leen
`personajes.json` sin listas fijas, y todo lo que deriva de ahí (grid, sitemap, cross-sell,
`generateStaticParams`, colección, logros, QR, códigos) escala solo.

**Escalan solos — cero cambios de código:**

| Consumidor | Por qué está bien |
|---|---|
| `app/sitemap.ts` | itera `getPersonajes({})` |
| `personajes/[slug]/page.tsx` | `generateStaticParams` desde el JSON |
| `PersonajesGrid` / `PersonajeCard` | recibe el array completo |
| `PersonajesEscenario` (cross-sell) | `todosPersonajes.filter(p => p.slug !== slug)` |
| `mis-personajes` + logros | `ORIGEN_ORDER` recorre los 4 orígenes y filtra los presentes |
| `desbloquear/[slug]` | `getPersonajes({})` |
| `scripts/generate-qr.mjs` | itera el JSON |
| `scripts/seed-codes.mjs` | itera el JSON, acepta `--slug` |
| `scripts/validate-data.mjs` | valida por reglas, no por lista |
| Tests (`personajes.service.test.ts`) | `toBeGreaterThan(0)`, no conteos fijos |
| i18n `messages/*.json` | no hay copy por personaje (el contenido vive en el JSON, solo ES) |

**Hardcodeado — sí hay que tocar (3 archivos):**

| Archivo | Problema | Estado |
|---|---|---|
| `modules/desbloqueo/components/DespertarAnimation.tsx` | `grid-cols-2 grid-rows-2` + `personajes.slice(0, 4)` — **con 6 personajes solo se ven 4**; la animación de canje miente sobre la colección | ✅ Ola A |
| `modules/home/components/MarqueeStrip.tsx` | lista `ITEMS` de 9 nombres a mano — faltarían los dos nuevos | ✅ Ola A |
| `modules/home/components/StatsSection.tsx` | `{ value: 9, label: "Seres documentados" }` — componente **no montado** en la landing, pero el dato queda desfasado | Ola B |

`PROXIMOS` en `app/[locale]/personajes/page.tsx` (Curiquingue, Sacha Runa, Rey Moro, Capitán, Ángel)
**no** incluye ninguno de los dos → no hay nada que quitar de ahí.

**Riesgo alto detectado:** el gating es **global**, no por personaje
(`gatingActive = !!supabase`). Una ficha publicada sin códigos sembrados queda **inalcanzable**
para cualquiera: `GatedPageRedirect` rebota a `/desbloquear/[slug]` y no hay código válido que
canjear. Por eso sembrar códigos no es opcional — va en la misma entrega (§6).

---

## 1. Identidad y slugs (contrato QR — irreversible tras imprimir)

> **Resuelto (2026-09-10):** slugs `cucurucho` y `danzante-yaruquies` (el autor creó la carpeta de
> imágenes con ese nombre → figura específica de la parroquia de Yaruquíes, Riobamba). El
> desambiguador `-yaruquies` deja libre `danzante-pujili` para Cotopaxi más adelante.
> ⚠ Aún **no impresos en QR** — si se cambia algún slug, hacerlo antes de la ola E.

| | Cucurucho | Danzante de Yaruquíes |
|---|---|---|
| **slug** | `cucurucho` | `danzante-yaruquies` |
| **Quién es** | Penitente encapuchado de la Semana Santa quiteña — procesión Jesús del Gran Poder, Viernes Santo | Danzante del Pase del Niño Rey de Reyes de Yaruquíes (Riobamba), 6 de enero |
| **Provincia** | Pichincha | Chimborazo |
| **Festividad** | Semana Santa (marzo/abril, fecha móvil) → pase nuevo `semana-santa-quito` | Pase del Niño Rey de Reyes → `personajeSlug` de `pase-nino-rey-de-reyes-riobamba` |
| **`origen`** | `colonial` (primero del catálogo) | `mixto` |
| **`nombreKichwa`** | — (figura de origen ibérico) | `Tushuc` — ⚠ tentativo, revisar con hablante nativo |

⚠ **`origen: "colonial"` es el primero del catálogo.** Aparece un **grupo de logro nuevo** en
`/mis-personajes` que hoy se completa con un solo personaje; se equilibra cuando entren Rey Moro /
Capitán / Ángel (coloniales, en la lista de próximos).

✅ **Contenido editorial verificado (2026-09-12)** con búsqueda web — reemplaza la nota "pendiente
de verificación" de la primera versión:
- **Cucurucho:** la procesión de Jesús del Gran Poder nació en **1961**, impulsada por el padre
  franciscano **Francisco Fernández** sobre una talla de Jesús en balsa (s. XVII) hallada en la
  sacristía de San Francisco. Confirmado por dos fuentes independientes:
  [Ministerio de Educación — Cultura y Patrimonio](https://educacion.gob.ec/cultura/como-surgio-la-procesion-de-jesus-del-gran-poder/) y
  [Quito Informa](https://www.quitoinforma.gob.ec/2024/03/28/la-procesion-jesus-del-gran-poder-63-anos-de-historia/).
- **Danzante de Yaruquíes:** corrección importante — la versión inicial decía que la máscara
  representaba una burla del "patrón colonial" (invención sin fuente, extrapolada de otras
  tradiciones de danzante del país). Las fuentes reales sobre **este** personaje
  ([Fiesta y Fe — sitio del Pase del Niño Rey de Reyes](https://fiestayfe.wixsite.com/fiestayfe/danzante),
  [La Prensa](https://www.laprensa.com.ec/personajes-tradicionales-pase-del-nino/)) lo describen
  como heredero del **"tushuc"**, sacerdote andino que marcaba con su danza los ciclos del Sol y
  la Luna — sin relación con Corpus Christi ni con una lectura de burla al poder colonial. Se
  reescribió `descripcion`, `simbolismo`, `narrativa` y 2 `hotspots` para reflejar esto; se quitó
  la mención a "Corpus" del `nombresAlt`/`palabrasClave`.
- Sigue siendo **conocimiento cultural general con fuentes periodísticas/institucionales**, no
  trabajo de campo propio — razonable para lanzar, pero si se quiere el rigor de una publicación
  académica, conviene contrastar con la comunidad de Yaruquíes antes de una tirada grande de imanes.

---

## 2. Fotos que necesito (respuesta a "dime cuáles y cuántas")

### Lo que ya existe
`public/personajes/otros/cucurucho-iman-cuatro-morados.jpg` — cuatro imanes morados sobre mesa negra
(capirote cónico, cruz dorada, escapulario blanco). **Sirve como foto de galería `iman`**, pero está
rotada 90° y con la mesa sucia → hay que rotar y recortar. **No sirve como `imagenPortada`**: no es
una figura frontal aislada.

Para Danzante no hay **ningún** asset.

### Manifiesto por personaje

| # | Campo / rol | Cuántas | Formato | Dónde vive | ¿Obligatoria? |
|---|---|---|---|---|---|
| 1 | **`imagenPortada`** — figura del imán, frontal, fondo limpio | **1** | retrato ~2:3 (referencia: 658×1014), `.webp` | `public/personajes/[slug]/[slug]-hero-figura-<desc>.webp` | **SÍ** — sin ella el personaje no aparece en `/personajes` (`withImage: true`) y `validate-data` **falla** si `experiencia: true` |
| 2 | **`imagenBanner`** — escena landscape para el hero de la ficha | **1** | **1376×768**, `.webp` | `public/headers/[slug]-banner.webp` | recomendada (sin ella el hero cae a `OrigenPlaceholder`) |
| 3 | **`imagenIngreso`** — foto de escena para el hero de `/desbloquear/[slug]` (distinta del banner) | **1** | landscape | `public/personajes/personaje_ingreso/[slug]-inicio.webp` | recomendada (si falta, cae a `imagenBanner`) |
| 4 | **Galería `titulo:"en-pase"`** — el personaje real en la festividad | **3–6** | libre, `.webp`/`.jpg` | `public/personajes/[slug]/[slug]-pase-<desc>.webp` | **SÍ, mínimo 3** |
| 5 | **Galería `titulo:"proceso"` — `iman`** — el imán sobre fondo limpio | **2–3** | libre | `[slug]-iman-<desc>.webp` | mínimo 1 |
| 6 | **Galería `titulo:"proceso"` — `taller`** — la pieza entre filamentos | **1–2** | libre | `[slug]-taller-<desc>.webp` | opcional |
| 7 | **Galería `titulo:"proceso"` — `escenario`** — imán compuesto en paisaje | **1** | libre | `[slug]-escenario-<desc>.webp` | opcional |
| 8 | **Audio ambiente** | 1 pista | `.mp3`, 30–90 s, loop | `public/audio/[slug]-ambiente.mp3` | opcional (si falta, el botón aparece mudo) |

**Por qué importan las `en-pase`:** alimentan **tres** cosas a la vez — van primero en la galería,
son los waypoints del recorrido, y las **3 primeras** se convierten en los beats del modo
presentación (fallback cuando no hay campo `presentacion`). Con 3 buenas fotos de pase quedan
resueltas galería + presentación + recorrido.

### Cuentas finales

| | Ya tiene | Faltan | Total objetivo |
|---|---|---|---|
| **Cucurucho** | 1 (imán, a recortar) | **8–11** | 9–12 |
| **Danzante** | 0 | **9–13** | 9–13 |

**Mínimo publicable con experiencia v2 (7 fotos por personaje):**
1 portada + 1 banner + 3 en-pase + 2 imán.
El resto (ingreso, taller, escenario, audio) se puede añadir en una segunda pasada sin tocar código.

### Hotspots (anatomía) — no son fotos, son coordenadas
3–4 elementos por personaje, con `x`/`y` en **% sobre la `imagenPortada`** (origen arriba-izquierda).
La lupa close-up de `AnatomiaSection` reencuadra la misma foto al 420% usando esas coordenadas —
no hacen falta assets nuevos, pero **la portada debe tener resolución suficiente** para aguantar
ese zoom (≥ 650 px de ancho).

Elementos propuestos:
- **Cucurucho:** capirote cónico · cruz dorada al pecho · escapulario blanco · cordón / pies descalzos
- **Danzante:** cabezal o penacho · pechera bordada · cascabeles de tobillo · pañuelo o vara

---

## 3. Contenido editorial a escribir

Por personaje, dentro de `personajes.json`:

```
nombre, nombreKichwa?, nombresAlt[2–3]
resumen          → 74–119 palabras (referencia de los existentes)
resumenCorto     → 1 frase gancho (opcional; si falta se corta la 1ª frase del resumen)
descripcion      → HTML con 3–4 bloques <h2> + <p>
simbolismo       → 2–3 frases
narrativa.leyenda   → 1 línea potente
narrativa.secreto   → dato del artesano (pie de la historia)
narrativa.capitulos → 3 capítulos de 3–4 oraciones
hotspots[3–4]       → titulo + cuerpo (1–3 frases) + material? + artesano?
multimedia[]        → una entrada por foto, con altText OBLIGATORIO
```

⚠ **Citar fuentes** para lo histórico (la Semana Santa quiteña está bien documentada; el PDF
`docs/fiestas_y_manifestaciones_ecuatorianas.pdf` ya se usó para las 9 festividades sembradas).
El contenido es **solo en español** — el locale `en` muestra el mismo texto (limitación existente,
no la introduce este trabajo).

---

## 4. Cambios en datos

### 4.1 `apps/web/lib/data/personajes.json`
+2 entradas con el contrato completo. Campos que `toPersonaje()` lee y no pueden faltar:
`id`, `slug`, `nombre`, `nombresAlt`, `resumen`, `descripcion`, `createdAt`, `updatedAt`,
y los arrays vacíos `variantes: []`, `elementos: []`, `apariciones: []`, `testimonios: []`, `tags: []`.

### 4.2 `apps/web/lib/data/pases.json`
- **+1 festividad nueva:** `semana-santa-quito` → `provincia: "pichincha"`, `ciudad: "Quito"`,
  `mes: 4`, `fechaTipo` movible, `personajeSlug: "cucurucho"`, `imagenPortada` si hay foto.
  Pichincha ya está en `provincias.json` y en `provincias.geo.json` → aparece en el mapa nacional sin
  trabajo extra (hoy solo la marca `fiesta-quito`).
- **Danzante:** asignarle `personajeSlug: "danzante"` a un pase de Chimborazo hoy sin dueño
  (candidatos: `nino-abyayala`, `divinos-ninos`, `nino-emmanuel`). Sin esto, la ficha muestra el
  texto genérico *"Fiestas populares del Ecuador"* en `StatsAnimados` en vez de contar sus fiestas.
  ⚠ `personajeSlug` es 1:1 — un pase, un personaje.

### 4.3 `apps/web/lib/data/recorrido.json`
- **Danzante:** añadir un 5º waypoint (`personajeSlug: "danzante"` + `coord` ancla) a los **4
  recorridos reales de Chimborazo** (`instituto-tecnologico-riobamba`, `mercado-santa-rosa`,
  `nino-rey-de-la-paz`, `nino-familia`), que hoy tienen 4 waypoints cada uno. Esto:
  1. lo muestra en el mapa multi-ruta de `/pases` (`RecorridosProvincia`) con `Popup` + link a su ficha;
  2. le da su sección **"Recorrido 3D"** en la ficha (`PaseInmersivoGated` → `recorridoDePersonaje()`).
  **Tras editar coords: `node scripts/build-route.mjs`** (necesita red; hornea geometría OSRM).
- **Cucurucho:** sin recorrido en la primera ola. `PaseInmersivoGated` degrada limpio si
  `recorridoDePersonaje()` devuelve `null`. Opcional fase 2: recorrido `semana-santa-quito` con
  `demo: true` sobre la ruta real de la procesión (San Francisco → Centro Histórico), waypoints
  inline sin `personajeSlug`.

### 4.4 Sin cambios
`provincias.json`, `provincias.geo.json`, `slug-aliases.ts` (slugs nuevos, nada que aliasar).

---

## 5. Cambios en código

**Ola A — hecho (commit en `feat/personajes-cucurucho-danzante`):**
1. ✅ **`DespertarAnimation.tsx`** — grid dinámico: `cols = ceil(√n)`, `rows` implícitas; se quitó
   `slice(0, 4)` (mostraba solo 4 de 6+). `sizes` de `<Image>` = `${100/cols}vw`. Escalonado
   acotado a `min(0.15, 1.2/n)` para no pasar el timeout de 2.2 s con cualquier conteo.
2. ✅ **`MarqueeStrip.tsx`** — `Cucurucho` y `Danzante` añadidos a `ITEMS` tras Payaso. `qu` = el
   mismo nombre en español (como `Ángel`): no se siembra un neologismo kichwa sin revisar. El
   `nombreKichwa` real es decisión de contenido, va en `personajes.json` (§1).

**Ola B — pendiente (junto con las entradas del JSON):**
3. **`StatsSection.tsx`** — `9 → 11` seres, `11 → 24` pases catalogados. Componente **dormido**
   (no montado en la landing). Se hace en Ola B para no adelantar un número a un dato que aún no
   existe. (Aparte: "3 Idiomas" ya está obsoleto — `qu` se retiró — pero es ajeno a este trabajo.)

---

## 6. Producto: QR + códigos de desbloqueo

Orden **obligatorio** (el gating global hace que una ficha sin códigos sea inalcanzable):

```bash
# 1. QR de imprenta — apuntando al dominio propio, no al de Railway
NEXT_PUBLIC_SITE_URL=https://nunna-ecu.com node scripts/generate-qr.mjs
#   → public/qr/qr-cucurucho.png, qr-danzante.png (1024 px, ECC H)

# 2. Sembrar códigos (requiere SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local)
node --env-file=apps/web/.env.local scripts/seed-codes.mjs \
  --slug cucurucho --count 20 --batch lote-2 > codes-cucurucho.csv
node --env-file=apps/web/.env.local scripts/seed-codes.mjs \
  --slug danzante  --count 20 --batch lote-2 > codes-danzante.csv
```

- `codes-*.csv` **ya está en `.gitignore`** — nunca commitear códigos sin canjear.
- La RPC `redeem_code(p_code, p_expected_slug)` **ya valida por personaje** desde 2026-07-04
  (`wrong_character`) — sin cambios de schema.
- Verificar que `https://nunna-ecu.com/**` sigue permitido como redirect del magic-link en Supabase Auth.
- Probar `--dry-run` primero para revisar el CSV sin tocar la DB.

---

## 7. Verificación

```bash
pnpm validate-data                                   # integridad referencial (corre también en CI)
pnpm --filter @seres-del-pase/web type-check
pnpm --filter @seres-del-pase/web lint
pnpm --filter @seres-del-pase/web test
pnpm build                                           # SSG completo
graphify update .                                    # refrescar el grafo
```

**Checklist manual** (dev en `:3030`, y móvil real — el QR se escanea con el teléfono):
- [ ] `/es/personajes` → 6 cards, las nuevas con candado
- [ ] `/es/personajes/cucurucho` sin sesión → redirige a `/es/desbloquear/cucurucho`
- [ ] Canje con un código de `codes-cucurucho.csv` → `DespertarAnimation` muestra **6** figuras
- [ ] Ficha desbloqueada: hero Despertar · gancho + "Leer más" · recorrido 3D (solo Danzante) ·
      presentación · anatomía con hotspots · galería · cross-sell
- [ ] Código de cucurucho en `/desbloquear/danzante` → `wrong_character`, no canjea
- [ ] `/es/pases` → Pichincha marcada; sección Calendario muestra Semana Santa
- [ ] `/mis-personajes` → progreso sobre 6, logro "Colonial" nuevo
- [ ] OG de WhatsApp: compartir la ficha nueva y ver la preview
- [ ] Escanear `qr-cucurucho.png` con la cámara → aterriza en la ficha

---

## 8. Documentación a actualizar

- `CLAUDE.md` → tabla "Personajes en producción" (4 → 6), sección "Estado actual", nota de
  `origen: colonial`
- `apps/web/public/audio/README.md` → tabla de 4 → 6 archivos
- `docs/CHANGELOG.md` → entrada nueva
- **`docs/AGREGAR-PERSONAJE.md` (nuevo)** → capitalizar este trabajo como runbook, espejo de
  `AGREGAR-PROVINCIA.md`. Hoy no existe y este plan es exactamente su contenido.

---

## 9. Orden de ejecución sugerido

| Ola | Qué | Estado |
|---|---|---|
| **A** | Fix `DespertarAnimation` (bug real con 5+ personajes) · `MarqueeStrip` · `docs/AGREGAR-PERSONAJE.md` | ✅ commit `b5d6681` |
| **B+C** | Entradas en `personajes.json` (contenido editorial + hotspots) · `pases.json` (`semana-santa-quito` nuevo + `personajeSlug` del Danzante en `pase-nino-rey-de-reyes-riobamba`) · `StatsSection` (11/24) · `MarqueeStrip` afinado · assets renombrados a la convención (17 webp + 2 banners + 1 ingreso) · CLAUDE.md / audio README | ✅ este commit — `validate-data`, `build`, 44 tests, curl 200 en ambas fichas |
| **D** | Waypoints del Danzante en `recorrido.json` (4 recorridos reales de Chimborazo) + `node scripts/build-route.mjs` | ⏳ **omitido a propósito** — ver nota abajo |
| **E** | QR (`generate-qr.mjs`) | ✅ 2026-09-12 — 6 PNG en `public/qr/`, dominio `nunna-ecu.com` |
| **E** | Siembra de códigos (`seed-codes.mjs --slug cucurucho` / `--slug danzante-yaruquies`) | ⏳ pendiente — el autor pidió dejarlo para cuando decida sembrar (la clave de servicio sí está en `.env.local`) |
| — | Verificar y corregir contenido editorial con fuentes reales | ✅ 2026-09-12 — ver nota en §1 |
| — | Limpiar 3 archivos huérfanos que rompían CI (`calendario/page.tsx`, `QrScanner.tsx`, `PaseMapSection.tsx`) | ✅ 2026-09-12 — borrados, cero imports reales, `type-check`/`lint`/`build` limpios |

**Por qué se omitió la Ola D:** agregar al Danzante a los 4 recorridos reales de Chimborazo exige
una coordenada GPS de dónde camina en cada desfile — un dato logístico que no puedo verificar ni
inventar (la misma regla que ya aplica `docs/AGREGAR-PROVINCIA.md` a fechas/rutas). Se necesitan
las anclas reales (trabajo de campo o una fuente que las dé) antes de tocar `recorrido.json`; con
eso, `node scripts/build-route.mjs` hace el resto.

⚠ **Nota de rama:** hay un commit huérfano pendiente (`eb7f322`, `feat/selector-pases-recorrido`)
que nunca llegó a `main` — ver `CLAUDE.md` §Siguiente. Este trabajo debería salir de `main`
actualizado, no encadenarse a esa rama.
