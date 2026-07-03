# Plan v3 — Auditoría y hoja de ruta

> Auditoría completa del proyecto (2026-07-01). Type-check ✅, lint ✅, build SSG ✅.
> Los fallos listados abajo salieron de revisión de código, datos y configuración.

---

## A. Errores encontrados (corregir antes de cualquier feature)

### A1. `metadataBase` apunta a un dominio que no es el de producción 🔴
`app/[locale]/layout.tsx:36` → `new URL("https://seres-del-pase.ec")`, pero producción es
`https://nunnaec-production.up.railway.app`. Todas las imágenes OpenGraph se resuelven contra el
dominio equivocado → **las previews de WhatsApp están rotas**, y "OpenGraph rico" es requisito
del modelo de negocio.
**Fix:** leer el dominio de una env (`NEXT_PUBLIC_SITE_URL`) con fallback al de Railway; cuando
haya dominio propio solo cambia la env.

### A2. Datos huérfanos en `pases.json` 🔴
Al quitar los 5 personajes sin imagen (commit `91098a5`), quedaron referencias colgadas:
- `safpi` → `personaje: "Rey Moro"` (ya no existe)
- `instituto-tecnologico-riobamba` → `personaje: "Curiquingue"` (ya no existe)

Fallan silenciosamente (filtro sin match). **Fix:** limpiar/actualizar esas referencias y añadir
validación automática (ver C1).

### A3. Matching pases↔personaje por nombre visible, no por slug 🟡
`app/[locale]/personajes/[slug]/page.tsx:68` → `p.personaje === personaje.nombre`. Frágil: se
rompe con cualquier cambio de display-name o localización del nombre.
**Fix:** añadir `personajeSlug` a `pases.json` y matchear por slug.

### A4. El redirect de gating pierde el personaje 🟡
`GatedPageRedirect.tsx:14` redirige a `/desbloquear` a secas, existiendo `/desbloquear/[slug]`.
El comprador que escanea el QR sin haber canjeado aterriza en un formulario genérico sin contexto.
**Fix:** `router.replace(\`/desbloquear/\${slug}\`)`.

### A5. Contradicción con el contrato del QR documentado 🟠 (decisión de producto)
CLAUDE.md dice "El QR NO cambia. Sigue navegando a la ficha pública", pero `GatedPageRedirect`
saca de la ficha a **todo** visitante sin el personaje en su colección. Consecuencias:
- El QR ya no aterriza en la ficha → el "producto digital que justifica la compra" queda detrás de login+código.
- Flash de contenido: la ficha SSG se renderiza completa y luego el cliente redirige.
- El gating es cosmético: todo el contenido narrativo viaja en el HTML estático (view-source lo revela).
- SEO: Google indexa una página de la que los usuarios son expulsados.

**Decidir:** (a) volver a ficha pública + experiencia inmersiva como premio (diseño original), o
(b) ficha 100 % gated → entonces documentarlo, servir un teaser real (no el contenido completo +
redirect), y actualizar CLAUDE.md.

### A6. Higiene del repo 🟡
- `apps/web/tsconfig.tsbuildinfo` está **trackeado en git** (aparece modificado en cada build). Añadir `*.tsbuildinfo` a `.gitignore` y `git rm --cached`.
- ~58 MB de videos sin usar y sin trackear en `public/pases-videos/` (`videos-header.mp4`, `videos-header2.mp4`, `videos_header3.mp4`) — nada los referencia (solo se usa `main-header.mp4`). Borrarlos o moverlos fuera del repo; si se commitean inflan repo y deploy.
- `public/qr/` sin trackear (2 PNGs) — decidir si se versionan.
- `codes.csv` en la raíz: `.gitignore` lo cubre, pero es dato sensible en disco — mover fuera del repo.
- `.DS_Store` sueltos en `public/` (ignorados, solo limpieza local).

### A7. CLAUDE.md desactualizado 🟡
Dice 9 personajes (hay 4 en el JSON), da por eliminado `WhatsAppShare` (está de vuelta en la ficha),
da por hecho el toggle claro/oscuro (no existe: `html` lleva `dark` hardcodeado), y no documenta
`/desbloquear/[slug]`, `GatedPageRedirect`, `CuandoVerloSection`, `ArtesanoSection`,
`ColeccionCounter` ni el cambio de contrato del QR (A5).

