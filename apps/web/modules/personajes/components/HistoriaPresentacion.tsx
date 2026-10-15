"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { PresentacionBeat } from "@seres-del-pase/types";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { renderConTerminos } from "../kichwaGlosario";
import { SecretoRitual } from "./SecretoRitual";

interface HistoriaPresentacionProps {
  beats: PresentacionBeat[];
  secreto: string;
  accentColor: string;
  nombre: string;
  origen?: string | undefined;
  artesanoFirma?: string | undefined;
  /** Términos a resaltar (kichwa → tooltip) en las frases de los beats. */
  palabrasClave?: string[] | undefined;
}

/**
 * "Modo presentación" de la ficha, como "Cómo funciona" del inicio: una escena
 * anclada en pantalla — primero el título y luego cada beat (visual + frase) —
 * que el scroll va cambiando con un fundido, sin que el contenido se desplace.
 * Cierra con el ritual del secreto.
 */
export function HistoriaPresentacion({
  beats,
  secreto,
  accentColor,
  nombre,
  origen,
  artesanoFirma,
  palabrasClave,
}: HistoriaPresentacionProps) {
  const reduced = useReducedMotion();
  const t = useTranslations("presentacion");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const escenas = beats.length;

  useEffect(() => {
    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      setActive(Math.min(escenas - 1, Math.floor(progress * escenas)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [escenas]);

  const beat = beats[active];

  return (
    <section className="border-t border-borde-sutil">
      <div ref={trackRef} style={{ height: `${escenas * 100}vh` }}>
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col px-5 pb-16 pt-5 sm:px-6 sm:pt-8">
          {/* Título fijo: acompaña a cada punto */}
          <h2 className="font-display shrink-0 text-center text-[clamp(1.6rem,4.5vw,3rem)] leading-none text-texto-claro">
            {t("titulo")}
          </h2>
          <div className="flex min-h-0 flex-1 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="mx-auto w-full max-w-6xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.5, ease: "easeInOut" }}
            >
              {beat ? (
                <div className="grid items-center gap-4 lg:grid-cols-2 lg:gap-12">
                  <div className="relative mx-auto aspect-[4/5] h-[min(28dvh,520px)] overflow-hidden rounded-2xl border border-borde-sutil bg-stone-950 lg:aspect-square lg:h-[min(56dvh,500px)]">
                    {beat.visual ? (
                      <Image
                        src={beat.visual}
                        alt={beat.altText}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 80vw, 560px"
                      />
                    ) : (
                      <OrigenPlaceholder
                        origen={origen}
                        nombre={nombre}
                        variant="hero"
                        uid={`beat-${beat.id}`}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                  <div className="text-center lg:text-left">
                    <span
                      className="block font-sans text-xs font-medium uppercase tracking-[0.28em]"
                      style={{ color: accentColor }}
                    >
                      {beat.kicker ?? t("contador", { n: active + 1, total: beats.length })}
                    </span>
                    {beat.titulo && (
                      <h3 className="font-display mt-2 text-[clamp(1.4rem,4vw,2.5rem)] leading-[1.1] text-texto-claro">
                        {beat.titulo}
                      </h3>
                    )}
                    <div
                      className="mx-auto mt-3 h-px w-12 lg:mx-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    {beat.texto && (
                      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-base lg:mx-0 lg:text-lg">
                        {renderConTerminos(beat.texto, palabrasClave ?? [], accentColor)}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
          </div>

          {/* Pista: seguir con el scroll */}
          <div aria-hidden className="absolute inset-x-0 bottom-11 flex justify-center">
          <motion.p
            className="flex items-center gap-1.5 whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-stone-500"
            animate={reduced ? { y: 0, opacity: 1 } : { y: [0, 4, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {t("seguir")}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.p>
          </div>

          {/* Progreso: un punto por escena */}
          <div aria-hidden className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {Array.from({ length: escenas }, (_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: i === active ? 24 : 6,
                  backgroundColor: i === active ? accentColor : "#57534e",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Cierre: el ritual del secreto del artesano ── */}
      <SecretoRitual secreto={secreto} accentColor={accentColor} artesanoFirma={artesanoFirma} />
    </section>
  );
}
