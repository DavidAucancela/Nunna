"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import type { PersonajeLite } from "./DesbloquearForm";

/**
 * Overlay de pantalla completa tras un canje exitoso: grid 2x2 con los 4
 * personajes; los desbloqueados se "iluminan" (el velo oscuro se desvanece),
 * los bloqueados quedan en penumbra. Llama onDone() al terminar.
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

  return (
    <div className="fixed inset-0 z-[100] bg-fondo-oscuro">
      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
        {personajes.slice(0, 4).map((p, i) => {
          const unlocked = unlockedSlugs.includes(p.slug);
          return (
            <div key={p.slug} className="relative overflow-hidden">
              {p.imagenPortada && (
                <Image
                  src={p.imagenPortada}
                  alt={p.nombre}
                  fill
                  sizes="50vw"
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
                    : { duration: 0.6, delay: 0.4 + i * 0.15 }
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
