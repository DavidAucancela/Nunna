"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { LoginCard } from "./LoginCard";

/** Bajo `sm` la ventana es una hoja que sube desde abajo. */
const MQ_MOVIL = "(max-width: 639px)";

/**
 * Ventana de ingreso sobre la página actual (botón del candado en el navbar).
 * Va en un portal a <body>: el header usa `backdrop-filter`, que ancla los
 * descendientes `fixed` al propio header en vez de al viewport.
 *
 * Formas de cerrarla: tocar fuera, ✕, Escape y, en móvil, "Cancelar" o
 * deslizar la hoja hacia abajo desde su asa.
 */
export function LoginModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("nav");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  // Solo se monta en el cliente (se abre con un clic), así que leer matchMedia aquí es seguro.
  const [movil] = useState(() => window.matchMedia(MQ_MOVIL).matches);
  // En táctil no se enfoca el correo: el teclado taparía la hoja y la salida.
  const [punteroFino] = useState(() => window.matchMedia("(pointer: fine)").matches);
  // El toque cuenta como "afuera" solo si empezó y terminó en el fondo
  // (seleccionar texto y soltar fuera no debe cerrar).
  const toqueEnFondo = useRef(false);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    if (!punteroFino) ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !ref.current) return;
      const focusables = ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose, punteroFino]);

  const alSoltar = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const desde = reduced ? { opacity: 0 } : movil ? { y: "100%" } : { y: 24, opacity: 0, scale: 0.97 };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-fondo-oscuro/85 pt-16 backdrop-blur-sm sm:items-center sm:overflow-y-auto sm:px-5 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => {
        toqueEnFondo.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (toqueEnFondo.current && e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-titulo"
        tabIndex={-1}
        className="relative max-h-full w-full overflow-y-auto overscroll-contain outline-none sm:max-h-none sm:max-w-md sm:overflow-visible"
        initial={desde}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={desde}
        transition={reduced ? { duration: 0 } : movil ? { type: "spring", damping: 32, stiffness: 320 } : { duration: 0.28, ease: "easeOut" }}
        drag={movil ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={alSoltar}
      >
        {/* Asa — solo móvil: arrastrarla hacia abajo cierra la hoja */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="absolute inset-x-0 top-0 z-10 flex h-7 cursor-grab touch-none items-center justify-center active:cursor-grabbing sm:hidden"
          aria-hidden="true"
        >
          <span className="h-1.5 w-10 rounded-full bg-stone-700" />
        </div>

        <LoginCard
          titleId="login-modal-titulo"
          autoFocus={punteroFino}
          className="max-w-none rounded-t-3xl border-b-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl sm:border-b sm:pb-8"
          pie={
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-borde-sutil py-3 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-900 hover:text-texto-claro sm:hidden"
            >
              {t("cancelar")}
            </button>
          }
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cerrar")}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-stone-400 transition-colors hover:bg-stone-800 hover:text-texto-claro sm:h-8 sm:w-8 sm:bg-transparent sm:text-stone-500"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
