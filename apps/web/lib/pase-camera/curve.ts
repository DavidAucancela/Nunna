import * as THREE from "three";

// Curva de respaldo — usada solo si no hay puntos derivados de una ruta real
// (`geo-to-local.ts` construirPuntosControl, a partir de recorrido.json).
// Puntos ilustrativos, para pases futuros sin datos de recorrido trazado.
const CONTROL_POINTS_AUTORAL = [
  new THREE.Vector3(0, 1.6, 12),
  new THREE.Vector3(2.2, 1.9, 6),
  new THREE.Vector3(-1.8, 1.5, 1),
  new THREE.Vector3(1.4, 2.1, -4),
  new THREE.Vector3(-1, 1.7, -9),
  new THREE.Vector3(0.5, 1.6, -15),
];

const LATERAL_OFFSET = 2.4;

/**
 * `points`: puntos de control ya proyectados a espacio local en metros (ver
 * `geo-to-local.ts`). Si se omiten o hay menos de 2, cae a la curva autoral.
 */
export function createRielCurve(points?: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  const control = points && points.length >= 2 ? points : CONTROL_POINTS_AUTORAL;
  return new THREE.CatmullRomCurve3(control, false);
}

export function puntosControlDesdeLocal(puntos: [number, number, number][]): THREE.Vector3[] {
  return puntos.map(([x, y, z]) => new THREE.Vector3(x, y, z));
}

/**
 * Posición mundial de una parada a lo largo del riel: el punto de la curva en
 * `progress`, desplazado lateralmente sobre la normal horizontal del camino
 * (alternando lado por parada) para que los billboards no queden literalmente
 * sobre el trayecto de la cámara.
 */
export function paradaPosition(
  curve: THREE.CatmullRomCurve3,
  progress: number,
  side: 1 | -1
): THREE.Vector3 {
  const t = Math.min(Math.max(progress, 0), 1);
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return point.clone().addScaledVector(normal, LATERAL_OFFSET * side);
}
