# Plan — QR único por personaje, ficha abierta y "guardar" opcional

## Contexto

Hoy cada tarjeta trae un **código de 6 caracteres**: la ficha `/personajes/[slug]` está bloqueada en el
navegador (`GatedPageRedirect` → `/desbloquear/[slug]`) hasta canjearlo con cuenta (magic-link). Esto mete
fricción justo en el momento del escaneo. El autor decide:

- **El QR es el punto de entrada**: un QR único por personaje (`/es/personajes/<slug>?origen=qr`), sin código.
- **La ficha queda abierta para todos**: Despertar, Recorrido 3D y Anatomía incluidos, cada vez que se escanea.
- **Al terminar la ficha, un modal invita a crear cuenta y guardar el personaje** (opcional). Solo se ofrece
  si la persona llegó por QR.
- **Guardar da un extra**: el personaje entra a `/mis-personajes` con sus logros, se obtiene un certificado
  del personaje y aparece un sello "Ya es parte de tu colección" en la ficha.
- **Cuenta**: "Continuar con Google" + enlace mágico por correo (el que ya funciona con Resend).
- **Códigos retirados**: fuera la UI, las RPC y `unlock_codes`; **`user_unlocks` se conserva** (2 usuarios
  reales con 6 personajes guardados).
- Se **reimprimen todas las tarjetas** con el QR nuevo. Las viejas abren la ficha pero no ofrecen guardar.
- Las mejoras de diseño y contenido de la ficha quedan **fuera** de este plan (fase aparte).

Limitación aceptada: "solo por QR" es una marca del lado del navegador. Quien conozca `?origen=qr` puede
guardar sin tener el imán. La colección pasa a significar "personajes que conocí escaneando".

Estado de producción (2026-10-05): 216 códigos (`lote-1`, `lote-2-def`, `prueba-2026-09`), 12 canjeados,
2 usuarios, 6 filas en `user_unlocks`.

---

## Fase 0 — Preparación

1. La rama actual `fix/libro-imagen-grupo-toque-movil` tiene 4 commits que no están en `origin/main`
   (fix del lomo en `PersonajesLibro`, que este plan también toca). Abrir su PR y mergearla primero; luego
   crear `refactor/qr-unico-ficha-abierta` desde `main` actualizado. Si no se mergea antes, ramificar desde
   ella.
2. Primer commit de la rama: este plan como `docs/PLAN-QR-UNICO.md` (convención de `docs/PLAN-*.md`).
3. Respaldo: en vez de un CSV local (los códigos no deben quedar en archivos), la tabla `unlock_codes`
   **se renombra** a `unlock_codes_archivo` en la Fase 9 en lugar de borrarse.

## Fase 1 — Supabase, cambios solo aditivos (no rompen la producción actual)

Archivo: `supabase/schema.sql`, más una migración aplicada con el MCP de Supabase (`apply_migration`,
proyecto `dhhesajpexcyainibwvl`).

- **Nueva RPC `save_personaje(p_slug text) returns table(status text, slug text)`**, `SECURITY DEFINER`,
  `grant execute` solo a `authenticated`:
  - sin `auth.uid()` → `not_authenticated`;
  - el slug debe cumplir `^[a-z0-9-]{1,64}$` o devuelve `invalid`;
  - `insert into user_unlocks … on conflict do nothing` → `ok` / `already_yours`.

  `user_unlocks` sigue sin policy de INSERT: el único camino de escritura es la RPC (mismo patrón que
  `redeem_code`). Los slugs desconocidos los filtra el cliente al pintar, como ya hace `ColeccionClient`.
- `count_collectors` se queda tal cual (lo usa `ColeccionCounter`).
- **Pasos manuales del autor, documentados en el plan** (código preparado, botón oculto hasta tenerlos):
  - Google Cloud → OAuth client (web), con redirect URI `https://dhhesajpexcyainibwvl.supabase.co/auth/v1/callback`;
  - Supabase → Auth → Providers → Google: activar y cargar client id y secret;
  - Railway: `NEXT_PUBLIC_AUTH_GOOGLE=1` para mostrar el botón;
  - Supabase Auth → Redirect URLs: confirmar `https://nunna-ecu.com/**` (ya cubre `?origen=qr`).

