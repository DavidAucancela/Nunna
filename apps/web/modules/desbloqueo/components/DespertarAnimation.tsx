"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import type { PersonajeLite } from "./DesbloquearForm";

/**
 * Overlay de pantalla completa tras un canje exitoso: mosaico con TODOS los
 * personajes del catálogo; los desbloqueados se "iluminan" (el velo oscuro se
 * desvanece), los bloqueados quedan en penumbra. Llama onDone() al terminar.
 *
 * El grid se dimensiona según cuántos personajes haya (no fijo a 2×2): así el
 * mosaico sigue siendo honesto sobre el estado de la colección cuando el
 * catálogo crece más allá de 4.
 */
export function DespertarAnimation({
  personajes,
  unlockedSlugs,
  nombreNuevo,
  onDone,
}: {
  personajes: PersonajeLite[];
  unlockedSlugs: string[];
  nombreNuevo: string;
  onDone: () => void;
}) {
  const t = useTranslations("desbloquear");
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = setTimeout(onDone, reduced ? 400 : 2200);
    return () => clearTimeout(id);
  }, [onDone, reduced]);

  // Grid casi-cuadrado: cols = ceil(√n), rows = ceil(n / cols).
  // n=4 → 2×2, n=6 → 3×2, n=9 → 3×3, n=12 → 4×3.
  const cols = Math.max(1, Math.ceil(Math.sqrt(personajes.length)));
  const tileVw = Math.round(100 / cols);
  // Escalona la revelación pero mantén el total dentro del timeout de 2.2 s
  // (delay del último + 0.6 s de duración < 2.2 s), sea cual sea el conteo.
  const stagger = personajes.length > 1 ? Math.min(0.15, 1.2 / personajes.length) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-fondo-oscuro">
      <div
        className="grid h-full w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {personajes.map((p, i) => {
          const unlocked = unlockedSlugs.includes(p.slug);
          return (
            <div key={p.slug} className="relative overflow-hidden">
              {p.imagenPortada && (
                <Image
                  src={p.imagenPortada}
                  alt={p.nombre}
                  fill
                  sizes={`${tileVw}vw`}
                  className="object-cover"
                />
              )}
              <motion.div
                className="absolute inset-0 bg-fondo-oscuro"
                initial={{ opacity: 0.85 }}
                animate={{ opacity: unlocked ? 0.05 : 0.85 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.6, delay: 0.4 + i * stagger }
                }
              />
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.3 }}
          className="text-center font-serif text-3xl font-bold text-texto-claro drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-5xl"
        >
          {t("despertar_titulo", { nombre: nombreNuevo })}
        </motion.h2>
      </div>
    </div>
  );
}
