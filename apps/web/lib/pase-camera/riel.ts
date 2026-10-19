import type { RecorridoWaypoint } from "@/lib/data";
import type { ElementoRiel } from "./elementos.service";

export type RielParada =
  | {
      tipo: "personaje";
      progress: number;
      waypoint: RecorridoWaypoint;
      /** Recorte con canal alfa (imagenPortada) para el billboard; null si no hay ficha. */
      figura: string | null;
    }
  | { tipo: "elemento"; progress: number; elemento: ElementoRiel };

/**
 * Combina los waypoints de personaje (recorrido.json) con las paradas tipo
 * "elemento" (props sin personaje) de un mismo pase, ordenadas por `progress`
 * ascendente — la única fuente de datos que consumen tanto la escena 3D como
 * el fallback estático.
 */
export function mergeRielParadas(
  waypoints: RecorridoWaypoint[],
  elementos: ElementoRiel[],
  figuras: Record<string, string> = {}
): RielParada[] {
  const personajes: RielParada[] = waypoints.map((waypoint) => ({
    tipo: "personaje",
    progress: waypoint.progress,
    waypoint,
    figura: (waypoint.slug && figuras[waypoint.slug]) || null,
  }));
  const elems: RielParada[] = elementos.map((elemento) => ({
    tipo: "elemento",
    progress: elemento.progress,
    elemento,
  }));
  return [...personajes, ...elems].sort((a, b) => a.progress - b.progress);
}
