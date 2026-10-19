"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import type { RielParada } from "@/lib/pase-camera/riel";
import { useRielProgress } from "@/lib/pase-camera/scroll-progress";

interface Props {
  paradas: RielParada[];
}

function findActiveIndex(paradas: RielParada[], progress: number): number {
  let closest = 0;
  let minDist = Infinity;
  paradas.forEach((parada, i) => {
    const dist = Math.abs(parada.progress - progress);
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  });
  return closest;
}

/**
 * Tarjeta de información + hint de scroll, ambos FUERA del <Canvas> pero
 * sincronizados al mismo progreso que mueve la cámara 3D, vía el store
 * pub-sub de scroll-progress.ts (PaseCameraRig es el único escritor).
 */
export function PaseInfoCards({ paradas }: Props) {
  const t = useTranslations("pases");
  const progress = useRielProgress();
  const activeIndex = findActiveIndex(paradas, progress);
  const parada = paradas[activeIndex];
  const showHint = progress < 0.03;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
        <AnimatePresence>
          {showHint && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-full border border-borde-sutil bg-fondo-oscuro/70 px-4 py-1.5 text-xs text-stone-300 backdrop-blur-sm"
            >
              {t("recorrido_visual_scroll_hint")}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4 sm:bottom-10">
        <AnimatePresence mode="wait">
          {parada && (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-auto flex max-w-md items-center gap-4 rounded-2xl border border-borde-sutil bg-fondo-oscuro/85 px-5 py-4 backdrop-blur-sm"
            >
              {parada.tipo === "personaje" ? (
                <>
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-stone-900">
                    <Image
                      src={parada.waypoint.imagen}
                      alt={parada.waypoint.alt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-acento-dorado">
                      {t("recorrido_visual_personaje_label")}
                    </p>
                    <p className="truncate font-serif text-base font-semibold text-texto-claro">
                      {parada.waypoint.nombre}
                    </p>
                    {parada.waypoint.dato && (
                      <p className="mt-1 line-clamp-2 text-xs text-stone-400">
                        {parada.waypoint.dato}
                      </p>
                    )}
                    {parada.waypoint.slug && (
                    <Link
                      href={{ pathname: "/personajes/[slug]", params: { slug: parada.waypoint.slug } }}
                      className="mt-1 inline-block text-xs font-medium text-acento-dorado hover:underline"
                    >
                      {t("ver_ficha_personaje", { nombre: parada.waypoint.label })}
                    </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-acento-dorado">
                    {t("recorrido_visual_elemento_label")}
                  </p>
                  <p className="font-serif text-base font-semibold text-texto-claro">
                    {parada.elemento.nombre}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-400">{parada.elemento.texto}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
