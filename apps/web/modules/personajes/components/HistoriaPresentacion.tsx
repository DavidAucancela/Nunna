"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { useTranslations } from "next-intl";
import type { PresentacionBeat } from "@seres-del-pase/types";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { renderConTerminos } from "../kichwaGlosario";
import { SecretoRitual } from "./SecretoRitual";

interface HistoriaPresentacionProps {
  leyenda: string;
  beats: PresentacionBeat[];
  secreto: string;
  accentColor: string;
  nombre: string;
  origen?: string | undefined;
  artesanoFirma?: string | undefined;
  /** Términos a resaltar (kichwa → tooltip) en las frases de los beats. */
  palabrasClave?: string[] | undefined;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Modo presentación" de la ficha: reemplaza el muro de texto de la narrativa
 * por una secuencia de beats visuales (un elemento generado por el autor + una
 * frase breve). Cada beat entra con efectos avanzados — la imagen se disuelve
 * desde un zoom desenfocado y hace parallax al scroll, un numeral display
 * gigante flota detrás del texto, y cada línea sube desde una máscara — con
 * `whileInView` (IntersectionObserver, robusto en iOS) para la entrada y
 * `useScroll` por beat para el parallax. Respeta prefers-reduced-motion y ambos
 * temas. Cierra con el ritual del secreto.
 */
export function HistoriaPresentacion({
  leyenda,
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

  return (
    <section className="border-t border-borde-sutil">
      {/* ── Encabezado + leyenda como apertura ── */}
      <div className="mx-auto max-w-4xl px-5 pt-24 pb-4 sm:px-6 sm:pt-32">
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
          className="block text-[11px] uppercase tracking-[0.34em]"
          style={{ color: accentColor }}
        >
          {t("eyebrow")}
        </motion.span>
        <span className="reveal-mask mt-5 block">
          <motion.p
            initial={reduced ? false : { y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="font-display-italic text-[clamp(1.75rem,5vw,3rem)] leading-[1.12]"
            style={{ color: accentColor }}
          >
            &ldquo;{leyenda}&rdquo;
          </motion.p>
        </span>
      </div>

      {/* ── Secuencia de beats ── */}
      <div>
        {beats.map((beat, i) => (
          <Beat
            key={beat.id}
            beat={beat}
            index={i}
            total={beats.length}
            accentColor={accentColor}
            nombre={nombre}
            origen={origen}
            palabrasClave={palabrasClave}
            reduced={!!reduced}
            contador={t("contador", { n: i + 1, total: beats.length })}
          />
        ))}
      </div>

      {/* ── Cierre: el ritual del secreto del artesano ── */}
      <SecretoRitual secreto={secreto} accentColor={accentColor} artesanoFirma={artesanoFirma} />
    </section>
  );
}

const textoVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
// Con reduced-motion, hidden === visible (sin desplazamiento), así el contenido
// queda visible sin animación en vez de esconderse dentro de la máscara.
const lineaVariants = (reduced: boolean): Variants =>
  reduced
    ? { hidden: { y: "0%" }, visible: { y: "0%" } }
    : {
        hidden: { y: "115%" },
        visible: { y: "0%", transition: { duration: 0.7, ease: EASE } },
      };

function Beat({
  beat,
  index,
  total,
  accentColor,
  nombre,
  origen,
  palabrasClave,
  reduced,
  contador,
}: {
  beat: PresentacionBeat;
  index: number;
  total: number;
  accentColor: string;
  nombre: string;
  origen?: string | undefined;
  palabrasClave?: string[] | undefined;
  reduced: boolean;
  contador: string;
}) {
  // Alterna el lado del visual en escritorio para dar ritmo a la secuencia.
  const flipped = index % 2 === 1;
  const linea = lineaVariants(reduced);

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Parallax: la imagen se mueve más lento que el scroll; el numeral fantasma
  // deriva en sentido contrario.
  const imgY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-8%", "8%"]);
  const ghostY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [60, -60]);

  return (
    <div
      ref={ref}
      className="relative flex min-h-[80vh] items-center overflow-hidden py-16 sm:min-h-[90vh] sm:py-24"
    >
      {/* Numeral display fantasma */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 z-0 -translate-y-1/2 select-none ${
          flipped ? "right-[2vw]" : "left-[2vw]"
        }`}
      >
        <motion.span
          style={{ y: ghostY, color: accentColor }}
          className="font-display block text-[26vw] leading-none opacity-[0.06] sm:text-[15rem]"
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>
      </span>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div
          className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
            flipped ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          {/* Visual */}
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 1.12, filter: "blur(18px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1, ease: EASE }}
            className="relative"
          >
            {/* Glow de acento detrás del visual */}
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 rounded-[2rem] opacity-40 blur-2xl"
              style={{ background: `radial-gradient(50% 50% at 50% 50%, ${accentColor}40 0%, transparent 70%)` }}
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-borde-sutil bg-stone-950 sm:aspect-square">
              {beat.visual ? (
                <motion.div style={{ y: imgY }} className="absolute inset-0 scale-[1.16]">
                  <Image
                    src={beat.visual}
                    alt={beat.altText}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 92vw, 560px"
                  />
                </motion.div>
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
          </motion.div>

          {/* Texto */}
          <motion.div
            className="relative z-10"
            variants={textoVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <span className="reveal-mask block">
              <motion.span
                variants={linea}
                className="block font-sans text-xs font-medium uppercase tracking-[0.28em]"
                style={{ color: accentColor }}
              >
                {beat.kicker ?? contador}
              </motion.span>
            </span>

            {beat.titulo && (
              <span className="reveal-mask mt-4 block">
                <motion.h3
                  variants={linea}
                  className="font-display block text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.02] text-texto-claro"
                >
                  {beat.titulo}
                </motion.h3>
              </span>
            )}

            <motion.div
              variants={{
                hidden: { scaleX: reduced ? 1 : 0 },
                visible: { scaleX: 1, transition: { duration: 0.6, ease: EASE } },
              }}
              className="mt-6 h-px w-12 origin-left"
              style={{ backgroundColor: accentColor }}
            />

            {beat.texto && (
              <span className="reveal-mask mt-6 block">
                <motion.p
                  variants={linea}
                  className="block text-lg leading-relaxed text-stone-300 sm:text-2xl sm:leading-relaxed"
                >
                  {renderConTerminos(beat.texto, palabrasClave ?? [], accentColor)}
                </motion.p>
              </span>
            )}

            {/* Progreso de la secuencia */}
            <motion.div
              variants={linea}
              className="mt-10 flex items-center gap-1.5"
              aria-hidden="true"
            >
              {Array.from({ length: total }).map((_, d) => (
                <span
                  key={d}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: d === index ? 24 : 6,
                    backgroundColor: d === index ? accentColor : "#2A2724",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
