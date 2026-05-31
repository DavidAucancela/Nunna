"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => { setReady(true); }, []);

  if (!ready || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeUpGroup({ children, className }: { children: ReactNode; className?: string }) {
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => { setReady(true); }, []);

  if (!ready || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeUpItem({ children, className }: { children: ReactNode; className?: string }) {
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => { setReady(true); }, []);

  if (!ready || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Anima cada letra del texto en stagger al montar el componente.
 * Ideal para h1 de fichas de personaje.
 */
export function StaggerLetters({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => { setReady(true); }, []);

  if (!ready || reduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      className={`inline-block ${className ?? ""}`}
      style={{ perspective: "800px" }}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.04, delayChildren: delay } },
        hidden: {},
      }}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 28, rotateX: -35 },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              transition: { duration: 0.55, ease: [0.215, 0.61, 0.355, 1] },
            },
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
