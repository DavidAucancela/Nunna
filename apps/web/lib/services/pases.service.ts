import type { PaseListItem } from "@seres-del-pase/types";
import pasesRaw from "../data/pases.json";

interface GetPasesOptions {
  locale?: string;
}

export async function getPases(_options: GetPasesOptions): Promise<PaseListItem[]> {
  return pasesRaw.map((p) => {
    const raw = p as Record<string, unknown>;
    const pase: PaseListItem = {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      fechaTipo: p.fechaTipo as PaseListItem["fechaTipo"],
      fechaDescripcion: p.fechaDescripcion,
      totalPersonajes: p.totalPersonajes,
    };
    if (p.mes !== null) pase.mes = p.mes;
    if (p.dia !== null) pase.dia = p.dia;
    if (p.imagenPortada) pase.imagenPortada = p.imagenPortada;
    // Datos opcionales del recorrido oficial (solo pases con ruta publicada)
    for (const key of ["tipo", "horario", "ruta", "inicio", "fin", "personaje", "color"] as const) {
      const value = raw[key];
      if (typeof value === "string") pase[key] = value;
    }
    return pase;
  });
}
