"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTilt3D } from "@/modules/personajes/hooks/useTilt3D";

interface StatsAnimadosProps {
  origenLabel: string;
  accentColor: string;
  /** Nº de fiestas donde desfila (0 = sin cruce en pases.json → texto genérico). */
  festividadCount: number;
  festividadTexto: string;
  nombresAlt: string[];
}

/**
 * "Los Números Sagrados": la ficha de datos deja de ser una grilla plana.
 * Cada dato es una tarjeta con ícono SVG propio que se dibuja al entrar al
 * viewport (chakana / máscara / los tres mundos convergentes), contador
 * animado donde hay número real, y tilt 3D suave siguiendo el mouse.
 */
export function StatsAnimados({
  origenLabel,
  accentColor,
  festividadCount,
  festividadTexto,
  nombresAlt,
}: StatsAnimadosProps) {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard accentColor={accentColor} etiqueta="Origen" icono={<IconoChakana color={accentColor} />}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              color: accentColor,
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}10`,
            }}
          >
            <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: accentColor }} />
            {origenLabel}
          </span>
        </StatCard>

        <StatCard accentColor={accentColor} etiqueta="Festividad" icono={<IconoMascara color={accentColor} />}>
          {festividadCount > 0 ? (
            <p className="text-sm leading-snug text-stone-300">
              <ContadorSagrado value={festividadCount} accentColor={accentColor} />{" "}
              {festividadCount === 1 ? "fiesta popular" : "fiestas populares"} del Ecuador
            </p>
          ) : (
            <p className="text-sm leading-snug text-stone-300">{festividadTexto}</p>
          )}
        </StatCard>

        <StatCard
          accentColor={accentColor}
          etiqueta={nombresAlt.length > 1 ? "También conocido como" : "Nombre alternativo"}
          icono={<IconoConvergencia color={accentColor} />}
        >
          {nombresAlt.length > 0 ? (
            <p className="text-sm italic leading-snug text-stone-400">{nombresAlt.join(", ")}</p>
          ) : (
            <p className="text-sm text-stone-700">—</p>
          )}
        </StatCard>
      </div>
    </section>
  );
}

function StatCard({
  etiqueta,
  icono,
  accentColor,
  children,
}: {
  etiqueta: string;
  icono: ReactNode;
  accentColor: string;
  children: ReactNode;
}) {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt3D(6);

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ borderColor: `${accentColor}50` }}
      className="rounded-2xl border border-borde-sutil bg-stone-900/40 px-6 py-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600">{etiqueta}</p>
        {icono}
      </div>
      {children}
    </motion.div>
  );
}

/** Contador 0 → n al entrar al viewport. */
function ContadorSagrado({ value, accentColor }: { value: number; accentColor: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!isInView || reduced) return;
    const pasos = Math.max(value * 6, 12);
    let actual = 0;
    const timer = setInterval(() => {
      actual += value / pasos;
      if (actual >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(actual));
      }
    }, 900 / pasos);
    return () => clearInterval(timer);
  }, [isInView, reduced, value]);

  return (
    <span ref={ref} className="font-serif text-base font-bold tabular-nums" style={{ color: accentColor }}>
      {count}
    </span>
  );
}

// ── Íconos SVG — se dibujan (pathLength) al entrar al viewport ────────────────

function trazoAnimado(reduced: boolean | null) {
  return {
    initial: reduced ? false : ({ pathLength: 0, opacity: 0 } as const),
    whileInView: { pathLength: 1, opacity: 1 } as const,
    viewport: { once: true, amount: 0.8 } as const,
    transition: { duration: reduced ? 0 : 1.1, ease: "easeInOut" as const },
  };
}

/** Sol andino — chakana simplificada. */
function IconoChakana({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const anim = trazoAnimado(reduced);
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path
        d="M9 3h6v3h3v3h3v6h-3v3h-3v3H9v-3H6v-3H3V9h3V6h3V3Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
        {...anim}
      />
      <motion.circle cx="12" cy="12" r="2.4" stroke={color} strokeWidth="1.3" {...anim} />
    </svg>
  );
}

/** Máscara estilizada. */
function IconoMascara({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const anim = trazoAnimado(reduced);
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path
        d="M5 4c2.3 1 4.6 1.5 7 1.5S16.7 5 19 4v8.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V4Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
        {...anim}
      />
      <motion.path d="M8.5 11c.6-.8 1.6-.8 2.2 0M13.3 11c.6-.8 1.6-.8 2.2 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" {...anim} />
      <motion.path d="M9.5 15.5c1.6 1.2 3.4 1.2 5 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" {...anim} />
    </svg>
  );
}

/** Tres líneas que convergen — los mundos que el personaje une. */
function IconoConvergencia({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const anim = trazoAnimado(reduced);
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path d="M4 5c6 2 10 8 8 15M20 5c-6 2-10 8-8 15M12 4v16" stroke={color} strokeWidth="1.3" strokeLinecap="round" {...anim} />
      <motion.circle cx="12" cy="20" r="1.6" stroke={color} strokeWidth="1.3" {...anim} />
    </svg>
  );
}
