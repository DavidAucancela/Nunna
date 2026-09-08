"use client";

import type { RecorridoPase } from "@/lib/data";
import { useDesbloqueo } from "@/components/auth/ColeccionProvider";
import { PaseInmersivo } from "./PaseInmersivo";

interface Props {
  slug: string;
  recorrido: RecorridoPase | null;
  nombre: string;
  accentColor: string;
}

/**
 * Gate del recorrido inmersivo: es el "premio" del desbloqueo, igual que el
 * hero `Despertar` y la anatomía (`AnatomiaGated`).
 *  - Sin recorrido para el personaje → no renderiza nada.
 *  - Bloqueado (o aún sin resolver) → nada; el CTA de desbloqueo vive en el hero
 *    y la ficha entera redirige a `/desbloquear/[slug]` (`GatedPageRedirect`).
 *  - Desbloqueado (o backend apagado) → `PaseInmersivo` completo.
 */
export function PaseInmersivoGated({ slug, recorrido, nombre, accentColor }: Props) {
  const { resolved, unlocked } = useDesbloqueo(slug);

  if (!recorrido || !resolved || !unlocked) return null;

  return (
    <PaseInmersivo
      recorrido={recorrido}
      personajeSlug={slug}
      nombre={nombre}
      accentColor={accentColor}
    />
  );
}
