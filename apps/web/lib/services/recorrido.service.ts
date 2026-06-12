import recorridoRaw from "../data/recorrido.json";
import personajesRaw from "../data/personajes.json";

export interface RecorridoWaypoint {
  progress: number;
  coord: [number, number];
  slug: string;
  nombre: string;
  label: string;
  calle: string;
  leyenda: string;
  imagen: string;
  imagenesExtra: string[];
  alt: string;
}

export interface Recorrido {
  centro: [number, number];
  zoom: number;
  ruta: [number, number][];
  waypoints: RecorridoWaypoint[];
}

export async function getRecorrido(): Promise<Recorrido> {
  const waypoints = recorridoRaw.waypoints.map((wp) => {
    const personaje = personajesRaw.find((p) => p.slug === wp.personajeSlug);
    if (!personaje) {
      throw new Error(`Recorrido: personaje "${wp.personajeSlug}" no existe en personajes.json`);
    }
    const nombre =
      personaje.nombreKichwa && personaje.nombreKichwa !== personaje.nombre
        ? `${personaje.nombre} · ${personaje.nombreKichwa}`
        : personaje.nombre;
    return {
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
  });

  return {
    centro: recorridoRaw.centro as [number, number],
    zoom: recorridoRaw.zoom,
    ruta: recorridoRaw.ruta as [number, number][],
    waypoints,
  };
}
