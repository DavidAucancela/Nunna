"use client";

import { useEffect, useState } from "react";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { supabase } from "@/lib/supabase/client";

/**
 * Cuándo se guardó cada personaje (`user_unlocks.unlocked_at`), para ordenar la colección
 * como un camino y escribir "se unió el 3 oct". Solo /mis-personajes lo necesita, por eso
 * vive aquí y no en ColeccionProvider. Sin sesión o sin Supabase devuelve un mapa vacío.
 */
export function useFechasColeccion(): Map<string, Date> {
  const { session, coleccion } = useColeccion();
  const [fechas, setFechas] = useState<Map<string, Date>>(() => new Map());
  const userId = session?.user?.id ?? null;
  // Se vuelve a leer si cambia la colección (p. ej. se guardó uno nuevo en otra pestaña).
  const clave = [...coleccion].sort().join(",");

  useEffect(() => {
    if (!supabase || !userId) {
      setFechas(new Map());
      return;
    }
    let vigente = true;
    supabase
      .from("user_unlocks")
      .select("personaje_slug, unlocked_at")
      .then(({ data, error }) => {
        if (!vigente || error || !data) return;
        setFechas(
          new Map(
            data.map((r) => [r.personaje_slug as string, new Date(r.unlocked_at as string)] as const),
          ),
        );
      });
    return () => {
      vigente = false;
    };
  }, [userId, clave]);

  return fechas;
}
