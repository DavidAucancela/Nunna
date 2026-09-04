"use client";

import { useEffect, useState } from "react";
import type { PaseListItem } from "@seres-del-pase/types";
import type { Recorridos } from "@/lib/data";
import { RecorridosProvincia } from "./RecorridosProvincia";
import { RecorridoScrollytelling } from "./RecorridoScrollytelling";

interface Props {
  /** Recorridos ya acotados a los pases de una sola provincia (≥1). */
  recorridos: Recorridos;
  pasesInfo: PaseListItem[];
}

/**
 * Sección "Recorrido" de una provincia. Dos vistas que comparten qué pase está
 * seleccionado:
 *  1. `RecorridosProvincia` — mapa general con TODAS las rutas de la provincia
 *     + chips para aislar una.
 *  2. `RecorridoScrollytelling` — el recorrido calle por calle del pase elegido,
 *     que avanza con el scroll (restaura el antiguo `PaseMapSection`).
 * Elegir un chip arriba cambia el pase que recorre el scrollytelling, y su
 * selector propio hace lo mismo hacia arriba.
 */
export function RecorridoProvinciaSection({ recorridos, pasesInfo }: Props) {
  const [paseSlug, setPaseSlug] = useState(
    () => recorridos.pases[0]?.paseSlug ?? ""
  );

  // Cambió la provincia (nueva navegación en /pases) → volver al primer pase.
  useEffect(() => {
    setPaseSlug(recorridos.pases[0]?.paseSlug ?? "");
  }, [recorridos]);

  return (
    <>
      <RecorridosProvincia
        recorridos={recorridos}
        pasesInfo={pasesInfo}
        onSelectPase={setPaseSlug}
      />
      <div className="mt-12">
        <RecorridoScrollytelling
          recorridos={recorridos}
          pasesInfo={pasesInfo}
          paseSlug={paseSlug}
          onSelectPase={setPaseSlug}
        />
      </div>
    </>
  );
}
