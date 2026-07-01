"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useColeccion } from "@/components/auth/ColeccionProvider";

/**
 * Redirige a /desbloquear si el personaje no está en la colección del usuario.
 * Solo actúa cuando Supabase está configurado (gatingActive) y el estado ya resolvió (ready).
 * Mientras carga no hace nada para evitar parpadeos.
 */
export function GatedPageRedirect({ slug }: { slug: string }) {
  const { coleccion, ready, gatingActive } = useColeccion();
  const router = useRouter();

  useEffect(() => {
    if (!gatingActive || !ready) return;
    if (!coleccion.has(slug)) {
      router.replace("/desbloquear");
    }
  }, [gatingActive, ready, coleccion, slug, router]);

  return null;
}
