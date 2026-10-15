"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Media } from "@seres-del-pase/types";

interface GaleriaSectionProps {
  multimedia: Media[];
  accentColor: string;
  nombre?: string;
  /** Modo compuesto: sin el <section>/fondo propio (se inserta dentro de otra sección). */
  embedded?: boolean;
}

/**
 * Galería de la ficha: dos filas — una foto grande y debajo las 2 siguientes —
 * con flechas abajo que recorren todas las fotos; al tocar una se abre el visor
 * a pantalla completa (descripción, flechas, teclado y swipe).
 * Solo fotos de pase: los afiches con texto quedan fuera y el imán ya se ve en
 * "Míralo de cerca". Si hay menos de 3 de pase, completa con las demás.
 */
export function GaleriaSection({ multimedia, accentColor, nombre, embedded = false }: GaleriaSectionProps) {
  const t = useTranslations("galeria");
  const reduced = useReducedMotion();
  const [abierta, setAbierta] = useState<number | null>(null);
  // Primera foto visible (la grande); siempre múltiplo de 3.
  const [inicio, setInicio] = useState(0);
  const touchX = useRef<number | null>(null);
  const cerrarRef = useRef<HTMLButtonElement | null>(null);

  const fotos = useMemo<Media[]>(() => {
    const imagenes = multimedia.filter((m) => m.tipo === "imagen" && !/afiche/i.test(m.id));
    const porOrden = (a: Media, b: Media) => a.orden - b.orden;
    const pase = imagenes.filter((m) => m.titulo === "en-pase").sort(porOrden);
    const resto = imagenes.filter((m) => m.titulo !== "en-pase" && m.orden > 0).sort(porOrden);
    return pase.length >= 3 ? pase : [...pase, ...resto];
  }, [multimedia]);

  const cerrar = useCallback(() => setAbierta(null), []);
  const mover = useCallback(
    (dir: 1 | -1) => setAbierta((i) => (i == null ? i : (i + dir + fotos.length) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (abierta == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      else if (e.key === "ArrowRight") mover(1);
      else if (e.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierta, cerrar, mover]);

  if (fotos.length === 0) return null;

  const n = fotos.length;
  const visibles = Array.from({ length: Math.min(3, n) }, (_, k) => (inicio + k) % n);
  // Las flechas pasan de 3 en 3 (un grupo nuevo: grande + 2 chicas).
  const grupos = Math.ceil(n / 3);
  const grupo = Math.floor(inicio / 3);
  const pasar = (dir: 1 | -1) => setInicio(((grupo + dir + grupos) % grupos) * 3);
  const activa = abierta != null ? fotos[abierta] : null;
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "border-y border-borde-sutil bg-stone-950 py-20 sm:py-28"}>
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h3 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-texto-claro">
            {t("titulo")}
          </h3>
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:gap-3">
          {visibles.map((idx, k) => {
            const m = fotos[idx]!;
            const grande = k === 0;
            return (
              <li key={`${k}-${m.id}`} className={grande ? "col-span-2" : ""}>
                <motion.button
                  type="button"
                  onClick={() => setAbierta(idx)}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`group relative block w-full overflow-hidden rounded-md bg-stone-900 focus:outline-none focus-visible:ring-2 ${
                    grande ? "aspect-[4/3] sm:aspect-[2/1]" : "aspect-[4/3] sm:aspect-[3/2]"
                  }`}
                  style={{ ["--tw-ring-color" as string]: accentColor }}
                  aria-label={t("abrir", { titulo: m.altText })}
                >
                  <Image
                    src={m.url}
                    alt={m.altText}
                    fill
                    sizes={grande ? "(max-width: 1152px) 100vw, 1100px" : "(max-width: 1152px) 50vw, 550px"}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </motion.button>
              </li>
            );
          })}
        </ul>

        {grupos > 1 && (
          <div className="mt-5 flex items-center justify-center gap-5">
            <BotonVisor etiqueta={t("anterior")} onClick={() => pasar(-1)}>‹</BotonVisor>
            <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-stone-400">
              {t("contador", { n: grupo + 1, total: grupos })}
            </span>
            <BotonVisor etiqueta={t("siguiente")} onClick={() => pasar(1)}>›</BotonVisor>
          </div>
        )}
      </div>

      {/* ── Visor ── */}
      <AnimatePresence>
        {activa && abierta != null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={nombre ? t("visor", { nombre }) : t("titulo")}
            data-lenis-prevent
            className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-black/95 px-4 pb-5 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            onClick={(e) => e.target === e.currentTarget && cerrar()}
            onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1);
            }}
          >
            <div className="flex items-center justify-between text-sm tabular-nums text-stone-400">
              <span />
              <button
                ref={cerrarRef}
                type="button"
                onClick={cerrar}
                aria-label={t("cerrar")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex min-h-0 items-center justify-center gap-3">
              <div className="relative h-full w-full max-w-5xl">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activa.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                  >
                    <Image src={activa.url} alt={activa.altText} fill sizes="100vw" className="object-contain" />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="mx-auto mt-4 grid w-full max-w-2xl gap-3 text-center">
              <p className="text-sm leading-relaxed text-stone-300 sm:text-base">
                {activa.descripcion ?? activa.altText}
              </p>
              {/* Navegación abajo: visible en teléfono y computador */}
              <div className="flex items-center justify-center gap-5">
                <BotonVisor etiqueta={t("anterior")} onClick={() => mover(-1)}>‹</BotonVisor>
                <span className="min-w-[4.5rem] text-sm tabular-nums text-stone-400">
                  {t("contador", { n: abierta + 1, total: fotos.length })}
                </span>
                <BotonVisor etiqueta={t("siguiente")} onClick={() => mover(1)}>›</BotonVisor>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

function BotonVisor({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-white/20 text-2xl text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}
