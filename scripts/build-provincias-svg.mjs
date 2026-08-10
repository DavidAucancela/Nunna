#!/usr/bin/env node
/**
 * build-provincias-svg.mjs — Genera la geometría SVG de las provincias del Ecuador.
 *
 * Descarga los límites ADM1 de geoBoundaries, los simplifica, los proyecta a un
 * viewBox fijo y escribe apps/web/lib/data/provincias-geo.json. En runtime el
 * componente solo hace <path d={...} /> — cero librerías de geo en el bundle.
 *
 * Se corre a mano (como scripts/build-route.mjs); la salida se commitea al repo.
 * NO está en el pipeline de build: producción no hace llamadas de red.
 *
 * Uso:  node scripts/build-provincias-svg.mjs
 *
 * ⚠ Los archivos de wmgeolab en raw.githubusercontent.com son punteros de Git LFS,
 * no GeoJSON. Por eso se consulta primero la API, que devuelve una URL anclada a un
 * commit y capaz de resolver el contenido real (y de paso hace el build reproducible).
 *
 * Fuente: geoBoundaries (gbOpen ECU ADM1) — CC BY 4.0
 *         https://www.geoboundaries.org
 */
import { writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../apps/web/lib/data");
const OUT = resolve(DATA_DIR, "provincias-geo.json");
const require = createRequire(import.meta.url);
const provinciasCatalogo = require(resolve(DATA_DIR, "provincias.json"));

const API = "https://www.geoboundaries.org/api/current/gbOpen/ECU/ADM1/";

/**
 * Nombres exactos como vienen en la fuente → slug del catálogo.
 * Tabla explícita a propósito: la fuente mezcla acentuación ("Manabi" sin tilde pero
 * "Bolívar" con ella), así que normalizar a ciegas daría slugs inestables el día que
 * geoBoundaries corrija la ortografía. Si aparece un nombre que no esté aquí, el
 * script falla en vez de inventar un slug.
 */
const NOMBRE_A_SLUG = {
  Azuay: "azuay",
  Bolívar: "bolivar",
  Cañar: "canar",
  Carchi: "carchi",
  Chimborazo: "chimborazo",
  Cotopaxi: "cotopaxi",
  "El Oro": "el-oro",
  Esmeraldas: "esmeraldas",
  Galápagos: "galapagos",
  Guayas: "guayas",
  Imbabura: "imbabura",
  Loja: "loja",
  "Los Ríos": "los-rios",
  Manabi: "manabi",
  "Morona Santiago": "morona-santiago",
  Napo: "napo",
  Orellana: "orellana",
  Pastaza: "pastaza",
  Pichincha: "pichincha",
  "Santa Elena": "santa-elena",
  "Santo Domingo de los Tsáchilas": "santo-domingo-de-los-tsachilas",
  Sucumbios: "sucumbios",
  Tungurahua: "tungurahua",
  "Zamora Chinchipe": "zamora-chinchipe",
};

// ── Lienzo ───────────────────────────────────────────────────────────────────
const VB_W = 880;
const VB_H = 1000;
const PAD = 24;
// Galápagos va en un recuadro aparte: en su posición real dejaría el continente
// diminuto (está a ~1000 km de la costa). Es el tratamiento estándar del mapa de
// Ecuador. El recuadro se dibuja en las MISMAS coordenadas del viewBox principal,
// así el componente no necesita una segunda transformación.
// Va arriba a la izquierda (el noroeste real del archipiélago). Medido: a este
// tamaño no pisa ni un punto de la costa de Esmeraldas; agrandarlo sí lo hace.
const INSET = { x: 14, y: 14, w: 150, h: 102 };
const INSET_PAD = 10;

// ── Simplificación (Douglas–Peucker) ─────────────────────────────────────────
// Escrito a mano para no sumar una dependencia por un script de build.
function distanciaPerpendicular([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cl = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + cl * dx), py - (ay + cl * dy));
}

function douglasPeucker(puntos, tolerancia) {
  if (puntos.length <= 2) return puntos;
  let maxDist = 0;
  let idx = 0;
  for (let i = 1; i < puntos.length - 1; i++) {
    const d = distanciaPerpendicular(puntos[i], puntos[0], puntos[puntos.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist <= tolerancia) return [puntos[0], puntos[puntos.length - 1]];
  return [
    ...douglasPeucker(puntos.slice(0, idx + 1), tolerancia).slice(0, -1),
    ...douglasPeucker(puntos.slice(idx), tolerancia),
  ];
}

// ── Geometría ────────────────────────────────────────────────────────────────
/** Todos los anillos exteriores de un Polygon/MultiPolygon, como arrays de [lng,lat]. */
function anillosExteriores(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((poly) => poly[0]);
  throw new Error(`Geometría no soportada: ${geometry.type}`);
}

function areaAnillo(anillo) {
  let a = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    a += anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1];
  }
  return Math.abs(a / 2);
}

/** Centroide del anillo más grande — donde se planta el marcador de la provincia. */
function centroide(anillo) {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const f = anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1];
    a += f;
    cx += (anillo[j][0] + anillo[i][0]) * f;
    cy += (anillo[j][1] + anillo[i][1]) * f;
  }
  a *= 0.5;
  if (a === 0) return anillo[0];
  return [cx / (6 * a), cy / (6 * a)];
}

