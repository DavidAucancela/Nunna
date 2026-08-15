# Resend como SMTP de Supabase Auth

Arregla el "enlace que se envía" (magic-link de `/desbloquear`, `ColeccionProvider.signInWithEmail`):
hoy sale por el SMTP compartido de Supabase, que tiene rate-limit bajo (pocos correos/hora), mala
reputación de IP (cae en spam seguido) y cero branding. Esto lo reemplaza por **Resend como SMTP
custom** — el flujo de código (`ColeccionProvider.tsx`, `DesbloquearForm.tsx`, RPC `redeem_code`) no
cambia nada: sigue siendo `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`.

No se toca ningún archivo de `apps/web/` — todo el cambio vive en la configuración de Supabase Auth
y en las plantillas de correo de este directorio (`email-templates/`).

## Por qué SMTP custom y no un Auth Hook

Supabase también permite un [Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
(una Edge Function que reemplaza el envío entero, con más control: React Email, múltiples proveedores,
headers custom). Es más código y más piezas (verificación de firma del webhook, secretos de Edge
Function) para un beneficio que el SMTP custom ya cubre aquí: control total del HTML/subject vía las
plantillas de Auth del dashboard. Si en el futuro hace falta lógica que el SMTP no puede dar
(fallback entre proveedores, distinto proveedor por región, adjuntos), migrar a un hook — no antes.

## 1. Resend — dominio + credenciales

1. Crear cuenta en [resend.com](https://resend.com) (hay plan gratuito, suficiente para el volumen
   de este proyecto).
2. **Add Domain** → `nunna-ecu.com`. Resend genera registros DNS (SPF, DKIM, y opcionalmente DMARC).
   Agregarlos en el proveedor DNS donde vive `nunna-ecu.com` (no en Railway — Railway solo apunta el
   dominio a la app, el DNS de dominio se administra donde se compró/gestiona el dominio).
3. Esperar a que el dominio quede **Verified** en Resend (puede tardar de minutos a un par de horas
   según el TTL de los registros).
4. **API Keys** → crear una con permiso de envío (`Sending access`). Esta clave es la contraseña SMTP.
   ⚠ No pegarla en el chat de un agente ni commitearla — solo va en el dashboard de Supabase (paso 2)
   o en un secret manager.

## 2. Supabase — SMTP custom

Dashboard del proyecto `NunnaDB` (`dhhesajpexcyainibwvl`) → **Authentication → Sign In / Providers →
SMTP Settings** (o `/project/dhhesajpexcyainibwvl/settings/auth` → sección SMTP):

| Campo | Valor |
|---|---|
| Enable Custom SMTP | ✅ |
| Sender email | `no-reply@nunna-ecu.com` |
| Sender name | `Nunna` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `<tu API key de Resend>` |

Guardar. Supabase valida la conexión al guardar — si falla, casi siempre es el dominio aún no
verificado en Resend (paso 1.3) o un typo en el host/puerto.

**Rate limit:** al activar SMTP custom, Supabase sube el límite por defecto a 30 correos/hora
(**Authentication → Rate Limits → Emails sent**). Para el volumen actual (desbloqueos individuales)
es más que suficiente; subirlo solo si hay una campaña de lanzamiento con muchos desbloqueos a la vez.

## 3. Plantillas de correo (branding Nunna)

Dashboard → **Authentication → Email Templates**. Dos plantillas a actualizar (mismo diseño en
ambas — paleta oscura + dorado del sitio, sin imágenes remotas, un solo CTA, sin lenguaje de
marketing, siguiendo las [buenas prácticas de deliverability de Supabase](https://supabase.com/docs/guides/auth/auth-smtp#dealing-with-abuse-how-to-maintain-the-sending-reputation-of-your-smtp-server)):

- **Magic Link** → subject `Tu enlace de acceso — Nunna`, body = contenido de
  [`email-templates/magic-link.html`](email-templates/magic-link.html) (copiar y pegar tal cual).
- **Confirm signup** → subject `Confirma tu correo — Nunna`, body =
  [`email-templates/confirm-signup.html`](email-templates/confirm-signup.html). Se usa para el
  primer correo de una cuenta que nunca existió (algunas versiones de Supabase la disparan en vez de
  "Magic Link" la primera vez); mismo flujo passwordless, no crea una cuenta con contraseña.

No hace falta tocar las demás plantillas (Recovery, Invite, Email Change) — este proyecto no las usa
(no hay passwords ni invitaciones).

⚠ Las plantillas usan `{{ .ConfirmationURL }}` (no `{{ .Token }}` ni `{{ .TokenHash }}`) — coincide
con el flujo actual del código (`ColeccionProvider.signInWithEmail` arma `emailRedirectTo` con
`?unlock_code=` y depende de que Supabase redirija ahí tras verificar el link). No cambiar a la
variante `token_hash` sin also cambiar el código cliente — son dos flujos distintos.

## 4. Verificar

1. En `/es/desbloquear/[slug]` (o cualquier ficha gated), pedir un enlace con un correo real.
2. Confirmar que llega desde `no-reply@nunna-ecu.com` (no `noreply@mail.app.supabase.io`), con el
   diseño de esta plantilla, y no en spam.
3. Abrir el enlace y confirmar que aterriza en `/es/personajes/[slug]` con el personaje desbloqueado
   (mismo comportamiento de siempre — ver `handleResult`/auto-canje en `DesbloquearForm.tsx`).

## Alternativa: Management API (automatizar el paso 2)

Si se prefiere no tocar el dashboard, el mismo cambio de SMTP se puede aplicar con la Management API
de Supabase — **correrlo tú mismo** (no pegar el `SUPABASE_ACCESS_TOKEN` ni el API key de Resend en
un chat):

```bash
export SUPABASE_ACCESS_TOKEN="<tu personal access token de supabase.com/dashboard/account/tokens>"
export RESEND_API_KEY="<tu api key de Resend>"

curl -X PATCH "https://api.supabase.com/v1/projects/dhhesajpexcyainibwvl/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "smtp_admin_email": "no-reply@nunna-ecu.com",
    "smtp_host": "smtp.resend.com",
    "smtp_port": 465,
    "smtp_user": "resend",
    "smtp_pass": "'"$RESEND_API_KEY"'",
    "smtp_sender_name": "Nunna"
  }'
```

Las plantillas de correo (paso 3) no tienen un endpoint estable documentado para automatizar — usar
el dashboard para esas.
