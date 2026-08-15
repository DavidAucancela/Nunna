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

async function loadJsonOptional(name) {
  try {
    return await loadJson(name);
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

const [personajes, pases, recorrido, provincias] = await Promise.all([
  loadJson("personajes.json"),
  loadJson("pases.json"),
  loadJson("recorrido.json"),
  loadJson("provincias.json"),
]);

// Generado por scripts/build-provincias-geojson.mjs — puede no existir aún.
const provinciasGeo = await loadJsonOptional("provincias.geo.json");

const personajeSlugs = new Set(personajes.map((p) => p.slug));
const paseSlugs = new Set(pases.map((p) => p.slug));
const provinciaSlugs = new Set(provincias.map((p) => p.slug));

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

// ── provincias.json (catálogo) ──────────────────────────────────────────────
{
  const REGIONES = new Set(["sierra", "costa", "amazonia", "insular"]);
  const seen = new Set();
  for (const p of provincias) {
    if (!p.slug) err(`provincias.json: entrada sin slug (nombre=${p.nombre ?? "?"})`);
    if (seen.has(p.slug)) err(`provincias.json: slug duplicado "${p.slug}"`);
    seen.add(p.slug);
    if (!REGIONES.has(p.region)) {
      err(`provincias.json: "${p.slug}" tiene region "${p.region}" fuera del enum (${[...REGIONES].join("|")})`);
    }
  }
  if (provincias.length !== 24) {
    err(`provincias.json: se esperan las 24 provincias del Ecuador, hay ${provincias.length}`);
  }
}

// ── pases.json → provincia debe existir en provincias.json ──────────────────
for (const p of pases) {
  if (!p.provincia) {
    warn(`pases.json: "${p.slug}" no declara "provincia" — no aparecerá en el mapa nacional`);
  } else if (!provinciaSlugs.has(p.provincia)) {
    err(`pases.json: "${p.slug}" referencia provincia "${p.provincia}" que no existe en provincias.json`);
  }
}

// ── provincias.geo.json → toda provincia marcable debe tener figura dibujable ─
if (provinciasGeo) {
  const geoSlugs = new Set((provinciasGeo.features ?? []).map((f) => f.properties?.slug));
  for (const slug of geoSlugs) {
    if (!provinciaSlugs.has(slug)) {
      err(`provincias.geo.json: figura "${slug}" no existe en provincias.json`);
    }
  }
  // Una provincia con pases pero sin figura es un bug visual silencioso (el
  // mapa nacional no podría pintarla ni encuadrarla al hacer zoom).
  const conPasesEnCalendario = new Set(pases.filter((p) => p.mes != null).map((p) => p.provincia));
  for (const provinciaSlug of conPasesEnCalendario) {
    if (provinciaSlug && !geoSlugs.has(provinciaSlug)) {
      err(`provincias.geo.json: falta la figura de "${provinciaSlug}" (tiene pases en el calendario)`);
    }
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
    `${recorrido.pases?.length ?? 0} recorridos, ${provincias.length} provincias` +
    `${provinciasGeo ? "" : " (sin provincias.geo.json)"} — sin errores`,
);
