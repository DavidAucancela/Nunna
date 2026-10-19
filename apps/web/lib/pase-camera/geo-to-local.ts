const METROS_POR_GRADO_LAT = 110_540;
const METROS_POR_GRADO_LON_ECUADOR = 111_320;

const ALTURA_BASE = 1.75;
const ALTURA_AMPLITUD = 0.35;
const EPSILON_SIMPLIFICACION_METROS = 4;

/**
 * Proyección equirectangular local: convierte `[lon, lat]` a metros
 * relativos a `centro`. Suficiente a la escala de un recorrido urbano (unos
 * pocos km) — no es una proyección geodésica de precisión, y no hace falta
 * serlo para un riel de cámara.
 */
export function proyectarLocal(
  centro: [number, number],
  coord: [number, number]
): [number, number] {
  const [lonCentro, latCentro] = centro;
  const [lon, lat] = coord;
  const metrosPorGradoLon = METROS_POR_GRADO_LON_ECUADOR * Math.cos((latCentro * Math.PI) / 180);
  const x = (lon - lonCentro) * metrosPorGradoLon;
  const z = (lat - latCentro) * METROS_POR_GRADO_LAT;
  return [x, z];
}

function distanciaPuntoSegmento(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const [px, pz] = p;
  const [ax, az] = a;
  const [bx, bz] = b;
  const dx = bx - ax;
  const dz = bz - az;
  const largoAlCuadrado = dx * dx + dz * dz;
  if (largoAlCuadrado === 0) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / largoAlCuadrado));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/**
 * Douglas-Peucker sobre puntos ya proyectados a metros: reduce el ruido de
 * snapping de OSRM (zigzags de pocos metros en las esquinas) conservando los
 * giros reales de la ruta.
 */
export function simplificarRuta(
  puntos: [number, number][],
  epsilonMetros: number
): [number, number][] {
  if (puntos.length <= 2) return puntos;
  const primero = puntos[0]!;
  const ultimo = puntos[puntos.length - 1]!;
  let distanciaMaxima = 0;
  let indiceMaximo = 0;
  for (let i = 1; i < puntos.length - 1; i++) {
    const distancia = distanciaPuntoSegmento(puntos[i]!, primero, ultimo);
    if (distancia > distanciaMaxima) {
      distanciaMaxima = distancia;
      indiceMaximo = i;
    }
  }
  if (distanciaMaxima > epsilonMetros) {
    const izquierda = simplificarRuta(puntos.slice(0, indiceMaximo + 1), epsilonMetros);
    const derecha = simplificarRuta(puntos.slice(indiceMaximo), epsilonMetros);
    return [...izquierda.slice(0, -1), ...derecha];
  }
  return [primero, ultimo];
}

/**
 * Puntos de control (en metros locales, `[x, y, z]`) para la curva de cámara
 * del riel, derivados de la ruta real snapeada a calle (`recorrido.json`).
 * La altura (`y`) no viene de datos reales — no hay elevación en
 * `recorrido.json` — es una variación vertical suave y determinística,
 * puramente cinematográfica, igual de "autoral" que la curva de respaldo de
 * `curve.ts`, solo que aplicada sobre un trazado real en vez de inventado.
 */
export function construirPuntosControl(
  ruta: [number, number][],
  centro: [number, number],
  epsilonMetros = EPSILON_SIMPLIFICACION_METROS
): [number, number, number][] {
  const local = ruta.map((coord) => proyectarLocal(centro, coord));
  const simplificado = simplificarRuta(local, epsilonMetros);
  return simplificado.map(([x, z], i) => {
    const t = simplificado.length > 1 ? i / (simplificado.length - 1) : 0;
    const y = ALTURA_BASE + ALTURA_AMPLITUD * Math.sin(t * Math.PI * 2);
    return [x, y, z];
  });
}
