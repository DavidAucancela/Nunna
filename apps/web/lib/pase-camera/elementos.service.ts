import elementosRiobambaRaw from "./elementos-riobamba.json";

export interface ElementoRiel {
  id: string;
  progress: number;
  nombre: string;
  texto: string;
  imagen?: string;
}

const ELEMENTOS_POR_PASE: Record<string, ElementoRiel[]> = {
  "instituto-tecnologico-riobamba": elementosRiobambaRaw,
};

/**
 * Paradas tipo "elemento" (props sin personaje) curadas para un pase.
 * Devuelve [] para cualquier pase sin elementos definidos — mergeRielParadas()
 * degrada limpio a solo-personajes en ese caso.
 */
export async function getElementosPase(paseSlug: string): Promise<ElementoRiel[]> {
  return ELEMENTOS_POR_PASE[paseSlug] ?? [];
}
