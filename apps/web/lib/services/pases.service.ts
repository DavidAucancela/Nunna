import type { PaseListItem } from "@seres-del-pase/types";
import pasesRaw from "../data/pases.json";

interface GetPasesOptions {
  locale?: string;
}

export async function getPases(_options: GetPasesOptions): Promise<PaseListItem[]> {
  return pasesRaw.map((p) => {
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
    return pase;
  });
}
