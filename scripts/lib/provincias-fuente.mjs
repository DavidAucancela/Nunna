/**
 * provincias-fuente.mjs — descarga, mapeo de nombres y simplificación
 * geométrica compartidos por los scripts de generación de provincias
 * (hoy solo build-provincias-geojson.mjs). Separado del script de salida para
 * que agregar otra proyección/formato en el futuro no implique reimplementar
 * la descarga de geoBoundaries ni el mapeo NOMBRE_A_SLUG.
 *
 * ⚠ Los archivos de wmgeolab en raw.githubusercontent.com son punteros de Git
 * LFS, no GeoJSON. Por eso se consulta primero la API, que devuelve una URL
 * anclada a un commit y capaz de resolver el contenido real.
 */

const API = "https://www.geoboundaries.org/api/current/gbOpen/ECU/ADM1/";

/**
 * Nombres exactos como vienen en la fuente → slug del catálogo.
 * Tabla explícita a propósito: la fuente mezcla acentuación ("Manabi" sin tilde
 * pero "Bolívar" con ella), así que normalizar a ciegas daría slugs inestables
 * el día que geoBoundaries corrija la ortografía. Si aparece un nombre que no
 * esté aquí, ambos scripts fallan en vez de inventar un slug.
 */
export const NOMBRE_A_SLUG = {
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

/** Descarga el FeatureCollection crudo de geoBoundaries, ya validado en forma. */
export async function descargarGeoBoundariesECU() {
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
  return geo;
}

/** Nombre de la fuente → slug del catálogo. Falla fuerte si no matchea. */
export function mapNombreASlug(nombre, catalogoSlugs) {
  const slug = NOMBRE_A_SLUG[nombre];
  if (!slug) {
    throw new Error(
      `Nombre desconocido en la fuente: "${nombre}". Agregarlo a NOMBRE_A_SLUG con su slug del catálogo.`
    );
  }
  if (!catalogoSlugs.has(slug)) {
    throw new Error(`El slug "${slug}" no existe en provincias.json`);
  }
  return slug;
}

/** Todos los anillos exteriores de un Polygon/MultiPolygon, como arrays de [lng,lat]. Descarta huecos. */
export function anillosExteriores(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((poly) => poly[0]);
  throw new Error(`Geometría no soportada: ${geometry.type}`);
}

export function areaAnillo(anillo) {
  let a = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    a += anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1];
  }
  return Math.abs(a / 2);
}

/** Centroide del anillo (fórmula estándar del polígono; suficiente para plantar un marcador). */
export function centroide(anillo) {
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

export function bounds(anillos) {
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

/** Douglas–Peucker escrito a mano para no sumar una dependencia por un script de build. */
function distanciaPerpendicular([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cl = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + cl * dx), py - (ay + cl * dy));
}

export function douglasPeucker(puntos, tolerancia) {
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

/**
 * Descarta islotes: anillos por debajo de `umbral` (proporción del área del
 * anillo mayor de la misma provincia) no aportan a la silueta y sí a los bytes.
 */
export function filtrarIslotes(anillos, umbral = 0.015) {
  const areas = anillos.map(areaAnillo);
  const mayor = Math.max(...areas);
  return anillos.filter((_, i) => areas[i] >= mayor * umbral);
}
