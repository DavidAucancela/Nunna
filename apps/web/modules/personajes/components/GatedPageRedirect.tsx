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
      router.replace("/desbloquear");
    }
  }, [gatingActive, ready, coleccion, slug, router]);

  return null;
}
