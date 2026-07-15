"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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

/**
 * "Modo presentación" de la ficha: reemplaza el muro de texto de la narrativa
 * por una secuencia de beats visuales (un elemento generado por el autor + una
 * frase breve). Cada beat entra con un efecto avanzado — la imagen se disuelve
 * desde un zoom desenfocado y el texto sube escalonado — mediante `whileInView`
 * (IntersectionObserver interno de framer, robusto en iOS; NO scroll-linked).
 * Respeta prefers-reduced-motion y ambos temas. Cierra con el ritual del secreto.
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
      <div className="mx-auto max-w-3xl px-5 pt-20 pb-2 sm:px-6 sm:pt-28">
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
          className="block text-[10px] uppercase tracking-[0.32em]"
          style={{ color: accentColor }}
        >
          {t("eyebrow")}
        </motion.span>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-serif text-2xl font-light italic leading-snug sm:text-3xl"
          style={{ color: accentColor }}
        >
          &ldquo;{leyenda}&rdquo;
        </motion.p>
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
// Con reduced-motion, hidden === visible (sin desplazamiento ni fade), así el
// contenido queda visible sin animación en vez de esconderse.
const lineaVariants = (reduced: boolean): Variants =>
  reduced
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 22 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
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

  return (
    <div className="flex min-h-[80vh] items-center py-14 sm:min-h-[88vh] sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${flipped ? "lg:[&>*:first-child]:order-2" : ""}`}>
          {/* Visual */}
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 1.1, filter: "blur(16px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
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
                <Image
                  src={beat.visual}
                  alt={beat.altText}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 92vw, 560px"
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
          </motion.div>

          {/* Texto */}
          <motion.div
            variants={textoVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <motion.span
              variants={linea}
              className="block font-sans text-xs font-medium tracking-wide"
              style={{ color: accentColor }}
            >
              {beat.kicker ?? contador}
            </motion.span>

            {beat.titulo && (
              <motion.h3
                variants={linea}
                className="mt-3 font-serif text-3xl font-bold leading-tight text-texto-claro sm:text-4xl"
              >
                {beat.titulo}
              </motion.h3>
            )}

            <motion.div
              variants={linea}
              className="mt-5 h-px w-10 origin-left"
              style={{ backgroundColor: accentColor, scaleX: 1 }}
            />

            {beat.texto && (
              <motion.p
                variants={linea}
                className="mt-6 text-lg leading-relaxed text-stone-300 sm:text-xl"
              >
                {renderConTerminos(beat.texto, palabrasClave ?? [], accentColor)}
              </motion.p>
            )}

            {/* Progreso de la secuencia */}
            <motion.div
              variants={linea}
              className="mt-8 flex items-center gap-1.5"
              aria-hidden="true"
            >
              {Array.from({ length: total }).map((_, d) => (
                <span
                  key={d}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: d === index ? 20 : 6,
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
