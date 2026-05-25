# ADR-001: Tailwind CSS v3 en lugar de v4

**Estado:** Aceptado  
**Fecha:** 2026-05-25

## Contexto

El plan original especificaba "Tailwind CSS v4" como parte del stack. Al intentar levantarlo con Next.js 15.1 en un monorepo pnpm, el sistema de content detection de v4 no generó ninguna utility class. La capa `@layer utilities` quedaba vacía a pesar de configurar `@source` directives.

## Decisión

Usar **Tailwind CSS v3.4** con PostCSS estándar.

## Consecuencias

- Requiere `tailwind.config.js` en CommonJS (no TypeScript) — PostCSS no puede cargar configs `.ts`
- Requiere `postcss` como dependencia directa en `apps/web` (no viene solo con Next.js)
- La configuración es `@tailwind base; @tailwind components; @tailwind utilities;` en el CSS global
- Cuando Tailwind v4 madure su soporte para monorepos pnpm + Next.js, se puede migrar