## Fase 2 — Capa de colección y llegada por QR

**Nuevo `lib/qr-origen.ts`**: funciones puras más un hook.
- `registrarLlegadaQr(slug)`: guarda `nunna:qr:<slug>` = `{ t: Date.now(), descartado: false }` en localStorage.
- `llegadaQrVigente(slug)`: devuelve true si existe y tiene menos de **24 h**.
- `descartarInvitacion(slug)`: marca `descartado: true`. El próximo escaneo crea una marca nueva y el modal
  vuelve a ofrecerse.
- Hook `useLlegadaPorQr(slug)`:
  - al montar, lee `window.location.search` (no `useSearchParams`, para no sacar la página de SSG);
  - si trae `origen=qr`, registra la llegada y hace `history.replaceState` quitando **solo** el query param.
    El `#hash` no se toca, porque ahí vienen los tokens de Supabase al volver del login.
  - Devuelve `{ porQr, descartada, descartar }`.

**`components/auth/ColeccionProvider.tsx`**:
- **Se eliminan**: `CODE_RE`, `RedeemStatus`/`RedeemResult`, `CodeStatus`, `checkCodeValid`,
  `checkCodeStatus`, `redeemCode`, `setPendingCode`/`consumePendingCode` y `useDesbloqueo`.
- **Se agregan**:
  - `guardarPersonaje(slug)` → RPC `save_personaje`. Usa `getUser()` antes de llamar, igual que hacía
    `redeemCode`, y actualiza el set y la cache `nunna:coleccion`.
  - `signInWithGoogle(redirectPath?)` → `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`.
- **`signInWithEmail(email, redirectPath?)`**: reemplaza el parámetro `code`. El destino se arma con la misma
  lógica de base que hoy (`SITE_URL` en producción, `window.location.origin` en desarrollo) más
  `redirectPath`. Para guardar, el destino es la ficha con `?origen=qr`.
- Se extrae un helper `buildRedirectUrl(path)` para Google y para el correo.
- Se renombra `gatingActive` → `authActiva`: ya no hay nada bloqueado, solo indica si Supabase está
  configurado.
- Se agrega el hook `useEnColeccion(slug)` (SSR-safe: `false` hasta `mounted && ready`).
- **Se mantiene** el flujo `setPendingLoginOnly` + `WelcomeModal` de `/login`.

**Auto-guardado**: un efecto en la ficha llama una sola vez a `guardarPersonaje` cuando se cumple a la vez:
- hay sesión;
- `llegadaQrVigente(slug)`;
- el personaje no está en la colección.

Cubre dos casos con un solo mecanismo:
- (a) el usuario ya tenía sesión y escanea;
- (b) vuelve del login con Google o del enlace del correo. El `redirectTo` es la ficha con `?origen=qr`, así
  que funciona aunque el correo se abra en otro navegador o dispositivo.

## Fase 3 — Ficha abierta (`app/[locale]/personajes/[slug]/page.tsx`)

- Fuera `<GatedPageRedirect>`.
- `HeroGated` → nuevo `HeroPersonaje`: `experiencia ? <HeroDespertar/> : <ParallaxHero/>`, sin candado ni CTA.
- `PaseInmersivoGated` → `<PaseInmersivo>` directo cuando existe `recorridoPersonaje`.
- `PersonajeVisualSection`: `AnatomiaGated` → `<AnatomiaSection>` directo.
- **SSR**: ya es seguro. Estos componentes se renderizan en el servidor hoy cuando falta Supabase (dev), y
  `AnatomiaSection` ya hidrata localStorage en un efecto, no en el inicializador.
- **Se borran**: `GatedPageRedirect.tsx`, `HeroGated.tsx`, `AnatomiaGated.tsx` y `PaseInmersivoGated.tsx`.
- **Nuevo `GuardarPersonaje.tsx`**, client, en `modules/coleccion/components/`. Agrupa:
  - **Sello**: en la zona de `WhatsAppShare`/`ColeccionCounter` (hijos de `QuoteRevelacion`). Si
    `useEnColeccion(slug)` → "✦ {nombre} ya es parte de tu colección · Ver certificado · Mi colección". Si
    hay llegada por QR, no está guardado y el modal se descartó → enlace discreto "Guardar en mi colección"
    que reabre el modal (evita un callejón sin salida tras cerrarlo).
  - **Centinela** al final de la ficha (justo antes del cross-sell "Conoce a los otros seres"), con
    IntersectionObserver. Al verse, abre el modal si se cumplen todas estas condiciones: `authActiva`, sin
    sesión, `llegadaQrVigente`, no está guardado y no fue descartado.
  - **Auto-guardado** de la Fase 2 y su celebración.

