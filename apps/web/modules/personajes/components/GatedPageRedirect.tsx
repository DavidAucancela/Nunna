"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useColeccion } from "@/components/auth/ColeccionProvider";

export function GatedPageRedirect({ slug }: { slug: string }) {
  const { coleccion, ready, gatingActive } = useColeccion();
  const router = useRouter();

  useEffect(() => {
    if (!gatingActive || !ready) return;
    if (!coleccion.has(slug)) {
      // Landing de desbloqueo del personaje concreto — conserva el contexto del QR escaneado.
      router.replace({ pathname: "/desbloquear/[slug]", params: { slug } });
    }
  }, [gatingActive, ready, coleccion, slug, router]);

  return null;
}
