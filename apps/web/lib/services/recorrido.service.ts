import recorridoRaw from "../data/recorrido.json";
import personajesRaw from "../data/personajes.json";

export interface RecorridoWaypoint {
  progress: number;
  coord: [number, number];
  /**
   * Slug del personaje con ficha en personajes.json. Ausente en waypoints
   * "inline" — provincias cuyo catálogo de figuras todavía no existe (ver
   * `nombre`/`leyenda` inline en recorrido.json). Sin `slug` no hay link a ficha.
   */
  slug?: string;
  nombre: string;
  label: string;
  calle: string;
  dato?: string;
  leyenda: string;
  imagen: string;
  imagenesExtra: string[];
  alt: string;
}

export interface RecorridoPase {
  paseSlug: string;
  paseNombre: string;
  centro: [number, number];
  zoom: number;
  ruta: [number, number][];
  /**
   * `true` = ruta de referencia todavía sin verificar calle por calle (coords
   * aproximadas del centro de la ciudad). La UI la marca como tal. Se siembra
   * así para las provincias fuera de Chimborazo hasta tener trazado real.
   */
  esDemo: boolean;
  waypoints: RecorridoWaypoint[];
}

export interface Recorridos {
  defaultPaseSlug: string;
  pases: RecorridoPase[];
}

interface WaypointRaw {
  progress: number;
  coord: [number, number];
  label: string;
  calle: string;
  imagen?: string;
  imagenesExtra?: string[];
  dato?: string;
  personajeSlug?: string;
  nombre?: string;
  leyenda?: string;
}

interface PaseRaw {
  paseSlug: string;
  paseNombre: string;
  centro: [number, number];
  zoom: number;
  ruta: [number, number][];
  demo?: boolean;
  waypoints: WaypointRaw[];
}

function toRecorridoPase(pase: PaseRaw): RecorridoPase {
  const waypoints = pase.waypoints.map((wp): RecorridoWaypoint => {
    const base = {
      progress: wp.progress,
      coord: wp.coord as [number, number],
      label: wp.label,
      calle: wp.calle,
      imagen: wp.imagen ?? "",
      imagenesExtra: wp.imagenesExtra ?? [],
    };

    let waypoint: RecorridoWaypoint;
    if (wp.personajeSlug) {
      const personaje = personajesRaw.find((p) => p.slug === wp.personajeSlug);
      if (!personaje) {
        throw new Error(
          `Recorrido (${pase.paseSlug}): personaje "${wp.personajeSlug}" no existe en personajes.json`
        );
      }
      const nombre =
        personaje.nombreKichwa && personaje.nombreKichwa !== personaje.nombre
          ? `${personaje.nombre} · ${personaje.nombreKichwa}`
          : personaje.nombre;
      waypoint = {
        ...base,
        slug: personaje.slug,
        nombre,
        leyenda: personaje.narrativa?.leyenda ?? "",
        alt: `${personaje.nombre} en el pase`,
      };
    } else {
      // Waypoint inline: la figura no tiene ficha todavía (provincias sembradas
      // sin catálogo de personajes). `nombre`/`leyenda` vienen del propio JSON.
      const nombre = wp.nombre || wp.label;
      waypoint = {
        ...base,
        nombre,
        leyenda: wp.leyenda ?? "",
        alt: `${nombre} en el pase`,
      };
    }

    if (wp.dato) waypoint.dato = wp.dato;
    return waypoint;
  });

  return {
    paseSlug: pase.paseSlug,
    paseNombre: pase.paseNombre,
    centro: pase.centro as [number, number],
    zoom: pase.zoom,
    ruta: pase.ruta as [number, number][],
    esDemo: pase.demo === true,
    waypoints,
  };
}

export async function getRecorridos(): Promise<Recorridos> {
  return {
    defaultPaseSlug: recorridoRaw.defaultPaseSlug,
    pases: (recorridoRaw.pases as unknown as PaseRaw[]).map(toRecorridoPase),
  };
}

/**
 * Acota los recorridos a un conjunto de pases (los de una sola provincia).
 *
 * `RecorridosProvincia` dibuja TODOS los recorridos que recibe a la vez — si se
 * le pasara el objeto completo (todas las provincias), mostraría rutas de otras
 * provincias mezcladas con la que el usuario tiene enfocada. `defaultPaseSlug`
 * queda como metadato sin uso activo hoy (no hay selector de "cuál abre"), se
 * conserva por si algún consumidor futuro lo necesita.
 */
export function acotarRecorridos(
  recorridos: Recorridos,
  paseSlugs: string[],
  defaultPaseSlug: string
): Recorridos {
  const permitidos = new Set(paseSlugs);
  return {
    defaultPaseSlug,
    pases: recorridos.pases.filter((p) => permitidos.has(p.paseSlug)),
  };
}
