import type { PaseListItem } from "@seres-del-pase/types";
import provinciasRaw from "../data/provincias.json";
import pasesRaw from "../data/pases.json";

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

/**
 * Slug de la provincia a la que pertenece un pase con recorrido.
 * Se usa para agrupar recorridos por provincia sin recorrer todo el catálogo.
 */
export function provinciaDePase(paseSlug: string): string | undefined {
  const pase = pasesRaw.find((p) => p.slug === paseSlug) as { provincia?: string } | undefined;
  return pase?.provincia;
}
