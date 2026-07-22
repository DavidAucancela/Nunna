"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * Tutorial breve tras el primer login sin código ("¿Ya tienes cuenta?"). Se
 * muestra una sola vez por dispositivo — ColeccionProvider marca
 * nunna:bienvenida_vista en localStorage al cerrarse.
 */
export function WelcomeModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("coleccion");
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-titulo"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-fondo-oscuro/90 px-5 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          className="w-full max-w-sm rounded-2xl border border-borde-sutil bg-stone-950 p-6 text-center shadow-2xl"
        >
          <h2 id="bienvenida-titulo" className="font-serif text-2xl font-bold text-texto-claro">
            {t("bienvenida_titulo")}
          </h2>
          <p className="mt-2 text-sm text-stone-400">{t("bienvenida_subtitulo")}</p>

          <ul className="mt-6 space-y-4 text-left">
            {(["paso1", "paso2", "paso3"] as const).map((key, i) => (
              <li key={key} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-acento-dorado/15 text-xs font-semibold text-acento-dorado">
                  {i + 1}
                </span>
                <span className="text-sm text-stone-300">{t(`bienvenida_${key}`)}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full rounded-full bg-acento-dorado px-6 py-3 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.01]"
          >
            {t("bienvenida_boton")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
