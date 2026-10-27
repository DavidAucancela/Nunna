"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { PRECIOS, TAMANO_COLECCION, TAMANO_TRIO, cotizar, siguientePromo } from "@/lib/contacto/precios";

const COLORES = ["#C89B3C", "#B8312F", "#2F7A63", "#EFEAE0"];

/** Chispas que salen del sello de la promo al llegar a 3 o a 6. */
function Destello({ grande }: { grande: boolean }) {
  const n = grande ? 20 : 12;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: n }, (_, i) => {
        const angulo = (i / n) * Math.PI * 2;
        const distancia = (grande ? 110 : 72) * (0.7 + (i % 3) * 0.18);
        return (
          <motion.span
            key={i}
            className="absolute -ml-1 -mt-1 h-2 w-2 rounded-full"
            style={{ backgroundColor: COLORES[i % COLORES.length] }}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: Math.cos(angulo) * distancia, y: Math.sin(angulo) * distancia, scale: 1, opacity: 0 }}
            transition={{ duration: grande ? 1.1 : 0.85, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

/** Aparece al elegir personajes: precio por unidad, promo 3 × $10, colección 6 × $20 y total. */
export function ResumenPedido({ cantidad, onCompletar }: { cantidad: number; onCompletar: () => void }) {
  const t = useTranslations("contacto");
  const reducir = useReducedMotion();
  const c = cotizar(cantidad);
  const siguiente = siguientePromo(cantidad);

  // Celebrar solo al subir a 3 o a 6, no al quitar personajes.
  const anterior = useRef(cantidad);
  const [celebracion, setCelebracion] = useState(0);
  useEffect(() => {
    if (cantidad > anterior.current && (cantidad === TAMANO_TRIO || cantidad === TAMANO_COLECCION)) {
      setCelebracion((n) => n + 1);
    }
    anterior.current = cantidad;
  }, [cantidad]);

  const lineas = [
    c.colecciones > 0 && {
      id: "coleccion",
      texto: t("linea_coleccion", { n: TAMANO_COLECCION, precio: PRECIOS.coleccion }),
      monto: c.colecciones * PRECIOS.coleccion,
    },
    c.trios > 0 && {
      id: "trio",
      texto: t("linea_trio", { n: TAMANO_TRIO, precio: PRECIOS.trio }),
      monto: c.trios * PRECIOS.trio,
    },
    c.sueltos > 0 && {
      id: "suelto",
      texto: t("linea_suelto", { n: c.sueltos, precio: PRECIOS.unidad }),
      monto: c.sueltos * PRECIOS.unidad,
    },
  ].filter((l): l is { id: string; texto: string; monto: number } => Boolean(l));

  return (
    <motion.section
      aria-labelledby="contacto-resumen"
      initial={{ opacity: 0, y: 16, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 8, height: 0 }}
      transition={{ duration: reducir ? 0 : 0.35, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div
        className={`relative rounded-2xl border p-5 transition-colors duration-500 sm:p-6 ${
          c.promo === "coleccion"
            ? "border-acento-dorado bg-acento-dorado/[0.12]"
            : c.promo === "trio"
              ? "border-acento-rojo/60 bg-acento-rojo/[0.08]"
              : "border-borde-sutil bg-stone-900/40"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="contacto-resumen" className="font-serif text-xl font-bold text-texto-claro">
              {t("resumen_titulo", { n: c.cantidad })}
            </h2>
            <p className="mt-1 text-sm text-stone-400">{t("precio_unidad", { precio: PRECIOS.unidad })}</p>
          </div>

          <div className="text-right" aria-live="polite" aria-atomic="true">
            <p className="text-[11px] uppercase tracking-widest text-stone-500">{t("total")}</p>
            <p className="flex items-baseline justify-end gap-2">
              {c.ahorro > 0 && <span className="text-base text-stone-500 line-through">${c.regular}</span>}
              <span className="relative inline-flex overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={c.total}
                    initial={reducir ? false : { y: -18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reducir ? { opacity: 0 } : { y: 18, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="font-serif text-4xl font-bold text-acento-dorado"
                  >
                    ${c.total}
                  </motion.span>
                </AnimatePresence>
              </span>
            </p>
            <p className="text-xs text-stone-500">{t("sin_envio")}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          {lineas.map((l) => (
            <li key={l.id} className="flex justify-between gap-4 text-stone-300">
              <span>{l.texto}</span>
              <span className="tabular-nums text-stone-200">${l.monto}</span>
            </li>
          ))}
        </ul>

        {/* Sello de la promo: entra con resorte; al llegar a 3 o a 6 suelta chispas. */}
        <div className={`relative flex flex-wrap items-center gap-3 ${c.promo !== "ninguna" ? "mt-4 min-h-[40px]" : ""}`}>
          {!reducir && celebracion > 0 && (
            <span className="pointer-events-none absolute left-24 top-1/2">
              <Destello key={celebracion} grande={c.promo === "coleccion"} />
            </span>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {c.promo !== "ninguna" && (
              <motion.span
                key={c.promo}
                initial={reducir ? false : { scale: 0.5, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={reducir ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 16 }}
                className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg ${
                  c.promo === "coleccion"
                    ? "bg-acento-dorado text-fondo-oscuro shadow-acento-dorado/30"
                    : "bg-acento-rojo text-white shadow-acento-rojo/30"
                }`}
              >
                <span aria-hidden="true">★</span>
                {c.promo === "coleccion"
                  ? t("promo_coleccion", { n: TAMANO_COLECCION, precio: PRECIOS.coleccion })
                  : t("promo_trio", { n: TAMANO_TRIO, precio: PRECIOS.trio })}
              </motion.span>
            )}
          </AnimatePresence>
          {c.ahorro > 0 && <span className="text-sm font-medium text-acento-dorado">{t("ahorro", { monto: c.ahorro })}</span>}
        </div>

        {siguiente && (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-300">
            <span>
              {siguiente.promo === "trio"
                ? t("falta_trio", { faltan: siguiente.faltan, n: TAMANO_TRIO, precio: PRECIOS.trio })
                : t("falta_coleccion", { faltan: siguiente.faltan, precio: PRECIOS.coleccion })}
            </span>
            {siguiente.promo === "coleccion" && (
              <button
                type="button"
                onClick={onCompletar}
                className="rounded-full border border-acento-dorado/60 px-3 py-1.5 text-xs font-semibold text-acento-dorado transition-colors hover:bg-acento-dorado hover:text-fondo-oscuro"
              >
                {t("completar", { n: TAMANO_COLECCION, precio: PRECIOS.coleccion })}
              </button>
            )}
          </p>
        )}
      </div>
    </motion.section>
  );
}
