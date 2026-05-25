---
description: Levanta el servidor de desarrollo de Next.js para Seres del Pase y toma un screenshot del resultado
---

# Skill: run-web

Levanta `apps/web` (Next.js 15.1) en modo desarrollo y verifica visualmente que la landing page renderiza correctamente con estilos.

## Pasos

### 1. Verificar que .env.local existe

```bash
ls apps/web/.env.local 2>/dev/null || echo "FALTA .env.local — copia .env.example"
```

Si no existe, crear con valores mínimos:
```bash
cat > apps/web/.env.local << 'EOF'
DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=placeholder
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
EOF
```

### 2. Instalar dependencias (si no están)

```bash
pnpm install
```

### 3. Elegir puerto libre

```bash
# 3030 es el puerto de desarrollo para no chocar con otros proyectos
PORT=3030
```

### 4. Arrancar el servidor en background

```bash
pnpm --filter @seres-del-pase/web dev --port 3030
```

(usar `run_in_background: true`)

### 5. Esperar a que esté listo y verificar

```bash
sleep 10 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3030/es
```

Debe devolver `200`. Si devuelve `500`, revisar los logs del proceso en background.

### 6. Tomar screenshot

```bash
npx playwright screenshot http://localhost:3030/es /tmp/seres-screenshot.png --viewport-size=1440,900
```

Luego leer `/tmp/seres-screenshot.png` con Read para verificar visualmente.

### 7. Páginas a verificar

| URL | Qué verificar |
|-----|---------------|
| `/es` | Hero oscuro, Fraunces serif, botones rojo y gris |
| `/es/personajes` | Header, mensaje "No se encontraron" (sin Directus) o grid de cards |
| `/es/glosario` | Título con "· Kichwa" en dorado |
| `/es/pases` | Título "Pases y Festividades" |

## Errores conocidos y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `@tailwind` en el CSS sin procesar | `postcss` no instalado o config en `.ts` | `pnpm add -D postcss` en `apps/web`; asegurarse que `tailwind.config.js` es `.js` CommonJS |
| `messages={Module}` → Error 500 | `i18n/request.ts` no usa `.default` | En `request.ts`: `(await import(...)).default` |
| Puerto ocupado | Otro proceso en 3000/3001 | Pasar `--port 3030` explícitamente |
| Turbopack incompatible | `experimental.typedRoutes` activo | No usar `--turbopack`; verificar que no está en `next.config.ts` |
| Prisma generate falla | Versión 6/7 en npx vs v5 instalada | Usar `./apps/api/node_modules/.bin/prisma generate --schema=prisma/schema.prisma` |

## Notas adicionales

- El frontend NO necesita Directus para arrancar. Sin Directus, las páginas de listado muestran el estado vacío correcto.
- No usar `--turbopack` — no es compatible con la config actual.
- Tailwind config DEBE ser `tailwind.config.js` (CommonJS), no `.ts`.
