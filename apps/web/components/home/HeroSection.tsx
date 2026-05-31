"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const ORBS = [
  {
    animate: { y: [0, -30, 0], x: [0, 10, 0] },
    transition: { duration: 12, repeat: Infinity, ease: "easeInOut" as const },
    className: "absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-acento-dorado/10 blur-3xl",
  },
  {
    animate: { y: [0, 20, 0], x: [0, -15, 0] },
    transition: { duration: 9, repeat: Infinity, ease: "easeInOut" as const, delay: 2 },
    className: "absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full bg-acento-jade/10 blur-3xl",
  },
  {
    animate: { y: [0, -15, 0] },
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay: 4 },
    className: "absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acento-rojo/8 blur-3xl",
  },
];

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="-mt-16 relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-stone-950" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {ORBS.map((orb, i) => (
          <motion.div
            key={i}
            animate={orb.animate}
            transition={orb.transition}
            className={orb.className}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 font-serif text-sm uppercase tracking-[0.3em] text-acento-dorado"
        >
          Riobamba · Chimborazo · Ecuador
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif font-bold leading-none text-gradient-dorado"
          style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)", letterSpacing: "-0.03em" }}
        >
          {t("hero.titulo")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-stone-400 md:text-xl"
        >
          {t("hero.subtitulo")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            href="/personajes"
            className="rounded-full bg-acento-rojo px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-acento-rojo/25 transition-all hover:bg-red-700 hover:shadow-acento-rojo/40"
          >
            {t("hero.cta_principal")}
          </Link>
          <Link
            href="/pases"
            className="rounded-full border border-stone-700 px-8 py-3.5 text-sm font-semibold text-stone-300 transition-all hover:border-acento-dorado/50 hover:text-texto-claro"
          >
            {t("hero.cta_secundario")}
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-stone-600">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}
