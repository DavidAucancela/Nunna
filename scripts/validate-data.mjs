#!/usr/bin/env node
/**
 * validate-data.mjs — Integridad referencial de los JSON en apps/web/lib/data/.
 *
 * No hay CMS ni base de datos que valide relaciones entre archivos: un slug
 * renombrado o un personaje retirado deja referencias huérfanas que fallan en
 * silencio (así se coló el caso real de "Rey Moro"/"Curiquingue" en pases.json,
 * 2026-06-29 → 2026-07-01). Este script corre en CI antes del build.
 *
 * Uso:  node scripts/validate-data.mjs
 * Sale con código 1 si encuentra errores (bloquea el build en CI).
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../apps/web/lib/data");

async function loadJson(name) {
  const raw = await readFile(resolve(DATA_DIR, name), "utf-8");
  return JSON.parse(raw);
}

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const [personajes, pases, recorrido, glosario] = await Promise.all([
  loadJson("personajes.json"),
  loadJson("pases.json"),
  loadJson("recorrido.json"),
  loadJson("glosario.json"),
]);

const personajeSlugs = new Set(personajes.map((p) => p.slug));
const paseSlugs = new Set(pases.map((p) => p.slug));

// ── personajes.json ─────────────────────────────────────────────────────────
{
  const seen = new Set();
  for (const p of personajes) {
    if (!p.slug) err(`personajes.json: entrada sin slug (id=${p.id ?? "?"})`);
    if (seen.has(p.slug)) err(`personajes.json: slug duplicado "${p.slug}"`);
    seen.add(p.slug);
    if (p.experiencia && !p.imagenPortada) {
      err(`personajes.json: "${p.slug}" tiene experiencia:true sin imagenPortada`);
    }
    for (const h of p.hotspots ?? []) {
      if (typeof h.x !== "number" || typeof h.y !== "number") {
        err(`personajes.json: "${p.slug}" hotspot "${h.id}" sin coords x/y numéricas`);
      }
    }
  }
}

// ── pases.json → personajeSlug debe existir en personajes.json ────────────
for (const p of pases) {
  if (p.personajeSlug && !personajeSlugs.has(p.personajeSlug)) {
    err(`pases.json: "${p.slug}" referencia personajeSlug "${p.personajeSlug}" que no existe en personajes.json`);
  }
  if (p.personaje && !p.personajeSlug) {
    // No es error: puede ser un personaje retirado temporalmente (sin ficha aún).
    warn(`pases.json: "${p.slug}" tiene "personaje" (${JSON.stringify(p.personaje)}) sin "personajeSlug" — no se cruzará con la ficha hasta que se le asigne`);
  }
}

// ── recorrido.json → paseSlug y waypoints.personajeSlug ────────────────────
for (const rp of recorrido.pases ?? []) {
  if (!paseSlugs.has(rp.paseSlug)) {
    err(`recorrido.json: paseSlug "${rp.paseSlug}" no existe en pases.json`);
  }
  for (const wp of rp.waypoints ?? []) {
    if (wp.personajeSlug && !personajeSlugs.has(wp.personajeSlug)) {
      err(`recorrido.json (${rp.paseSlug}): waypoint referencia personajeSlug "${wp.personajeSlug}" que no existe en personajes.json`);
    }
  }
}
if (recorrido.defaultPaseSlug && !recorrido.pases?.some((rp) => rp.paseSlug === recorrido.defaultPaseSlug)) {
  err(`recorrido.json: defaultPaseSlug "${recorrido.defaultPaseSlug}" no está entre pases[]`);
}

// ── glosario.json — solo estructura mínima ──────────────────────────────────
{
  const seen = new Set();
  for (const g of glosario) {
    if (!g.id || !g.palabra) err(`glosario.json: entrada incompleta (id=${g.id ?? "?"})`);
    if (seen.has(g.id)) err(`glosario.json: id duplicado "${g.id}"`);
    seen.add(g.id);
  }
}

if (warnings.length > 0) {
  console.warn(`⚠ validate-data: ${warnings.length} advertencia(s)\n`);
  for (const w of warnings) console.warn(`  - ${w}`);
  console.warn("");
}

if (errors.length > 0) {
  console.error(`✗ validate-data: ${errors.length} error(es)\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `✓ validate-data: ${personajes.length} personajes, ${pases.length} pases, ` +
    `${recorrido.pases?.length ?? 0} recorridos, ${glosario.length} entradas de glosario — sin errores`,
);