## Fase 4 — Modal "Guarda a {nombre}"

**Nuevo `modules/coleccion/components/InvitacionGuardarModal.tsx`**. Sigue el patrón de `WelcomeModal` y
`CertificadoColeccion`: `role="dialog"`, `aria-modal`, Escape y foco atrapado; mobile-first como bottom sheet.

- **Contenido**: portada del personaje, el título "Guarda a {nombre} en tu colección" y los 3 beneficios
  (colección + logros, certificado, sello).
- **Formulario de acceso compartido**, nuevo `modules/auth/components/AuthOpciones.tsx`:
  - "Continuar con Google", visible solo si `NEXT_PUBLIC_AUTH_GOOGLE === "1"`;
  - separador;
  - correo con "Enviarme el enlace", que muestra el estado "Revisa tu correo";
  - errores `rate_limited`, `not_configured` y genérico, con las mismas cadenas que hoy.

  `LoginForm.tsx` pasa a usar `AuthOpciones` para no duplicar el formulario.
- **"Ahora no"** → `descartarInvitacion(slug)`.
- **Al guardar con éxito** (vuelta del login o auto-guardado con sesión):
  - se reutiliza `DespertarAnimation`, que ilumina el grid de la colección;
  - después, una tarjeta de éxito con "Ver mi certificado" (abre `CertificadoColeccion` con el personaje) y
    "Ver mi colección" (`/mis-personajes`).
  - Ya no navega a ninguna parte: la persona sigue en la ficha.

## Fase 5 — Colección, certificado y piezas que dependían del bloqueo

- **Se mueve `modules/desbloqueo/` → `modules/coleccion/`**: `ColeccionClient`, `CertificadoColeccion` y
  `DespertarAnimation`. `PersonajeLite` sale de `DesbloquearForm.tsx` a `modules/coleccion/types.ts`.
  Se actualizan los imports de `app/[locale]/mis-personajes/page.tsx`.
- **`CertificadoColeccion`**: se agrega `tipo: "personaje"`, un certificado de un solo personaje con la paleta
  de su origen (`getOrigenStyle`). Se abre desde el sello de la ficha, la tarjeta de éxito y cada personaje en
  `/mis-personajes`.
- **`ColeccionClient`**: el estado vacío cambia "desbloquear" por "Escanea el QR de tu imán para guardarlo";
  se agrega el botón de certificado por personaje. Los logros quedan igual (derivados).
- **`PersonajesLibro.tsx`**: fuera `isLocked` y el CTA a `/desbloquear/[slug]`. Todos los lomos llevan a la
  ficha; los guardados muestran una marca "✓ En tu colección". Se conserva el fix del toque en móvil
  (`onPointerEnter` con mouse y `:focus-visible`).
- **`Header.tsx`**: sin cambio funcional ("Mis personajes" con sesión). Solo el rename `authActiva`.
- **`modules/home/components/ProductoSection.tsx`**: el paso 03 "código de desbloqueo" se reescribe como
  "Guárdalo en tu colección (opcional)". Se ajusta también la copia de la línea 225.

## Fase 6 — Retiro del sistema de códigos

- **Se borran**: `app/[locale]/desbloquear/`, `DesbloquearForm.tsx`, `DesbloqueoHero.tsx`,
  `scripts/seed-codes.mjs`, y el `/desbloquear/[slug]` de `i18n/routing.ts`.
- **`next.config.ts`**: redirects 308 `/es/desbloquear/:slug` → `/es/personajes/:slug` y
  `/en/unlock/:slug` → `/en/characters/:slug`, con el mismo patrón que `/mapa` y `/calendario`.
