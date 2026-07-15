"use client";

import type { Hotspot } from "@seres-del-pase/types";
import { useDesbloqueo } from "@/components/auth/ColeccionProvider";
import { AnatomiaSection } from "./AnatomiaSection";

interface AnatomiaGatedProps {
  slug: string;
  imagen: { url: string; altText: string };
  hotspots: Hotspot[];
  accentColor: string;
  nombre: string;
  embedded?: boolean;
}

/**
 * Solo muestra la "Anatomía" inmersiva cuando el personaje está desbloqueado
 * (o el backend está apagado). Bloqueado → no renderiza nada; el CTA de
 * desbloqueo vive en el hero para no duplicar el llamado a la acción.
 */
export function AnatomiaGated({ slug, ...props }: AnatomiaGatedProps) {
  const { resolved, unlocked } = useDesbloqueo(slug);
  if (!resolved || !unlocked) return null;
  return <AnatomiaSection {...props} />;
}