function bounds(anillos) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const anillo of anillos) {
    for (const [x, y] of anillo) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Proyección equirectangular (x=lon, y=-lat), encajada en una caja preservando
 * el aspecto. Ecuador está sobre la línea equinoccial, donde la distorsión
 * este-oeste de esta proyección es despreciable — no generaliza a otras latitudes.
 */
function crearProyeccion(bb, caja) {
  const spanX = bb.maxX - bb.minX;
  const spanY = bb.maxY - bb.minY;
  const escala = Math.min(caja.w / spanX, caja.h / spanY);
  const offX = caja.x + (caja.w - spanX * escala) / 2;
  const offY = caja.y + (caja.h - spanY * escala) / 2;
  return ([lng, lat]) => [
    offX + (lng - bb.minX) * escala,
    // y se invierte: en SVG crece hacia abajo, la latitud hacia arriba.
    offY + (bb.maxY - lat) * escala,
  ];
}

const r1 = (n) => Math.round(n * 10) / 10;

function aPath(anillos) {
  return anillos
    .map((anillo) => `M${anillo.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}Z`)
    .join("");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("→ consultando geoBoundaries…");
  const metaRes = await fetch(API);
  if (!metaRes.ok) throw new Error(`API de geoBoundaries respondió ${metaRes.status}`);
  const meta = await metaRes.json();
  const url = meta.simplifiedGeometryGeoJSON;
  if (!url) throw new Error("La API no devolvió simplifiedGeometryGeoJSON");

  console.log(`→ descargando ${url}`);
  const gjRes = await fetch(url, { redirect: "follow" });
  if (!gjRes.ok) throw new Error(`Descarga falló con ${gjRes.status}`);
  const texto = await gjRes.text();

  if (texto.startsWith("version https://git-lfs")) {
    throw new Error("Se recibió un puntero de Git LFS en vez del GeoJSON — revisar la URL de la API");
  }

  const geo = JSON.parse(texto);
  if (geo.type !== "FeatureCollection" || !Array.isArray(geo.features)) {
    throw new Error("La respuesta no es un FeatureCollection");
  }
  if (geo.features.length !== 24) {
    throw new Error(`Se esperaban 24 provincias, llegaron ${geo.features.length}`);
  }

  // 1. Nombre → slug (falla fuerte ante cualquier nombre desconocido)
  const catalogoSlugs = new Set(provinciasCatalogo.map((p) => p.slug));
  const crudas = geo.features.map((f) => {
    const nombre = f.properties.shapeName;
    const slug = NOMBRE_A_SLUG[nombre];
    if (!slug) {
      throw new Error(
        `Nombre desconocido en la fuente: "${nombre}". Agregarlo a NOMBRE_A_SLUG con su slug del catálogo.`
      );
    }
    if (!catalogoSlugs.has(slug)) {
      throw new Error(`El slug "${slug}" no existe en provincias.json`);
    }
    return { slug, anillos: anillosExteriores(f.geometry) };
  });

  // 2. Descartar islotes: por debajo del 1.5% del anillo mayor de su provincia no
  //    aportan a la silueta y sí a los bytes.
  for (const p of crudas) {
    const areas = p.anillos.map(areaAnillo);
    const mayor = Math.max(...areas);
    p.anillos = p.anillos.filter((_, i) => areas[i] >= mayor * 0.015);
  }

  const galapagos = crudas.find((p) => p.slug === "galapagos");
  const continente = crudas.filter((p) => p.slug !== "galapagos");

  // 3. Proyectar cada grupo en su propia caja del mismo viewBox
  const proyContinente = crearProyeccion(bounds(continente.flatMap((p) => p.anillos)), {
    x: PAD,
    y: PAD,
    w: VB_W - PAD * 2,
    h: VB_H - PAD * 2,
  });
  const proyInset = crearProyeccion(bounds(galapagos.anillos), {
    x: INSET.x + INSET_PAD,
    y: INSET.y + INSET_PAD,
    w: INSET.w - INSET_PAD * 2,
    h: INSET.h - INSET_PAD * 2,
  });

  // 4. Proyectar → simplificar (la tolerancia va en unidades del viewBox, así es
  //    independiente del tamaño del lienzo) → armar el path
  const TOLERANCIA = 1.1;
  const salida = [];
  let puntosAntes = 0;
  let puntosDespues = 0;

  for (const p of crudas) {
    const proy = p.slug === "galapagos" ? proyInset : proyContinente;
    const anillos = p.anillos
      .map((anillo) => {
        puntosAntes += anillo.length;
        const proyectado = anillo.map(proy);
        const simple = douglasPeucker(proyectado, TOLERANCIA);
        puntosDespues += simple.length;
        return simple;
      })
      .filter((anillo) => anillo.length >= 3);

    const mayor = anillos.reduce((a, b) => (areaAnillo(a) >= areaAnillo(b) ? a : b));
    const [cx, cy] = centroide(mayor);

    salida.push({ slug: p.slug, path: aPath(anillos), centroide: [r1(cx), r1(cy)] });
  }

  salida.sort((a, b) => a.slug.localeCompare(b.slug));

  const doc = {
    _fuente: "geoBoundaries gbOpen ECU ADM1 (CC BY 4.0) — https://www.geoboundaries.org",
    _generadoPor: "node scripts/build-provincias-svg.mjs",
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    insetRect: [INSET.x, INSET.y, INSET.w, INSET.h],
    insetSlugs: ["galapagos"],
    provincias: salida,
  };

  // Escritura atómica: si algo falla arriba, provincias-geo.json queda intacto.
  const json = JSON.stringify(doc, null, 2) + "\n";
  const tmp = `${OUT}.tmp`;
  await writeFile(tmp, json, "utf-8");
  await rename(tmp, OUT);

  const kb = (Buffer.byteLength(json) / 1024).toFixed(1);
  console.log(`✓ ${salida.length} provincias · ${puntosAntes} → ${puntosDespues} puntos · ${kb} KB`);
  console.log(`  escrito en ${OUT}`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
