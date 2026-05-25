# Seres del Pase

Catálogo digital + experiencia inmersiva sobre los personajes tradicionales de los pases riobambeños — Diablo Huma (Aya Uma), Curiquingue, Sacha Runa, y más.

**Autor:** Jonathan David Aucancela Maguana  
**Stack:** Next.js 15 · NestJS · PostgreSQL · Directus · Supabase

---

## Repositorio

Monorepo con **Turborepo** + **pnpm workspaces**.

```
seres-del-pase/
├── apps/
│   ├── web/        → Next.js 15 (sitio público)
│   └── api/        → NestJS (búsqueda semántica, webhooks)
├── packages/
│   ├── types/      → tipos TypeScript compartidos
│   ├── ui/         → componentes React base
│   └── config/     → ESLint, TSConfig
├── prisma/         → schema de base de datos
└── directus/       → configuración del CMS
```

## Inicio rápido

### Prerrequisitos

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (para Directus local)
- Cuenta en Supabase (gratis)

### Instalación

```bash
# Clonar y preparar
git clone https://github.com/tu-usuario/seres-del-pase.git
cd seres-del-pase

# Variables de entorno
cp .env.example .env.local
# → edita .env.local con tus credenciales de Supabase y Directus

# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev
```

El frontend estará en [http://localhost:3000](http://localhost:3000)  
La API en [http://localhost:3001](http://localhost:3001)  
Directus en [http://localhost:8055](http://localhost:8055)

## Documentación

- [`docs/IMPLEMENTACION.md`](docs/IMPLEMENTACION.md) — guía paso a paso para construir el proyecto
- [`docs/PLAN.md`](docs/PLAN.md) — plan maestro del proyecto
- [`Guia.md`](Guia.md) — guía original completa

## Licencia

- Código: [MIT](LICENSE)
- Contenido cultural: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
