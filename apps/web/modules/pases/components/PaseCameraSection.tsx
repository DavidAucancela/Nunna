import { getPersonajes } from "@/lib/data";
import { getElementosPase } from "@/lib/pase-camera/elementos.service";
import { mergeRielParadas } from "@/lib/pase-camera/riel";
import { construirPuntosControl } from "@/lib/pase-camera/geo-to-local";
import type { RecorridoPase } from "@/lib/data";
import { PaseCameraGated } from "./PaseCameraGated";

interface Props {
  recorridoPase: RecorridoPase;
}

/**
 * Shell server-safe (sin "use client"): arma el array RielParada[] (merge de
 * los waypoints de personaje del pase + sus elementos curados, ver
 * lib/pase-camera/riel.ts) + los puntos de control de la curva de cámara
 * derivados de la ruta real snapeada a calle (recorrido.json, vía
 * geo-to-local.ts) y lo entrega a PaseCameraGated. Solo se renderiza cuando
 * el pase tiene datos de recorrido — el llamador (page.tsx) es quien decide eso.
 */
export async function PaseCameraSection({ recorridoPase }: Props) {
  const elementos = await getElementosPase(recorridoPase.paseSlug);
  const personajes = await getPersonajes({});
  const figuras = Object.fromEntries(
    personajes.flatMap((p) => (p.imagenPortada ? [[p.slug, p.imagenPortada] as const] : []))
  );
  const paradas = mergeRielParadas(recorridoPase.waypoints, elementos, figuras);
  const controlPoints = construirPuntosControl(recorridoPase.ruta, recorridoPase.centro);

  return <PaseCameraGated paradas={paradas} controlPoints={controlPoints} />;
}
