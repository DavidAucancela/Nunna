"use client";

import { useColeccion } from "@/components/auth/ColeccionProvider";
import { PersonajeCard } from "./PersonajeCard";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface PersonajesGridProps {
  personajes: PersonajeListItem[];
}

export function PersonajesGrid({ personajes }: PersonajesGridProps) {
  const { coleccion, ready, gatingActive } = useColeccion();

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {personajes.map((personaje, i) => {
        // Sin Supabase configurado o antes de saber el estado → todo accesible
        const unlocked = !gatingActive || !ready || coleccion.has(personaje.slug);
        return (
          <PersonajeCard
            key={personaje.id}
            personaje={personaje}
            unlocked={unlocked}
            priority={i < 4}
          />
        );
      })}
    </div>
  );
}