---

## B. Puntos de mejora

### B1. Performance móvil (crítico: el QR se escanea con teléfono) 🔴
- **`images: { unoptimized: true }`** en `next.config.ts` desactiva TODO el pipeline de next/image:
  sin WebP/AVIF, sin srcset responsive, sin lazy sizing. Los PNG se sirven tal cual. Reactivar la
  optimización (sharp funciona en Railway) o pre-generar variantes en build.
- Video del hero: `main-header.mp4` pesa **11.9 MB** — enorme para datos móviles. Comprimir
  (~2–3 MB objetivo, H.264 720p) y/o `preload="none"` + poster.
- Medir con Lighthouse móvil sobre producción y fijar presupuesto (LCP < 2.5 s en 4G).

### B2. SEO / compartir 🔴
- **No existe `sitemap.ts` ni `robots.ts`** — añadir ambos (App Router los genera nativo).
- **Sin `alternates.languages` (hreflang)** para es/qu/en en los metadata.
- Sin `manifest.json` (PWA básica: ícono + nombre al "añadir a inicio" tras escanear el QR).
- **Dominio propio antes de imprimir a escala** (riesgo ya documentado: el QR codifica el
  subdominio de Railway). Es bloqueante de negocio, no de código.

### B3. i18n incompleto 🟡
Strings hardcodeadas en español que rompen qu/en:
- Ficha: "Origen", "Festividad", "También conocido como"/"Nombre alternativo", "N pases del Niño Riobambeño", title "No encontrado" (`personajes/[slug]/page.tsx`).
- `WhatsAppShare.tsx`: "Compartir este personaje" + mensaje "Descubrí a…".
- `layout.tsx`: skip-link "Saltar al contenido".
Además: kichwa tentativo en `desbloquear`/`coleccion`/`logros`/`experiencia`/`anatomia` — pendiente hablante nativo (ya conocido).

### B4. Código muerto 🟡
- **`apps/api/` (NestJS + dep `openai`) y `prisma/`**: la búsqueda semántica se descartó
  (2026-06-21) y no hay otro caso de uso. Eliminarlos simplifica CI, instalación y mantenimiento.
- Componentes sin uso: `HotspotsViewer.tsx`, `SimbolimoSection.tsx`, `ScrollProgress.tsx`.
- `palabrasClave` en `personajes.json` (ya sin consumidor).

### B5. Calidad / robustez 🟡
- **Cero tests en todo el repo.** Mínimo valioso, en orden:
  1. Script `validate-data` (integridad referencial de los JSON — habría atrapado A2).
  2. Tests unitarios de `lib/services/*` (toPersonaje, merge multimedia, getRecorridos).
  3. Test del flujo de canje (mock de Supabase: los 6 status de `redeem_code`).
- Headers de seguridad ausentes (`X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`,
  `Referrer-Policy`). CSP completa es opcional; los básicos son gratis.
- `check_code_valid` es ejecutable por `anon` sin rate limit → enumeración de códigos posible.
  Riesgo bajo (espacio 31⁶ ≈ 887 M), pero considerar rate limiting de Supabase o CAPTCHA suave si escala.
- Estilos: la ficha mezcla tokens del design system con `stone-*` crudos (`bg-stone-900/40`,
  `text-stone-600`) — unificar en tokens para poder reintroducir modo claro sin sorpresas.

---

## C. Plan v3 por fases

> **Estado (2026-07-01):** Fases 0, 1 y 2 **completadas** (salvo los puntos externos:
> compra del dominio propio y auditoría Lighthouse sobre producción). Decisión A5: **ficha gated**
> con redirect a `/desbloquear/[slug]` — documentada en CLAUDE.md. Pendientes: Fases 3, 4 y 5.

### Fase 0 — Corrección de errores ✅ COMPLETADA (2026-07-01)
1. `NEXT_PUBLIC_SITE_URL` + fix `metadataBase` (A1) — desbloquea previews WhatsApp.
2. Limpiar huérfanos de `pases.json` + matching por slug (A2, A3).
3. Redirect con slug: `/desbloquear/[slug]` (A4).
4. **Decidir contrato QR** (A5) y alinear código + CLAUDE.md.
5. Higiene: gitignore tsbuildinfo, borrar videos sin uso, mover `codes.csv` (A6).
6. Actualizar CLAUDE.md (A7).

