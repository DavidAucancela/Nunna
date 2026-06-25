#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Nunna — Generador / sembrador de códigos de desbloqueo
//
// Genera N códigos aleatorios de 6 caracteres por personaje y los inserta en la
// tabla `unlock_codes` de Supabase. Imprime un CSV `code,personaje_slug` a stdout
// para enviar a imprenta (cada tarjeta lleva un código distinto).
//
// Requisitos:
//   • Variables de entorno (usar `--env-file`, Node ≥ 20):
//       NEXT_PUBLIC_SUPABASE_URL   (o SUPABASE_URL)
//       SUPABASE_SERVICE_ROLE_KEY  (clave secreta de servicio — NUNCA en el bundle)
//   • Dependencia @supabase/supabase-js (ya instalada en apps/web).
//
// Uso:
//   node --env-file=.env.local scripts/seed-codes.mjs --count 20 --batch lote-2026-06
//   node --env-file=.env.local scripts/seed-codes.mjs --slug aya-uma --count 50 > codes.csv
//   node --env-file=.env.local scripts/seed-codes.mjs --dry-run        # solo imprime, no inserta
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { randomInt } from "node:crypto";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PERSONAJES_PATH = resolve(REPO_ROOT, "apps/web/lib/data/personajes.json");

// @supabase/supabase-js vive en apps/web/node_modules (workspace pnpm), no en la
// raíz. Anclamos la resolución ahí para que el script corra desde cualquier cwd.
const requireFromWeb = createRequire(resolve(REPO_ROOT, "apps/web/package.json"));

// Alfabeto sin caracteres ambiguos (sin I, L, O, 0, 1) — fácil de leer/teclear.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;

// ── CLI ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { count: 20, batch: null, slug: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--count") args.count = parseInt(argv[++i], 10);
    else if (a === "--batch") args.batch = argv[++i];
    else if (a === "--slug") args.slug = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else throw new Error(`Argumento desconocido: ${a}`);
  }
  if (!Number.isInteger(args.count) || args.count < 1) {
    throw new Error("--count debe ser un entero ≥ 1");
  }
  return args;
}

function randomCode() {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

async function main() {
  const args = parseArgs(process.argv);

  const personajes = JSON.parse(readFileSync(PERSONAJES_PATH, "utf8"));
  const slugs = (args.slug ? personajes.filter((p) => p.slug === args.slug) : personajes).map(
    (p) => p.slug,
  );
  if (slugs.length === 0) {
    throw new Error(args.slug ? `No existe el slug "${args.slug}"` : "personajes.json vacío");
  }

  // Generar códigos únicos (dedupe local; la PK de la tabla protege contra colisiones globales).
  const seen = new Set();
  const rows = [];
  for (const slug of slugs) {
    for (let i = 0; i < args.count; i++) {
      let code;
      do {
        code = randomCode();
      } while (seen.has(code));
      seen.add(code);
      rows.push({ code, personaje_slug: slug, batch: args.batch });
    }
  }

  // CSV a stdout (para imprenta).
  console.log("code,personaje_slug");
  for (const r of rows) console.log(`${r.code},${r.personaje_slug}`);

  if (args.dryRun) {
    console.error(`\n[dry-run] ${rows.length} códigos generados (no insertados).`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. " +
        "Usa --env-file o exporta las variables. (O --dry-run para solo generar el CSV.)",
    );
  }

  const { createClient } = requireFromWeb("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { error } = await supabase.from("unlock_codes").insert(rows);
  if (error) throw error;

  console.error(`\n✓ Insertados ${rows.length} códigos en unlock_codes${args.batch ? ` (batch: ${args.batch})` : ""}.`);
}

main().catch((err) => {
  console.error("✗ Error:", err.message ?? err);
  process.exit(1);
});
