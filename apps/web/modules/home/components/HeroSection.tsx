"use client";

import { Link } from "@/i18n/navigation";
import { useRef, useEffect, useState, lazy, Suspense } from "react";
const QrScanner = lazy(() => import("@/components/ui/QrScanner").then(m => ({ default: m.QrScanner })));
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useTranslations } from "next-intl";

/* ─── Letra con parallax 3D ─── */
interface NunnaLetterProps {
  char: string;
  index: number;
  weight: number;      // 1.0 = centro (máximo movimiento), 0.2 = extremo
  mouseX: MotionValue<number>;
}

function NunnaLetter({ char, index, weight, mouseX }: NunnaLetterProps) {
  const reduced = useReducedMotion();

  const maxX = 30 * weight;
  const targetX = useTransform(mouseX, [-1, 1], [-maxX, maxX]);
  const stiffness = 60 + weight * 40;   // 68 – 100
  const damping   = 14 + weight * 8;    // 16 – 22
  const springX = useSpring(targetX, { stiffness, damping });

  if (reduced) {
    return <span className="inline-block">{char}</span>;
  }

  // Un solo motion.span: animate controla opacity/y/rotateX (entrada),
  // style controla x (parallax horizontal, sin conflicto), whileHover controla scale.
  return (
    <motion.span
      className="inline-block cursor-default text-shimmer"
      initial={{ opacity: 0, y: 50, rotateX: -45 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.35 + index * 0.09, duration: 0.75, ease: [0.215, 0.61, 0.355, 1] }}
      style={{ x: springX }}
      whileHover={{ scale: 1.14, transition: { duration: 0.12, ease: "easeOut" } }}
    >
      {char}
    </motion.span>
  );
}

/* ─── Título "Nunna" ─── */
function NunnaTitle({
  texto,
  mouseX,
}: {
  texto: string;
  mouseX: MotionValue<number>;
}) {
  const letters = texto.split("");
  const n = letters.length;

  return (
    <h1
      className="mt-4 not-italic"
      style={{
        fontSize: "clamp(5.5rem, 22vw, 15rem)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        perspective: "900px",
      }}
    >
      {letters.map((char, i) => {
        // Peso: 1.0 en el centro, ~0.22 en los extremos (curva suave)
        const centerIdx = (n - 1) / 2;
        const dist = Math.abs(i - centerIdx) / (centerIdx || 1);
        const weight = 1 - dist * 0.78;

        return (
          <NunnaLetter
            key={i}
            char={char}
            index={i}
            weight={weight}
            mouseX={mouseX}
          />
        );
      })}
    </h1>
  );
}

/* ─── Botón magnético ─── */
function MagneticButton({
  href,
  onClick,
  variant,
  children,
}: {
  href?: string;
  onClick?: () => void;
  variant: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 15 });
  const sy = useSpring(y, { stiffness: 150, damping: 15 });

  function onMouseMove(e: React.MouseEvent) {
    if (reduced) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.35);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.35);
  }
  function onMouseLeave() { x.set(0); y.set(0); }

  const base = "rounded-full px-10 py-4 text-base font-semibold transition-colors";
  const cls =
    variant === "primary"
      ? "bg-acento-rojo text-white shadow-lg shadow-acento-rojo/30 hover:bg-red-700 hover:shadow-acento-rojo/50"
      : "border border-stone-600 text-stone-300 hover:border-acento-dorado/60 hover:text-texto-claro";

  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <motion.div style={{ x: sx, y: sy }}>
        {href ? (
          <Link href={href as "/personajes" | "/calendario" | "/sobre"} className={`${base} ${cls}`}>{children}</Link>
        ) : (
          <button type="button" onClick={onClick} className={`${base} ${cls}`}>{children}</button>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Hero principal ─── */
export function HeroSection() {
  const t = useTranslations("home");
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hasHover, setHasHover] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  // El video trae audio propio; empieza silenciado porque los navegadores exigen
  // `muted` para permitir autoplay — el botón activa sonido con el primer gesto del usuario.
  const [soundOn, setSoundOn] = useState(false);
  useEffect(() => {
    setHasHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  function toggleSound() {
    const el = videoRef.current;
    if (!el) return;
    const next = !soundOn;
    el.muted = !next;
    setSoundOn(next);
  }

  // Posición X del mouse normalizada a [-1, 1]
  const mouseXRaw = useMotionValue(0);

  function onMouseMove(e: React.MouseEvent) {
    if (reduced || !hasHover) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseXRaw.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2));
  }

  function onMouseLeave() {
    mouseXRaw.set(0);
  }

  return (
    <section
      ref={sectionRef}
      // El hero es un video oscuro: se mantiene en tema oscuro en ambos modos
      // (la clase `dark` fuerza los tokens oscuros aquí) para conservar el contraste.
      className="dark relative -mt-16 flex min-h-screen items-center justify-center overflow-hidden bg-fondo-oscuro"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Video de fondo */}
      <div className="absolute inset-0 bg-fondo-oscuro">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/pases-videos/main-header-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden="true"
        >
          <source src="/pases-videos/main-header.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Toggle de sonido — grande y muy visible, opt-in (el video empieza mudo) */}
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? t("hero.silenciar") : t("hero.activar_sonido")}
        className="absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
      >
        {soundOn ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="m23 9-6 6M17 9l6 6" />
          </svg>
        )}
      </button>

      {/* Overlays */}
      <div className="absolute inset-0 bg-fondo-oscuro/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-fondo-oscuro/40 via-transparent to-fondo-oscuro/20" />

      {/* Contenido */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">

        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 1.2, delay: 0.15 }}
          className="font-sans text-sm uppercase tracking-[0.3em] text-stone-500 sm:text-base"
        >
          Riobamba · Chimborazo · Ecuador
        </motion.p>

        <NunnaTitle texto={t("hero.titulo")} mouseX={mouseXRaw} />

        <div className="mt-6 overflow-hidden">
          <motion.p
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.95, ease: "easeOut" }}
            className="mx-auto max-w-2xl font-serif text-lg leading-relaxed text-stone-400 sm:text-xl md:text-2xl"
          >
            {t("hero.subtitulo")}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <MagneticButton onClick={() => setScannerOpen(true)} variant="primary">
            Escanea tu QR
          </MagneticButton>
          {scannerOpen && (
            <Suspense fallback={null}>
              <QrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />
            </Suspense>
          )}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.28em] text-stone-600">Descubrir</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-stone-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
