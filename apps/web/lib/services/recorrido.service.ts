import recorridoRaw from "../data/recorrido.json";
import personajesRaw from "../data/personajes.json";

export interface RecorridoWaypoint {
  progress: number;
  coord: [number, number];
  slug: string;
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
  waypoints: RecorridoWaypoint[];
}

export interface Recorridos {
  defaultPaseSlug: string;
  pases: RecorridoPase[];
}

function toRecorridoPase(pase: (typeof recorridoRaw.pases)[number]): RecorridoPase {
  const waypoints = pase.waypoints.map((wp) => {
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
    const waypoint: RecorridoWaypoint = {
      progress: wp.progress,
      coord: wp.coord as [number, number],
      slug: personaje.slug,
      nombre,
      label: wp.label,
      calle: wp.calle,
      leyenda: personaje.narrativa?.leyenda ?? "",
      imagen: wp.imagen,
      imagenesExtra: wp.imagenesExtra,
      alt: `${personaje.nombre} en el pase`,
    };
    if ("dato" in wp && wp.dato) waypoint.dato = wp.dato;
    return waypoint;
  });

  return {
    paseSlug: pase.paseSlug,
    paseNombre: pase.paseNombre,
    centro: pase.centro as [number, number],
    zoom: pase.zoom,
    ruta: pase.ruta as [number, number][],
    waypoints,
  };
}

export async function getRecorridos(): Promise<Recorridos> {
  return {
    defaultPaseSlug: recorridoRaw.defaultPaseSlug,
    pases: recorridoRaw.pases.map(toRecorridoPase),
  };
}
