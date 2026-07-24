# Nunna

Catálogo digital de personajes ecuatorianos con imanes artesanales como producto físico. El comprador escanea el QR de la tarjeta del imán y aterriza directo en la ficha completa del personaje.

**Autor:** Jonathan David Aucancela Maguana
**Stack:** Next.js 15.5 (App Router) · TypeScript · Tailwind CSS v3 · next-intl · Supabase
**En producción:** [nunna-ecu.com](https://nunna-ecu.com) (Railway)

---

## Repositorio

Monorepo con **Turborepo** + **pnpm workspaces**. Solo `apps/web` está activo — sin CMS, sin backend propio; los datos viven en JSON versionado en el repo.

```
Nunna/
├── apps/
│   └── web/        → Next.js 15.5 (sitio público, único servicio en producción)
├── packages/
│   ├── types/       → tipos TypeScript compartidos
│   ├── ui/          → componentes React base
│   ├── utils/       → helpers (fechas, formatos) — sin consumidores activos hoy
│   ├── database/    → stub reservado para búsqueda semántica (descartada, ver CLAUDE.md)
│   └── config/      → ESLint, TSConfig
└── supabase/        → schema.sql (auth + colección para el desbloqueo de imanes)
```

## Inicio rápido

### Prerrequisitos

- Node.js ≥ 20
- pnpm ≥ 9

### Instalación

```bash
git clone <repo>
cd Nunna
pnpm install

pnpm --filter @seres-del-pase/web dev --port 3030
```

Frontend en [http://localhost:3030/es](http://localhost:3030/es). No se necesitan variables de entorno para desarrollo — los datos vienen del JSON. Sin las variables de Supabase (`apps/web/.env.local`), el gating del desbloqueo de imanes queda apagado (todo visible), que es lo cómodo en dev.

### Comandos frecuentes

```bash
pnpm build                                          # build de producción (valida datos + SSG)
pnpm --filter @seres-del-pase/web type-check        # tsc --noEmit
pnpm --filter @seres-del-pase/web test              # vitest
pnpm validate-data                                  # integridad de referencias entre los JSON
```

## Documentación

- [`CLAUDE.md`](CLAUDE.md) — modelo de negocio, arquitectura, decisiones técnicas y estado actual (fuente principal para trabajar en el repo)
- [`docs/PLAN-ESCALA-ECUADOR.md`](docs/PLAN-ESCALA-ECUADOR.md) — plan de escalado de Riobamba a personajes de todo Ecuador
- [`docs/PLAN-V3.md`](docs/PLAN-V3.md) — auditoría y plan de mejoras (bugs, performance, SEO)
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — historial de cambios
- [`docs/decisiones/`](docs/decisiones) — ADRs (Tailwind v3, Prisma v5, Supabase vs Railway Postgres)

## Licencia

- Código: [MIT](LICENSE)
- Contenido cultural: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
