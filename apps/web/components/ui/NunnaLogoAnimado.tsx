"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Entrada del logo (header, al cargar la página):
 *  1. Un punto recorre la N como el recorrido de un pase y va dejando el camino, tramo por tramo
 *     (rojo → dorado → jade).
 *  2. Al llegar, aparece la placa oscura y se traza su filete dorado → el isotipo completo.
 *  3. El nombre "Nunna" se descubre de izquierda a derecha.
 * Mismo dibujo que `NunnaIsotipo` / `public/favicon.svg`. Con `prefers-reduced-motion` se muestra quieto.
 */

const TRAMOS = [
  { d: "M14 52C14 31 17 14 23 14", color: "#B8312F" },
  { d: "M23 14c6 0 9 38 18 38", color: "#C89B3C" },
  { d: "M41 52c7 0 9-26 9-38", color: "#2F7A63" },
] as const;
const RUTA = "M14 52C14 31 17 14 23 14c6 0 9 38 18 38c7 0 9-26 9-38";

const T_TRAMO = 0.5; // s por tramo
const T_RUTA = T_TRAMO * TRAMOS.length; // fin del recorrido
const T_PLACA = T_RUTA + 0.05;
const T_NOMBRE = T_PLACA + 0.45;
const EASE = [0.65, 0, 0.35, 1] as const;

export function NunnaLogoAnimado({
  className,
  nombreClassName,
}: {
  className?: string;
  nombreClassName?: string;
}) {
  const quieto = useReducedMotion();

  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        {/* 2 · placa + filete */}
        <motion.rect
          width="64"
          height="64"
          rx="14"
          fill="#0F0E0C"
          initial={quieto ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: T_PLACA, duration: 0.4, ease: "easeOut" }}
          style={{ transformOrigin: "32px 32px" }}
        />
        <motion.rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="12"
          fill="none"
          stroke="#C89B3C"
          strokeWidth="2"
          initial={quieto ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: T_PLACA + 0.1, duration: 0.6, ease: "easeInOut" }}
        />

        {/* 1 · el recorrido, tramo por tramo */}
        <g fill="none" strokeWidth="6.5" strokeLinecap="round">
          {TRAMOS.map((t, i) => (
            <motion.path
              key={t.d}
              d={t.d}
              stroke={t.color}
              initial={quieto ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { delay: i * T_TRAMO, duration: T_TRAMO, ease: "linear" },
                opacity: { delay: i * T_TRAMO, duration: 0.01 },
              }}
            />
          ))}
        </g>

        {/* el caminante: punto que va a la cabeza del trazo y se apaga al llegar */}
        {!quieto && (
          // animateMotion nativo (SMIL): framer-motion pasa offsetDistance como atributo del <circle>
          // → warning de React + mismatch de hidratación. SMIL no toca React y corre al cargar el SVG.
          <circle r="4.2" fill="#F5F1EA" cx="0" cy="0">
            <animateMotion dur={`${T_RUTA}s`} path={RUTA} fill="freeze" calcMode="linear" />
            <animate
              attributeName="opacity"
              values="1;1;0"
              keyTimes="0;0.9;1"
              dur={`${T_RUTA + 0.3}s`}
              fill="freeze"
            />
          </circle>
        )}
      </svg>

      {/* 3 · el nombre — se revela con clip-path (no con opacidad por letra: ver gotcha text-shimmer) */}
      <motion.span
        initial={quieto ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ delay: T_NOMBRE, duration: 0.7, ease: EASE }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className={nombreClassName}
      >
        Nunna
      </motion.span>
    </span>
  );
}
