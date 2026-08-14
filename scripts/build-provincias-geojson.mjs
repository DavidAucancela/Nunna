#!/usr/bin/env node
/**
 * build-provincias-geojson.mjs — Genera la geometría REAL (lon/lat WGS84) de
 * las provincias del Ecuador para el mapa nacional MapLibre.
 *
 * La descarga/simplificación/mapeo de nombres vive en scripts/lib/provincias-fuente.mjs
 * (reutilizable si algún día vuelve a hacer falta otra proyección de la misma
 * fuente). Este script NO proyecta a un viewBox artificial — la salida es un
 * FeatureCollection GeoJSON válido en coordenadas geográficas reales, listo
 * para usarse como `source` de MapLibre (fill/line con feature-state por slug).
 *
 * Se corre a mano; la salida se commitea al repo. NO está en el pipeline de
 * build: producción no hace llamadas de red.
 *
 * Uso:  node scripts/build-provincias-geojson.mjs
 *
 * Fuente: geoBoundaries (gbOpen ECU ADM1) — CC BY 4.0
 *         https://www.geoboundaries.org
 */
import { writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import {
  descargarGeoBoundariesECU,
  mapNombreASlug,
  anillosExteriores,
  areaAnillo,
  centroide,
  douglasPeucker,
  filtrarIslotes,
} from "./lib/provincias-fuente.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../apps/web/lib/data");
const OUT = resolve(DATA_DIR, "provincias.geo.json");
const require = createRequire(import.meta.url);
const provinciasCatalogo = require(resolve(DATA_DIR, "provincias.json"));

// Tolerancia de Douglas-Peucker en GRADOS (no en píxeles como el script SVG —
// magnitud completamente distinta). ~0.006° ≈ 660m en el ecuador; suficiente
// para una silueta reconocible a escala nacional sin inflar el bundle.
const TOLERANCIA_GRADOS = 0.006;
// 5 decimales ≈ 1.1m de precisión — de sobra para un mapa nacional.
const r6 = (n) => Math.round(n * 1e5) / 1e5;

function redondearAnillo(anillo) {
  return anillo.map(([lng, lat]) => [r6(lng), r6(lat)]);
}

async function main() {
  const geo = await descargarGeoBoundariesECU();

  const catalogoSlugs = new Set(provinciasCatalogo.map((p) => p.slug));
  const catalogoPorSlug = new Map(provinciasCatalogo.map((p) => [p.slug, p]));

  const crudas = geo.features.map((f) => {
    const slug = mapNombreASlug(f.properties.shapeName, catalogoSlugs);
    return { slug, anillos: anillosExteriores(f.geometry) };
  });

  // Descartar islotes (mismo criterio que el script SVG): por debajo del 1.5%
  // del anillo mayor de su provincia no aportan a la silueta y sí a los bytes.
  for (const p of crudas) {
    p.anillos = filtrarIslotes(p.anillos);
  }

  const features = [];
  let puntosAntes = 0;
  let puntosDespues = 0;

  for (const p of crudas) {
    const anillosSimplificados = p.anillos
      .map((anillo) => {
        puntosAntes += anillo.length;
        const simple = douglasPeucker(anillo, TOLERANCIA_GRADOS);
        puntosDespues += simple.length;
        return simple;
      })
      .filter((anillo) => anillo.length >= 3);

    const mayor = anillosSimplificados.reduce((a, b) =>
      areaAnillo(a) >= areaAnillo(b) ? a : b
    );
    const [cx, cy] = centroide(mayor);

    // Cada anillo exterior se emite como su propio Polygon simple (sin huecos,
    // igual que el script SVG) — MultiPolygon si la provincia tiene >1 anillo
    // (islas, p. ej. Galápagos).
    const coordinates = anillosSimplificados.map((anillo) => {
      const redondeado = redondearAnillo(anillo);
      // GeoJSON exige el anillo cerrado (primer punto === último).
      return [[...redondeado, redondeado[0]]];
    });

    const geometry =
      coordinates.length === 1
        ? { type: "Polygon", coordinates: coordinates[0] }
        : { type: "MultiPolygon", coordinates };

    const catalogo = catalogoPorSlug.get(p.slug);
    features.push({
      type: "Feature",
      properties: {
        slug: p.slug,
        nombre: catalogo?.nombre ?? p.slug,
        region: catalogo?.region ?? null,
        centroide: [r6(cx), r6(cy)],
      },
      geometry,
    });
  }

  features.sort((a, b) => a.properties.slug.localeCompare(b.properties.slug));

  if (features.length !== 24 || new Set(features.map((f) => f.properties.slug)).size !== 24) {
    throw new Error(`Se esperaban 24 provincias únicas, se generaron ${features.length}`);
  }
  for (const slug of catalogoSlugs) {
    if (!features.some((f) => f.properties.slug === slug)) {
      throw new Error(`Falta la provincia "${slug}" (existe en provincias.json pero no en la salida)`);
    }
  }

  const doc = {
    _fuente: "geoBoundaries gbOpen ECU ADM1 (CC BY 4.0) — https://www.geoboundaries.org",
    _generadoPor: "node scripts/build-provincias-geojson.mjs",
    type: "FeatureCollection",
    features,
  };

  // Escritura atómica: si algo falla arriba, provincias.geo.json queda intacto.
  const json = JSON.stringify(doc, null, 2) + "\n";
  const tmp = `${OUT}.tmp`;
  await writeFile(tmp, json, "utf-8");
  await rename(tmp, OUT);

  const kb = (Buffer.byteLength(json) / 1024).toFixed(1);
  console.log(`✓ ${features.length} provincias · ${puntosAntes} → ${puntosDespues} puntos · ${kb} KB`);
  console.log(`  escrito en ${OUT}`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
