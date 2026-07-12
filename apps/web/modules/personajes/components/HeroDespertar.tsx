"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AnimatePresence,
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
  imagenBanner?: { url: string; altText: string } | undefined;
  origenLabel: string;
  accentColor: string;
  audioAmbiente?: string | undefined;
}

const AMBIENT_VOLUME = 0.32;

/**
 * Fase 1 — "Despertar": hero inmersivo del destino del QR.
 * Empieza con pantalla negra; al primer gesto (tap/scroll/tecla) la máscara
 * emerge en capas con parallax (scroll + mouse) y el nombre aparece letra a
 * letra. Audio ambiente con toggle de silencio muy visible y SIN autoplay.
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
  audioAmbiente,
}: HeroDespertarProps) {
  const ref = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const t = useTranslations("experiencia");

  const [awakened, setAwakened] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const fuente = imagenBanner ?? imagen;

  // 12 puntos de luz (los 12 cuernos del Aya Uma; genérico para el resto)
  const { canvasRef } = useParticleCanvas({
    count: 12,
    color: accentColor,
    mode: "drift",
    enabled: awakened,
  });

  // Cada cambio de personaje vuelve al inicio y reinicia la tensión.
  useEffect(() => {
    window.scrollTo(0, 0);
    setAwakened(false);
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
  const chevronOp = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

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

  // ── Despertar al primer gesto del usuario ──
  const awaken = useCallback(() => {
    setAwakened((prev) => (prev ? prev : true));
  }, []);

  useEffect(() => {
    if (awakened) return;
    const onScroll = () => awaken();
    window.addEventListener("wheel", onScroll, { passive: true, once: true });
    window.addEventListener("touchmove", onScroll, { passive: true, once: true });
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => {
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [awakened, awaken]);

  // ── Audio ambiente: opt-in, con fade suave al activar ──
  function toggleSound() {
    const el = audioRef.current;
    if (!el) return;
    if (soundOn) {
      el.pause();
      setSoundOn(false);
    } else {
      el.volume = AMBIENT_VOLUME;
      el.play().then(() => setSoundOn(true)).catch(() => setSoundOn(false));
    }
  }

  // Si abandonan el hero/ruta, detén el audio.
  useEffect(() => {
    const el = audioRef.current;
    return () => {
      if (el) el.pause();
    };
  }, [pathname]);

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
          initial={false}
          animate={
            awakened || reduced
              ? { scale: 1, filter: "blur(0px)" }
              : { scale: 1.35, filter: "blur(18px)" }
          }
          transition={{ duration: reduced ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {fuente ? (
            <Image
              src={fuente.url}
              alt={fuente.altText}
              fill
              className="object-cover"
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

      {/* Toggle de sonido — muy visible, opt-in */}
      {audioAmbiente && (
        <div className="absolute right-5 top-20 z-30 sm:right-6">
          <audio ref={audioRef} src={audioAmbiente} loop preload="none" />
          {/* Ondas del sonido ambiente — solo mientras suena */}
          {soundOn &&
            !reduced &&
            [0, 0.9].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full border"
                style={{ borderColor: accentColor }}
                animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay }}
              />
            ))}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? t("silenciar") : t("activar_sonido")}
            className="relative flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3.5 py-2 text-xs text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
          >
            {soundOn ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="m23 9-6 6M17 9l6 6" />
              </svg>
            )}
            <span className="hidden sm:inline">{soundOn ? t("silenciar") : t("activar_sonido")}</span>
          </button>
        </div>
      )}

      {/* Contenido del hero — aparece al despertar */}
      <motion.div
        style={{ y: contentY, opacity: contentOp }}
        className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-14 sm:px-6 sm:pb-20"
      >
        <AnimatePresence>
          {awakened && (
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
          )}
        </AnimatePresence>
      </motion.div>

      {/* Indicador de scroll — solo tras despertar */}
      {awakened && (
        <motion.div
          style={{ opacity: chevronOp }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.28em] text-stone-400">{t("descubrir")}</span>
          {/* Línea que se dibuja hacia abajo — invitación al descenso */}
          <svg width="2" height="36" viewBox="0 0 2 36" fill="none" aria-hidden="true">
            <motion.line
              x1="1"
              y1="0"
              x2="1"
              y2="36"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0, opacity: 1 }}
              animate={
                reduced
                  ? { pathLength: 1, opacity: 0.7 }
                  : { pathLength: [0, 1, 1], opacity: [0.9, 0.9, 0] }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 2.2, times: [0, 0.72, 1], repeat: Infinity, ease: "easeInOut" }
              }
            />
          </svg>
        </motion.div>
      )}

      {/* ── Overlay negro inicial: la tensión antes del despertar ── */}
      <AnimatePresence>
        {!awakened && (
          <motion.button
            type="button"
            onClick={awaken}
            initial={false}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: "easeInOut" }}
            aria-label={t("despertar", { nombre })}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black focus-visible:outline-none"
          >
            <motion.span
              animate={reduced ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-xs uppercase tracking-[0.4em] text-stone-400">
              {t("toca_para_despertar")}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