- **i18n (`messages/es.json` y `en.json`)**:
  - se borra el namespace `desbloquear`;
  - de `coleccion` salen `desbloquear_cta`, `bloqueado` y `bloqueado_hint`;
  - nuevo namespace `guardar`: invitación, beneficios, Google, correo, éxito, sello, "Ahora no".
- **Comentarios**: limpiar las menciones a `/desbloquear` en `app/sitemap.ts`. `robots.ts` queda igual.
- **`supabase/schema.sql`**: queda en su estado final, sin `unlock_codes`, `redeem_code`,
  `check_code_valid` ni `check_code_status`.

## Fase 7 — QR nuevos

`scripts/generate-qr.mjs`:
- la URL pasa a `${SITE_URL}/es/personajes/${slug}?origen=qr`;
- el fallback de `SITE_URL` cambia a `https://nunna-ecu.com`, el dominio propio ya activo;
- se mantiene `errorCorrectionLevel: "H"`.

Se regeneran los 6 PNG de `apps/web/public/qr/` y se escanea cada uno con un teléfono real antes de mandar a
imprenta.

## Fase 8 — Documentación

- **`CLAUDE.md`**:
  - flujo del comprador;
  - la decisión técnica "Desbloqueo de imanes", reescrita como "QR único + colección opcional";
  - estructura de archivos (`modules/coleccion`, sin `/desbloquear`);
  - comandos (sin `seed-codes`);
  - la nota del contrato QR, que ahora incluye `?origen=qr`.
- **Otros documentos**: `docs/AGREGAR-PERSONAJE.md` (fuera la siembra de códigos), `docs/GUIA-DOMINIO-QR.md`
  §5–6 y `docs/CHANGELOG.md`.
- **Memoria y grafo**: actualizar la memoria `project_modelo_negocio.md` y correr `graphify update .`.

## Fase 9 — Despliegue (el orden importa)

1. Aplicar la migración aditiva de la Fase 1 (`save_personaje`). La producción actual no se entera.
2. Merge y deploy del front en Railway. Verificar en `https://nunna-ecu.com`.
3. **Con confirmación explícita del autor**, migración destructiva: `drop function redeem_code`,
   `check_code_valid` y `check_code_status`, y `alter table unlock_codes rename to unlock_codes_archivo`.
   `user_unlocks` no se toca.
4. Configurar Google (pasos manuales de la Fase 1) → `NEXT_PUBLIC_AUTH_GOOGLE=1` → redeploy.

---

## Verificación

- **Tests (vitest)**:
  - reescribir `ColeccionProvider.test.tsx`: `guardarPersonaje` (ok, already_yours, not_authenticated,
    error de red); `signInWithEmail` y `signInWithGoogle` arman el `redirectTo` con la ficha y `?origen=qr`;
  - nuevo `lib/qr-origen.test.ts`: registro, vigencia de 24 h, descarte, y que el nuevo escaneo reinicia.
- **Chequeos**: `pnpm --filter @seres-del-pase/web type-check`, `lint`, `test`, `pnpm validate-data` y
  `pnpm build` (las fichas siguen siendo SSG).
- **Manual en móvil** con Playwright emulando táctil (`isMobile` + `hasTouch`) y en un teléfono real por LAN,
  `next dev --port 3030` con las envs de Supabase:
  1. `/es/personajes/aya-uma?origen=qr` sin sesión → la URL queda limpia, la ficha completa sin redirect, el
     modal al llegar al cross-sell, y "Ahora no" no vuelve hasta reescanear.
  2. Enlace por correo abierto en otro navegador → vuelve a la ficha, se guarda solo y se ve el sello. El
     certificado del personaje se descarga.
  3. Con sesión, escanear otro personaje → se guarda sin modal y aparece en `/mis-personajes` con logros.
  4. `/es/personajes/aya-uma` sin `?origen=qr` → ficha completa, sin modal ni opción de guardar.
  5. `/es/desbloquear/aya-uma` → 308 a la ficha.
  6. Sin envs de Supabase → ficha completa, sin modal ni errores.
- **Producción**:
  - los 2 usuarios existentes siguen viendo su colección;
  - `view-source` de la ficha intacto (SEO);
  - escanear con un teléfono real los 6 QR regenerados.
