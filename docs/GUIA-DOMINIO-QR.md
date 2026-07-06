# Guía: dominio propio (`nunna-ecu.com`) → QR de las tarjetas

Contexto: el QR impreso en cada tarjeta codifica una URL completa (dominio + ruta). Hoy corre en
el subdominio autogenerado de Railway (`nunnaec-production.up.railway.app`). Antes de imprimir
tarjetas a escala hay que pasar a un dominio propio — si más adelante cambia el hosting o se
renombra el proyecto de Railway, el subdominio autogenerado se rompe y **todos los imanes ya
vendidos dan 404 sin forma de arreglarlo**. Un dominio propio con DNS en Cloudflare no depende del
nombre interno del proyecto en Railway.

Ya compraste `nunna-ecu.com` en Cloudflare e hiciste la configuración básica en Railway. Esto es lo
que falta, en orden.

---

## 1. Verificar el dominio en Railway

1. Railway → proyecto → servicio `web` → pestaña **Settings** → **Networking** → **Custom Domain**.
2. Si ya agregaste `nunna-ecu.com` ahí, Railway te muestra un registro DNS pendiente (normalmente un
   **CNAME** apuntando a algo tipo `xxxx.up.railway.app`, a veces un **A/AAAA** si es el dominio raíz).
3. Decide qué host va a servir el sitio:
   - `nunna-ecu.com` (raíz/apex) — requiere que Railway soporte apex (usan `ALIAS`/`ANAME` o A record que ellos indiquen).
   - `www.nunna-ecu.com` — más simple con CNAME puro.
   - Recomendado para el QR: **usar el apex sin `www`** (`nunna-ecu.com`) — más corto en la tarjeta y más fácil de escribir a mano si alguien teclea la URL.

## 2. DNS en Cloudflare

En el dashboard de Cloudflare, zona `nunna-ecu.com` → **DNS** → **Records**:

- Agrega exactamente el registro que Railway te mostró en el paso 1 (nombre + tipo + valor).
- **Proxy status: DNS only (nube gris), no naranja**, mientras confirmas que Railway emite el
  certificado TLS del dominio. Si Cloudflare proxea (nube naranja) antes de que Railway valide el
  dominio, la emisión del certificado puede fallar o quedar detrás del proxy de Cloudflare de forma
  no deseada.
- Si quieres `www.nunna-ecu.com` como alias que redirige al apex (o viceversa), eso se resuelve
  después con una regla de Cloudflare (Redirect Rule) o repitiendo el registro en Railway — no antes.
- Espera propagación (minutos, rara vez horas) y confirma en el dashboard de Railway que el dominio
  pasa a **Active** con el candado de TLS.

Verifica desde terminal:
```bash
dig nunna-ecu.com +short
curl -I https://nunna-ecu.com
```

## 3. Variable de entorno `NEXT_PUBLIC_SITE_URL`

Esta variable (`apps/web/lib/site-url.ts`) controla `metadataBase`, el sitemap, robots.txt y
**toda URL absoluta que genera la app** (incluida la que usarías para armar el QR).

En Railway → servicio `web` → **Variables**:
```
NEXT_PUBLIC_SITE_URL=https://nunna-ecu.com
```
Guardar redeploya automáticamente. No se toca código — el fallback en `site-url.ts` sigue apuntando
al dominio de Railway solo para cuando falta la variable (dev/preview).

Después del deploy, confirma que las metatags usan el dominio nuevo:
```bash
curl -s https://nunna-ecu.com/es/personajes/aya-uma | grep -o 'og:url" content="[^"]*"'
```

## 4. Supabase Auth — redirect URLs del magic-link

El desbloqueo de imanes usa magic-link (`signInWithOtp`). Supabase solo permite redirigir a URLs
en su allow-list.

Supabase Dashboard → proyecto → **Authentication** → **URL Configuration**:
- **Site URL**: `https://nunna-ecu.com`
- **Redirect URLs**: agrega `https://nunna-ecu.com/**` (mantén también la URL de Railway mientras
  ambos dominios convivan, por si hay pruebas o el redeploy tarda).