### Fase 1 — Performance móvil ✅ COMPLETADA (2026-07-01; Lighthouse sobre producción pendiente)
1. Reactivar optimización de imágenes de Next (quitar `unoptimized`) y verificar en Railway.
2. Comprimir `main-header.mp4` (≤3 MB) + `preload` correcto.
3. Auditoría Lighthouse móvil en producción; fijar presupuesto y corregir lo que salga.

### Fase 2 — SEO y compartir ✅ COMPLETADA (2026-07-01; dominio propio pendiente — externo)
1. `app/sitemap.ts` + `app/robots.ts` (todas las rutas × 3 locales).
2. `alternates.languages` (hreflang) en layout y ficha.
3. `manifest` PWA básico.
4. **Comprar/configurar dominio propio** apuntado a Railway (bloqueante para imprimir a escala).

### Fase 3 — i18n completo (1 sesión + externo)
1. Mover todas las strings hardcodeadas a `messages/*` (B3).
2. Gestionar revisión kichwa con hablante nativo (externo, arrancar ya — es el cuello de botella).

### Fase 4 — Calidad e infraestructura ✅ COMPLETADA (2026-07-02)
1. `scripts/validate-data.mjs` (referencias huérfanas → error; personaje retirado sin ficha → warning
   no bloqueante) + wired en `pnpm build` y en CI antes del build.
2. Vitest + Testing Library: 16 tests — `personajes.service`, `pases.service`, `recorrido.service`
   y los 6 status de `redeemCode` (mock de Supabase, sin red real).
3. Eliminados `apps/api/` (NestJS + dep `openai`), `prisma/`, `HotspotsViewer.tsx`,
   `SimbolismoSection.tsx`, `ScrollProgress.tsx`, campo `palabrasClave` del tipo `Narrativa`.
4. Headers de seguridad en `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`,
   `Referrer-Policy`, `Permissions-Policy` (camera:self para el QrScanner).

### Fase 5 — Contenido y producto (continuo, depende de assets)
1. Reincorporar los 5 personajes retirados cuando tengan retrato + banner. **Bloqueado**: requiere
   fotografías reales del artesano — no se fabrican placeholders para producto físico en venta.
2. Audios reales (`public/audio/[slug]-ambiente.mp3` × 4 — hoy los botones de sonido no suenan).
   **Bloqueado**: requiere grabación real del artesano/ambiente.
3. Fotos reales "en-pase" y "proceso" para galería y recorrido. **Bloqueado**: requiere fotos propias.
4. ✅ **Página de detalle de pase `/pases/[slug]`** (2026-07-02) — implementada como scaffold mínimo:
   solo los campos logísticos que ya existían en `pases.json` (horario, ruta, tipo, imagen, personaje
   destacado con link a su ficha si tiene `personajeSlug`). **Deliberadamente sin** `historia`/
   `testimonios` editoriales — el tipo `Pase` completo los define, pero no hay contenido autorizado
   para escribirlos (no se inventa historia cultural). Nota visible "contenido en preparación" hasta
   que el autor añada `resumen`/`historia` reales al JSON. Enlazada desde las cards de `CalendarioGrid`.
   Ruta i18n añadida en `routing.ts` (`/pases/[slug]` · `/pawkarkuna/[slug]` · `/celebrations/[slug]`).
5. Datos reales de Mercado Santa Rosa y Niño Rey de la Paz + más pases al recorrido. **Bloqueado**:
   requiere coords/fotos propias del autor.
6. Fases restantes de Experiencia v2 (2, 3, 5–12). **Bloqueado**: son fases de diseño abiertas del plan
   de 12 fases del autor — necesitan una decisión de alcance/diseño antes de implementar, no solo assets.

**Orden recomendado:** 0 → 1 → 2 (estas tres son las que afectan al comprador que escanea hoy),
luego 3 y 4 en paralelo con la producción de contenido de la fase 5.
