"use client";

import { motion } from "framer-motion";

interface SimbolismoSectionProps {
  simbolismo: string;
  accentColor: string;
}

export function SimbolismoSection({ simbolismo, accentColor }: SimbolismoSectionProps) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-36">
      {/* Fondo tintado muy sutil con el color del origen */}
      <div className="absolute inset-0" style={{ backgroundColor: `${accentColor}07` }} />

      {/* Comilla decorativa gigante */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none font-serif leading-none opacity-[0.04]"
        style={{ fontSize: "clamp(12rem, 35vw, 26rem)", color: accentColor, lineHeight: 0.85 }}
      >
        &#8220;
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-xl font-light leading-relaxed text-texto-claro sm:text-2xl lg:text-3xl"
        >
          {simbolismo}
        </motion.p>

        {/* Línea que se expande desde el centro */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
          className="mx-auto mt-10 h-px w-16 origin-center"
          style={{ backgroundColor: accentColor }}
        />

        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-3 block text-[9px] uppercase tracking-[0.32em]"
          style={{ color: accentColor }}
        >
          Simbolismo
        </motion.span>
      </div>
    </section>
  );
}
