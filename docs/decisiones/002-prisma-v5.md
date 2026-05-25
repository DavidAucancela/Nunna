# ADR-002: Prisma v5 en lugar de v6/v7

**Estado:** Aceptado  
**Fecha:** 2026-05-25

## Contexto

Al instalar `prisma@^6.1.0`, el comando `prisma generate` fallaba porque Prisma v6 eliminó el soporte para `url = env(...)` directamente en la sección `datasource` del schema. Require un archivo `prisma.config.ts` separado.

## Decisión

Usar **Prisma v5.22.0** que soporta el schema estándar con `url = env("API_DATABASE_URL")`.

## Consecuencias

- El schema en `prisma/schema.prisma` funciona sin cambios
- Para ejecutar desde la raíz del monorepo: `./apps/api/node_modules/.bin/prisma <comando> --schema=prisma/schema.prisma`
- NO usar `npx prisma` — npx descarga la versión más reciente (v7+)
- Migrar a v6/v7 cuando el proyecto requiera sus features nuevos
