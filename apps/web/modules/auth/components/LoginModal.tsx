"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { LoginCard } from "./LoginCard";

/**
 * Ventana de ingreso sobre la página actual (botón del candado en el navbar).
 * Va en un portal a <body>: el header usa `backdrop-filter`, que ancla los
 * descendientes `fixed` al propio header en vez de al viewport.
 */
export function LoginModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("nav");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
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
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-fondo-oscuro/85 px-5 py-10 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-titulo"
        tabIndex={-1}
        className="relative w-full max-w-md outline-none"
        initial={{ y: reduced ? 0 : 24, opacity: 0, scale: reduced ? 1 : 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: reduced ? 0 : 24, opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
      >
        <LoginCard titleId="login-modal-titulo" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cerrar")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-800 hover:text-texto-claro"
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
