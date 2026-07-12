"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useParticleCanvas } from "@/modules/personajes/hooks/useParticleCanvas";

interface SecretoRitualProps {
  secreto: string;
  accentColor: string;
  artesanoFirma?: string | undefined;
}

type Fase = "sellado" | "convergiendo" | "revelado";

const CHARS_CIFRADO = "ᚠᚱᚴᛆᛐᛘABCDEFGHIKLMNOPQRSTUVXYZ#%&*+·";
const DESCIFRADO_FRAMES = 50;
const DESCIFRADO_MS = 24;

/**
 * "El Ritual del Desbloqueo": el secreto del artesano deja de ser un botón
 * plano. Sellado, un polvo dorado orbita la card (canvas, 30 partículas).
 * Al tocarlo las partículas convergen (0.4s), hay un destello radial y el
 * texto se revela descifrándose carácter a carácter. Un sello circular
 * "SECRETO REVELADO" remata el momento. Es un ritual de una sola vía: una
 * vez revelado, queda revelado. Con prefers-reduced-motion todo es directo.
 */
export function SecretoRitual({ secreto, accentColor, artesanoFirma }: SecretoRitualProps) {
  const reduced = useReducedMotion();
  const [fase, setFase] = useState<Fase>("sellado");
  const [flash, setFlash] = useState(false);
  const selloId = useId();

  const { canvasRef, converge } = useParticleCanvas({
    count: 30,
    color: accentColor,
    mode: "orbit",
    enabled: fase !== "revelado",
  });

  function iniciarRitual() {
    if (fase !== "sellado") return;
    if (reduced) {
      setFase("revelado");
      return;
    }
    setFase("convergiendo");
    converge(() => {
      setFlash(true);
      setFase("revelado");
    });
  }

  const revelado = fase === "revelado";

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-2 sm:px-6">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Polvo dorado orbitando — el sello mágico */}
        {!revelado && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 z-10 h-[calc(100%+3rem)] w-[calc(100%+3rem)] mix-blend-screen"
          />
        )}

        {/* Destello del instante de la revelación */}
        <AnimatePresence>
          {flash && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-10 z-20 rounded-[2rem]"
              style={{
                background: `radial-gradient(50% 50% at 50% 50%, ${accentColor}66 0%, transparent 70%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.35, times: [0, 0.4, 1] }}
              onAnimationComplete={() => setFlash(false)}
            />
          )}
        </AnimatePresence>

        <button
          onClick={iniciarRitual}
          disabled={revelado}
          className="relative w-full rounded-2xl border p-6 text-left transition-colors duration-300 disabled:cursor-default"
          style={{
            borderColor: revelado ? `${accentColor}50` : "#2A2724",
            backgroundColor: revelado ? `${accentColor}0A` : "transparent",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                style={{ color: accentColor }}
                animate={
                  fase === "convergiendo" && !reduced
                    ? { rotate: [0, -8, 10, -6, 0], scale: [1, 1.15, 1] }
                    : {}
                }
                transition={{ duration: 0.4 }}
              >
                {revelado ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 7V5a4 4 0 00-8 0"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                )}
              </motion.svg>
              <span className="text-[9px] uppercase tracking-[0.32em]" style={{ color: accentColor }}>
                Secreto del artesano
              </span>
            </div>
            {!revelado && (
              <motion.span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accentColor }}
                animate={reduced ? {} : { opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>

          <AnimatePresence mode="wait">
            {!revelado ? (
              <motion.p
                key="hint"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-sm italic text-stone-600"
              >
                Hay algo sobre este personaje que pocos saben...
              </motion.p>
            ) : (
              <motion.div
                key="secreto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-base leading-relaxed text-stone-300"
              >
                <TextoDescifrado texto={secreto} />
                {artesanoFirma && (
                  <motion.span
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduced ? 0 : 1.4, duration: 0.5 }}
                    className="mt-3 block text-right text-xs italic text-stone-600"
                  >
                    · {artesanoFirma}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sello circular — aparece al completar el ritual */}
          {revelado && (
            <motion.div
              aria-hidden="true"
              className="absolute -right-2 -top-5 h-16 w-16 sm:-right-4"
              initial={reduced ? { scale: 1, rotate: 15, opacity: 1 } : { scale: 0, rotate: 0, opacity: 0 }}
              animate={{ scale: 1, rotate: 15, opacity: 1 }}
              transition={{ delay: reduced ? 0 : 1.2, type: "spring", stiffness: 260, damping: 17 }}
            >
              <svg viewBox="0 0 64 64" className="h-full w-full">
                <defs>
                  <path id={selloId} d="M 32 10 a 22 22 0 1 1 -0.01 0" fill="none" />
                </defs>
                <circle cx="32" cy="32" r="30" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
                <circle cx="32" cy="32" r="15" fill={`${accentColor}14`} stroke={accentColor} strokeWidth="0.8" />
                <text fontSize="7" letterSpacing="1.8" fill={accentColor} fontFamily="var(--font-sans, sans-serif)">
                  <textPath href={`#${selloId}`}>SECRETO · REVELADO ·</textPath>
                </text>
                <path d="M27 32.5l3.5 3.5 6.5-7" fill="none" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>
      </motion.div>
    </div>
  );
}

/** Caracteres aleatorios que resuelven gradualmente al texto real (~1.2s). */
function TextoDescifrado({ texto }: { texto: string }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? texto : "");

  useEffect(() => {
    if (reduced) {
      setDisplay(texto);
      return;
    }
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const resueltos = Math.floor((frame / DESCIFRADO_FRAMES) * texto.length);
      let out = texto.slice(0, resueltos);
      for (let i = resueltos; i < texto.length; i++) {
        const c = texto[i];
        out += c === " " ? " " : CHARS_CIFRADO[Math.floor(Math.random() * CHARS_CIFRADO.length)];
      }
      setDisplay(out);
      if (resueltos >= texto.length) clearInterval(timer);
    }, DESCIFRADO_MS);
    return () => clearInterval(timer);
  }, [texto, reduced]);

  return <span aria-label={texto}>{display}</span>;
}