Sin este paso, el correo del magic-link seguirá enviando a la gente al dominio viejo de Railway
aunque `NEXT_PUBLIC_SITE_URL` ya esté actualizado — son configuraciones independientes.

## 5. Probar el flujo completo antes de generar los QR

No generes ni imprimas nada todavía. Verifica en `https://nunna-ecu.com` (no en Railway):

- [ ] `/es/personajes/aya-uma` carga la ficha completa
- [ ] Preview de WhatsApp/OG se ve bien (comparte el link o usa un validador de OG)
- [ ] `/desbloquear` → pedir magic-link → el correo llega con `nunna-ecu.com` en el enlace
- [ ] Canjear un código de prueba → redirige a `/personajes/[slug]` en el dominio nuevo, no en Railway
- [ ] `/sitemap.xml` y `/robots.txt` muestran URLs con `nunna-ecu.com`

## 6. Generar los QR para las tarjetas

El QR debe codificar, para cada personaje activo:
```
https://nunna-ecu.com/es/personajes/<slug>
```
Slugs activos hoy (`apps/web/lib/data/personajes.json`): `aya-uma`, `payaso`, `perro`,
`diablos-de-lata`.

Ya existen dos PNG sueltos en `apps/web/public/qr/` (`qr_aya_uma.png`, `qr_diablos_de_lata.png`)
generados a mano y **apuntando todavía al dominio de Railway** — hay que regenerarlos con el
dominio nuevo. Para no depender de una herramienta externa, un script chico deja el proceso
repetible y versionado:

```bash
pnpm add -D -w qrcode
```

`scripts/generate-qr.mjs`:
```js
import QRCode from "qrcode";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nunna-ecu.com";
const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/public/qr"
);

const personajes = JSON.parse(
  await (await import("node:fs/promises")).readFile(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../apps/web/lib/data/personajes.json"),
    "utf-8"
  )
);

for (const { slug } of personajes) {
  const url = `${SITE_URL}/es/personajes/${slug}`;
  const dest = path.join(OUT_DIR, `qr-${slug}.png`);
  await QRCode.toFile(dest, url, {
    width: 1024, // resolución alta para imprenta, no para pantalla
    margin: 2,
    errorCorrectionLevel: "H", // tolera bien el desgaste/roce del imán físico
  });
  console.log(`${slug} → ${url} → ${dest}`);
}
```

Correr:
```bash
node scripts/generate-qr.mjs
```

Esto regenera los PNG en `apps/web/public/qr/` con el dominio correcto y a resolución de imprenta
(1024px, corrección de errores alta — importante porque el QR va en una tarjeta física que se
roza/dobla). Borra los dos PNG viejos que apuntan a Railway antes de mandar a imprimir.

## 7. Antes de mandar a imprenta

- [ ] Escanea cada QR generado con el celular y confirma que abre la ficha correcta en
      `nunna-ecu.com` (no en `localhost` ni en Railway)
- [ ] Prueba el escaneo en baja luz / con el imán a distancia de tarjeta (no solo en pantalla)
- [ ] Confirma que el código de 6 caracteres impreso bajo el QR corresponde al mismo personaje
      (`scripts/seed-codes.mjs` genera el CSV `code,personaje_slug` — cruza contra el slug del QR)
- [ ] Imprime una tarjeta de prueba física (no solo el PDF en pantalla) y escanéala

## 8. Después de imprimir

Actualizar `CLAUDE.md`:
- Tabla de infraestructura → dominio propio en vez de "Único servicio activo" en Railway
- Sección "QR — contrato de URL permanente" → marcar que el riesgo de dominio autogenerado ya no
  aplica; el contrato pasa a ser `https://nunna-ecu.com/[locale]/personajes/<slug>`
- **A partir de aquí, el dominio también es inmutable** — mismo principio que los slugs: no se
  puede transferir el dominio a otra cuenta/registrador de forma que rompa el DNS sin planear antes
  redirects, y nunca se debe dejar expirar mientras haya tarjetas en circulación.
