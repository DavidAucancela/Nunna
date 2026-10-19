import type { PaseListItem } from "@seres-del-pase/types";
import provinciasRaw from "../data/provincias.json";

export type Region = "sierra" | "costa" | "amazonia" | "insular";

export interface Provincia {
  slug: string;
  nombre: string;
  region: Region;
}

export interface ProvinciaConPases extends Provincia {
  /** Todos los pases de la provincia con fecha de calendario (mes/dia) — con o sin recorrido trazado. */
  pases: PaseListItem[];
}

/** Catálogo cerrado de las 24 provincias del Ecuador. */
export async function getProvincias(): Promise<Provincia[]> {
  return provinciasRaw.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    region: p.region as Region,
  }));
}

/**
 * Provincias que tienen al menos un pase con fecha en el calendario.
 *
 * El mapa nacional marca estas — el mismo criterio de "mes presente" que ya usa
 * `CalendarioGrid` para agrupar por mes. No exige recorrido trazado: una
 * provincia puede estar marcada y aun así no tener ruta MapLibre todavía (la
 * sección "Recorrido" de su detalle muestra un estado "próximamente" en ese caso).
 */
export async function getProvinciasConPases(
  pases: PaseListItem[]
): Promise<ProvinciaConPases[]> {
  const catalogo = await getProvincias();

  return catalogo
    .map((provincia) => ({
      ...provincia,
      pases: pases.filter((p) => p.provincia === provincia.slug && p.mes != null),
    }))
    .filter((p) => p.pases.length > 0);
}

/** Máximo de pases que muestra cada provincia en `/pases`. */
export const MAX_PASES_POR_PROVINCIA = 5;

/**
 * Peso de un pase según cuánto material tiene ya cargado: primero los que se
 * pueden recorrer (ruta verificada antes que ruta de referencia), luego los que
 * tienen personaje y afiche.
 */
function pesoDePase(pase: PaseListItem, rutas: Map<string, boolean>): number {
  const ruta = rutas.get(pase.slug);
  return (
    (ruta === undefined ? 0 : ruta ? 6 : 8) +
    (pase.personajeSlug ? 2 : 0) +
    (pase.imagenPortada ? 1 : 0)
  );
}

/**
 * Deja a cada provincia con sus `max` pases con más registros (ver `pesoDePase`);
 * a igual peso, el más próximo en el calendario y luego el orden del JSON.
 *
 * @param rutas pases con recorrido trazado → `true` si su ruta es de referencia (demo).
 */
export function limitarPasesPorProvincia(
  provincias: ProvinciaConPases[],
  rutas: Map<string, boolean>,
  max = MAX_PASES_POR_PROVINCIA,
): ProvinciaConPases[] {
  return provincias.map((provincia) => ({
    ...provincia,
    pases: [...provincia.pases]
      .sort(
        (a, b) =>
          pesoDePase(b, rutas) - pesoDePase(a, rutas) ||
          (a.mes ?? 13) - (b.mes ?? 13) ||
          (a.dia ?? 32) - (b.dia ?? 32),
      )
      .slice(0, max),
  }));
}
