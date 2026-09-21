# Nunna

A digital catalog of Ecuadorian festival characters, sold as handmade fridge magnets. Each magnet comes with a card: the character on the front, a QR code on the back.

**Live:** [nunna-ecu.com](https://nunna-ecu.com) · **Author:** Jonathan David Aucancela Maguana

## How it works

1. The buyer scans the QR and lands on `/es/personajes/<slug>`.
2. They enter the 6-character code printed under the card (magic-link login, no passwords) to **unlock** the character. Unlocked characters are saved to their account.
3. The unlocked page is the digital product: story, an interactive anatomy of the costume, gallery, and links to the other characters.

> The QR URL is a permanent contract: printed magnets can't be reprinted. Never rename a slug without adding an alias in `apps/web/lib/data/slug-aliases.ts`.

## What's inside

- **6 characters:** Aya Uma, Payaso, Perro, Diablos de lata, Cucurucho, Danzante de Yaruquíes.
- **`/pases`:** national map of Ecuador (MapLibre), festival calendar and per-province routes.
- **`/mis-personajes`:** the user's collection, progress and achievements.
- Spanish and English, mobile-first, rich OpenGraph previews for WhatsApp.

## Stack

Next.js 15.5 (App Router) · TypeScript · Tailwind CSS v3 · next-intl · framer-motion · MapLibre GL · Supabase (auth and collection only) · Railway · Turborepo + pnpm.

Content is static JSON in `apps/web/lib/data/` (no CMS, no custom backend). Pages are statically generated.

## Getting started

Requires Node.js ≥ 20 and pnpm ≥ 9.

```bash
pnpm install
pnpm --filter @seres-del-pase/web dev --port 3030   # http://localhost:3030/es
```

- Without the Supabase variables in `apps/web/.env.local`, unlock gating is off and everything is visible, which is handy in dev.
- Run **one** dev server at a time: they share `apps/web/.next` and will corrupt each other's chunks.

```bash
pnpm build          # validates data, then builds
pnpm type-check
pnpm lint
pnpm test           # vitest
pnpm validate-data  # cross-references between the JSON files
```

## Repository

```
apps/web/     Next.js site (the only production service)
packages/     shared types, UI, utils, config
scripts/      route baking, QR generation, unlock-code seeding, data validation
supabase/     schema.sql for auth + collection
docs/         plans, changelog, runbooks (docs/AGREGAR-PERSONAJE.md to add a character)
```

For architecture, decisions and current status, read [`CLAUDE.md`](CLAUDE.md). History is in [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

## License

Code: [MIT](LICENSE) · Cultural content: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
