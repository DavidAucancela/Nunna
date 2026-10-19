"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { hasWebGL } from "@/lib/pase-camera/webgl-support";
import { writeTarget } from "@/lib/pase-camera/scroll-progress";
import type { RielParada } from "@/lib/pase-camera/riel";
import { PaseCameraFallback } from "./PaseCameraFallback";

const PaseCameraScene = dynamic(
  () => import("./PaseCameraScene").then((mod) => mod.PaseCameraScene),
  { ssr: false }
);

// Cuánto scroll de página recorre el riel completo: más alto = recorrido más lento.
const ALTO_RIEL_VH = 450;

interface Props {
  paradas: RielParada[];
  controlPoints: [number, number, number][];
}

/**
 * Decide si se monta la escena 3D (WebGL) o el fallback estático.
 *
 * El recorrido usa el scroll NORMAL de la página: una pista alta (`ALTO_RIEL_VH`)
 * con el canvas `sticky` dentro; el progreso de la pista dirige la cámara
 * (`writeTarget`). Mismo patrón que `RecorridoScrollytelling` — sin scroll
 * interno ni pausar Lenis (esa versión dejaba la página clavada al salir del riel).
 *
 * Servidor y primer paint de cliente SIEMPRE renderizan el fallback (mounted
 * arranca en false) — mismo patrón SSR-safe que HeroGated/AnatomiaGated. Tras
 * montar se resuelve reduced-motion + soporte WebGL; si falla, el fallback se
 * queda y el chunk de three.js nunca se descarga.
 */
export function PaseCameraGated({ paradas, controlPoints }: Props) {
  const t = useTranslations("pases");
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const wrapperRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setWebglOk(hasWebGL());
  }, []);

  // Precarga: margen generoso, dispara el import dinámico de la escena antes
  // de que la sección sea visible.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setNearViewport(true);
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const useScene = mounted && !reduced && webglOk;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => writeTarget(v));
  // Al montar la pista, arranca la cámara en el punto que corresponda al scroll actual.
  useEffect(() => {
    if (useScene) writeTarget(scrollYProgress.get());
  }, [useScene, scrollYProgress]);

  return (
    <section ref={wrapperRef} className="w-full pt-16 sm:pt-24">
      <div className="mx-auto mb-8 max-w-3xl px-5 text-center sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
          {t("recorrido_visual_titulo")}
        </h2>
        <p className="mt-2 text-sm text-stone-400">{t("recorrido_visual_intro")}</p>
      </div>
      {useScene ? (
        <div ref={trackRef} style={{ height: `${ALTO_RIEL_VH}vh` }}>
          <div className="sticky top-16 h-[calc(100dvh-4rem)] w-full bg-fondo-oscuro">
            {nearViewport && <PaseCameraScene paradas={paradas} controlPoints={controlPoints} />}
          </div>
        </div>
      ) : (
        <div className="pb-16 sm:pb-24">
          <PaseCameraFallback paradas={paradas} />
        </div>
      )}
    </section>
  );
}
