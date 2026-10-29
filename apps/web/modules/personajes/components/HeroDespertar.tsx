"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { StaggerLetters } from "@/components/ui/FadeUp";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { useParticleCanvas } from "@/modules/personajes/hooks/useParticleCanvas";
import type { TipoOrigen } from "@seres-del-pase/types";

interface HeroDespertarProps {
  nombre: string;
  nombreKichwa?: string | undefined;
  nombresAlt: string[];
  origen?: TipoOrigen | undefined;
  imagen?: { url: string; altText: string } | undefined;
  /** `posicion` = foco de la foto (CSS object-position). */
  imagenBanner?: { url: string; altText: string; posicion?: string } | undefined;
  origenLabel: string;
  accentColor: string;
}

/**
 * Fase 1 — "Despertar": hero inmersivo del destino del QR.
 * Empieza con pantalla negra; al primer gesto (tap/scroll/tecla) la máscara
 * emerge en capas con parallax (scroll + mouse) y el nombre aparece letra a
 * letra. Sin audio: el botón de sonido ambiente se retiró (2026-10-27).
 * Respeta prefers-reduced-motion y funciona en tema claro y oscuro.
 */
export function HeroDespertar({
  nombre,
  nombreKichwa,
  nombresAlt,
  origen,
  imagen,
  imagenBanner,
  origenLabel,
  accentColor,
}: HeroDespertarProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const t = useTranslations("experiencia");

  const fuente: { url: string; altText: string; posicion?: string } | undefined = imagenBanner ?? imagen;

  // 12 puntos de luz (los 12 cuernos del Aya Uma; genérico para el resto)
  const { canvasRef } = useParticleCanvas({
    count: 12,
    color: accentColor,
    mode: "drift",
    enabled: true,
  });

  // Cada cambio de personaje vuelve al inicio del scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // ── Parallax por scroll: la imagen sube más lento que el contenido ──
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yFondo = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "10%"]);
  const yMascara = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "22%"]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ["0%", reduced ? "0%" : "-12%"]);
  const contentOp = useTransform(scrollYProgress, [0, 0.4], [1, reduced ? 1 : 0]);

  // ── Parallax por mouse: cada capa reacciona a distinta intensidad ──
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  const xFondo = useTransform(sx, [-0.5, 0.5], reduced ? [0, 0] : [14, -14]);
  const yFondoM = useTransform(sy, [-0.5, 0.5], reduced ? [0, 0] : [10, -10]);
  const xMascara = useTransform(sx, [-0.5, 0.5], reduced ? [0, 0] : [30, -30]);
  const yMascaraM = useTransform(sy, [-0.5, 0.5], reduced ? [0, 0] : [22, -22]);
  const xOrnamento = useTransform(sx, [-0.5, 0.5], reduced ? [0, 0] : [48, -48]);
  const yOrnamento = useTransform(sy, [-0.5, 0.5], reduced ? [0, 0] : [34, -34]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="-mt-16 relative flex min-h-[100svh] items-end overflow-hidden bg-black"
    >
      {/* ── Capa 1: fondo (desenfocado, lento) ── */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: "-18%", bottom: "-18%", y: yFondo, x: xFondo, translateY: yFondoM }}
      >
        {fuente ? (
          <Image
            src={fuente.url}
            alt=""
            aria-hidden="true"
            fill
            className="scale-125 object-cover blur-2xl brightness-50"
            style={{ objectPosition: fuente.posicion }}
            priority
            sizes="100vw"
          />
        ) : null}
      </motion.div>

      {/* ── Capa 2: máscara (imagen nítida, principal) ── */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: "-15%", bottom: "-15%", y: yMascara, x: xMascara, translateY: yMascaraM }}
      >
        {/* Entrada cinematográfica: zoom-out desde recorte extremo + blur que se disuelve */}
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { scale: 1.35, filter: "blur(18px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: reduced ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {fuente ? (
            <Image
              src={fuente.url}
              alt={fuente.altText}
              fill
              className="object-cover"
              style={{ objectPosition: fuente.posicion }}
              priority
              sizes="100vw"
            />
          ) : (
            <OrigenPlaceholder origen={origen} nombre={nombre} variant="hero" className="h-full w-full" />
          )}
        </motion.div>
      </motion.div>

      {/* ── Capa 3: ornamentos (resplandor del acento + viñeta, rápido) ── */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ x: xOrnamento, y: yOrnamento }}
      >
        <div
          className="absolute -inset-[10%] opacity-40 mix-blend-screen"
          style={{
            background: `radial-gradient(60% 50% at 50% 38%, ${accentColor}55 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* ── Capa de partículas: 12 puntos de luz que ascienden (canvas nativo) ── */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] h-full w-full mix-blend-screen"
      />

      {/* Gradientes dramáticos — funden hacia el fondo de la página (claro u oscuro) */}
      <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-fondo-oscuro/35 to-transparent" />

      {/* Breadcrumb */}
      <div className="absolute left-5 top-20 z-20 sm:left-6">
        <Link
          href="/personajes"
          className="flex items-center gap-1.5 text-xs text-stone-300 transition-colors hover:text-acento-dorado"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 14 14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12L5 7l4-5" />
          </svg>
          Todos los personajes
        </Link>
      </div>

      {/* Contenido del hero */}
      <motion.div
        style={{ y: contentY, opacity: contentOp }}
        className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-14 sm:px-6 sm:pb-20"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="mb-1 text-xs uppercase tracking-[0.32em] text-stone-300"
          >
            {t("preludio")}
          </p>

          {nombreKichwa && nombreKichwa !== nombre && (
            <p className="font-serif text-base italic sm:text-lg" style={{ color: accentColor }}>
              {nombreKichwa}
            </p>
          )}

          <h1
            className="mt-1 font-serif font-bold leading-none text-white"
            style={{
              fontSize:
                nombre.length <= 8
                  ? "clamp(3.5rem, 10vw, 7rem)"
                  : nombre.length <= 12
                  ? "clamp(3rem, 8vw, 5.5rem)"
                  : "clamp(2.5rem, 6vw, 4.5rem)",
            }}
          >
            <StaggerLetters text={nombre} delay={0.15} />
          </h1>

          {nombresAlt.length > 0 && (
            <motion.p
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-3 text-sm italic text-stone-400"
            >
              {nombresAlt.join(" · ")}
            </motion.p>
          )}

          {origenLabel && (
            <motion.span
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.75 }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur-sm"
              style={{
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
              {origenLabel}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
