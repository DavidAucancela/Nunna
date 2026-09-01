"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

type RevealBy = "block" | "word";
type RevealMode = "inview" | "scroll";

interface RevealTextProps {
  /** Texto a revelar. Se renderiza siempre en el DOM (SEO / reduced-motion). */
  text: string;
  /** Etiqueta del contenedor (h2, p, span…). Default: span. */
  as?: ElementType;
  className?: string;
  /** "block" = una sola máscara; "word" = una máscara por palabra en stagger. */
  by?: RevealBy;
  /** "inview" = dispara al entrar al viewport; "scroll" = scrubbeado al scroll. */
  mode?: RevealMode;
  /** Retraso inicial (solo mode="inview"). */
  delay?: number;
  /** Separación entre palabras (solo by="word"). */
  stagger?: number;
  /** Repite cada vez que entra (default: una vez). */
  repeat?: boolean;
  /** Contenido extra tras el texto (íconos, etc.). */
  children?: ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const line: Variants = {
  hidden: { y: "115%" },
  visible: { y: "0%", transition: { duration: 0.7, ease: EASE } },
};

/**
 * Revelado tipográfico con máscara: el texto sube desde debajo de un borde
 * oculto (`overflow: hidden`), en vez del clásico fade + translate suelto.
 * - `mode="inview"` usa IntersectionObserver (robusto en iOS, no scroll-linked).
 * - `mode="scroll"` scrubbea el revelado con el progreso de scroll de la sección.
 * Con `prefers-reduced-motion` o antes de montar, renderiza el texto plano.
 *
 * El elemento que observa el viewport siempre tiene caja propia (inline-block /
 * block) — nunca `display:contents` — para que el IntersectionObserver dispare.
 */
export function RevealText({
  text,
  as = "span",
  className,
  by = "block",
  mode = "inview",
  delay = 0,
  stagger = 0.055,
  repeat = false,
  children,
}: RevealTextProps) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // Texto vacío / solo espacios: nada que revelar — se renderiza plano (evita
  // una máscara vacía) pero se conservan los `children` (íconos, etc.).
  if (!ready || reduced || !text.trim()) {
    return createElement(as, { className }, text, children);
  }

  if (mode === "scroll") {
    return (
      <ScrollReveal as={as} className={className} text={text}>
        {children}
      </ScrollReveal>
    );
  }

  if (by === "word") {
    const container: Variants = {
      hidden: {},
      visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
    };
    const tokens = text.split(/(\s+)/);
    const inner = (
      <motion.span
        className="inline-block"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: !repeat, amount: 0.3 }}
      >
        {tokens.map((tok, i) =>
          /^\s+$/.test(tok) ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="reveal-mask inline-block align-bottom">
              <motion.span variants={line} className="inline-block">
                {tok}
              </motion.span>
            </span>
          ),
        )}
        {children}
      </motion.span>
    );
    return createElement(as, { className }, inner);
  }

  const inner = (
    <span className="reveal-mask block">
      <motion.span
        className="block"
        variants={line}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: !repeat, amount: 0.3 }}
        transition={{ delay }}
      >
        {text}
      </motion.span>
    </span>
  );
  return createElement(as, { className }, inner, children);
}

function ScrollReveal({
  as,
  className,
  text,
  children,
}: {
  as: ElementType;
  className?: string | undefined;
  text: string;
  children?: ReactNode | undefined;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.55"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["110%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.7, 1]);

  const inner = (
    <span ref={ref} className="reveal-mask block">
      <motion.span style={{ y, opacity }} className="block">
        {text}
      </motion.span>
    </span>
  );
  return createElement(as, { className }, inner, children);
}
