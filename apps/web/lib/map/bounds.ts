import type { Position } from "geojson";

export type LngLatBoundsTuple = [[number, number], [number, number]];

/**
 * Bounds `[[minLng,minLat],[maxLng,maxLat]]` — la forma que `map.fitBounds()`
 * de MapLibre ya espera (mismo idiom que usa `RecorridosProvincia`/`MapaEcuador`
 * al encuadrar una ruta). Deliberadamente NO depende de `maplibregl.LngLatBounds`
 * para que este módulo sea puro y testeable sin mockear `maplibre-gl` (que solo
 * puede importarse dinámicamente en cliente).
 */
export interface BoundsAccumulator {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function nuevoAcumulador(): BoundsAccumulator {
  return { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
}

export function extenderConPunto(acc: BoundsAccumulator, punto: Position): void {
  const lng = punto[0]!;
  const lat = punto[1]!;
  if (lng < acc.minLng) acc.minLng = lng;
  if (lng > acc.maxLng) acc.maxLng = lng;
  if (lat < acc.minLat) acc.minLat = lat;
  if (lat > acc.maxLat) acc.maxLat = lat;
}

/** Recorre todas las coordenadas de un Polygon/MultiPolygon y las acumula en `acc`. */
export function extenderConGeometria(
  acc: BoundsAccumulator,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): void {
  const anillos = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  for (const anillo of anillos) {
    for (const punto of anillo) extenderConPunto(acc, punto);
  }
}

/** Recorre una lista de puntos `[lng,lat]` (p. ej. una ruta) y los acumula en `acc`. */
export function extenderConLinea(acc: BoundsAccumulator, linea: Position[]): void {
  for (const punto of linea) extenderConPunto(acc, punto);
}

export function acumuladorATuple(acc: BoundsAccumulator): LngLatBoundsTuple | null {
  if (!Number.isFinite(acc.minLng) || !Number.isFinite(acc.minLat)) return null;
  return [
    [acc.minLng, acc.minLat],
    [acc.maxLng, acc.maxLat],
  ];
}

/** Bounds de una sola geometría Polygon/MultiPolygon. */
export function boundsFromGeoJSON(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): LngLatBoundsTuple | null {
  const acc = nuevoAcumulador();
  extenderConGeometria(acc, geometry);
  return acumuladorATuple(acc);
}

/** Bounds de la unión de varias líneas (p. ej. todas las rutas de una provincia). */
export function boundsFromLineas(lineas: Position[][]): LngLatBoundsTuple | null {
  const acc = nuevoAcumulador();
  for (const linea of lineas) extenderConLinea(acc, linea);
  return acumuladorATuple(acc);
}

/** Bounds de la unión de varias geometrías (p. ej. todas las provincias con contenido). */
export function boundsFromFeatureCollection(
  geometries: (GeoJSON.Polygon | GeoJSON.MultiPolygon)[]
): LngLatBoundsTuple | null {
  const acc = nuevoAcumulador();
  for (const g of geometries) extenderConGeometria(acc, g);
  return acumuladorATuple(acc);
}
