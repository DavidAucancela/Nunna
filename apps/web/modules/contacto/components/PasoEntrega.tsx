"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PUNTO_RETIRO } from "@/lib/contacto/retiro";
import { MapaRetiro } from "./MapaRetiro";

export type Entrega = "envio" | "retiro";

/**
 * Paso 3 de la compra: una sola forma de recibir el pedido. Envío (los datos se completan en el
 * mensaje de WhatsApp) o retiro en Quito (con mapa). El pago en línea se muestra como próximo.
 */
export function PasoEntrega({ valor, onCambio }: { valor: Entrega | null; onCambio: (e: Entrega) => void }) {
  const t = useTranslations("contacto");
  const reducir = useReducedMotion();

  const opcion = (id: Entrega, titulo: string, texto: string, extra?: React.ReactNode) => {
    const activo = valor === id;
    return (
      <label
        className={`block cursor-pointer rounded-2xl border p-5 transition-colors ${
          activo
            ? "border-acento-dorado bg-acento-dorado/[0.08] shadow-[0_0_0_1px_rgba(200,155,60,0.6)]"
            : "border-borde-sutil hover:border-stone-500"
        }`}
      >
        <span className="flex items-start gap-3">
          <input
            type="radio"
            name="entrega"
            value={id}
            checked={activo}
            onChange={() => onCambio(id)}
            className="mt-1.5 h-4 w-4 flex-none accent-[#C89B3C]"
          />
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-xl font-bold text-texto-claro">{titulo}</span>
            <span className="mt-1 block leading-relaxed text-stone-400">{texto}</span>
          </span>
        </span>
        {extra}
      </label>
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3" role="radiogroup" aria-label={t("entrega_titulo")}>
      {opcion("envio", t("envio_titulo"), t("envio_texto"))}
      {opcion(
        "retiro",
        t("retiro_titulo"),
        `${t("retiro_lugar")} · ${t("retiro_direccion")}`,
        <AnimatePresence initial={false}>
          {valor === "retiro" && (
            <motion.div
              initial={reducir ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pl-7"
            >
              <div className="mt-4">
                <MapaRetiro etiqueta={t("retiro_mapa_aria")} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                {t("retiro_locales")} · {t("retiro_horario")}
              </p>
              <a
                href={PUNTO_RETIRO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-acento-dorado hover:underline"
              >
                {t("retiro_como_llegar")} ↗
              </a>
            </motion.div>
          )}
        </AnimatePresence>,
      )}

      {/* Pago en línea: aún no existe; se ve para que se sepa que viene. */}
      <div aria-disabled="true" className="rounded-2xl border border-dashed border-stone-700 p-5">
        <div className="flex items-start justify-between gap-3 pl-7">
          <span className="font-serif text-xl font-bold text-stone-400">{t("pago_titulo")}</span>
          <span className="flex-none rounded-full bg-acento-dorado/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-acento-dorado">
            {t("pago_badge")}
          </span>
        </div>
        <p className="mt-1 pl-7 leading-relaxed text-stone-500">{t("pago_texto")}</p>
      </div>
    </div>
  );
}
