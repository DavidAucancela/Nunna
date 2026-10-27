"use client";

import { useTranslations } from "next-intl";
import { IconoWhatsApp } from "@/components/ui/IconoWhatsApp";
import { PUNTO_RETIRO } from "@/lib/contacto/retiro";
import { MapaRetiro } from "./MapaRetiro";

/** Entrega en tres partes: envío (WhatsApp con plantilla) · pago en línea (próximamente) · retiro con mapa. */
export function EntregaContacto({ envioHref }: { envioHref: string | null }) {
  const t = useTranslations("contacto");

  return (
    <section aria-labelledby="contacto-entrega">
      <h2 id="contacto-entrega" className="font-serif text-2xl font-bold text-texto-claro">
        {t("entrega_titulo")}
      </h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {/* Envío: abre WhatsApp con el pedido y los datos de envío por llenar. */}
        <div className="flex flex-col rounded-2xl border border-borde-sutil p-5">
          <h3 className="font-serif text-xl font-bold text-texto-claro">{t("envio_titulo")}</h3>
          <p className="mt-2 flex-1 leading-relaxed text-stone-400">{t("envio_texto")}</p>
          {envioHref ? (
            <a
              href={envioHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#1FA855] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1B964C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-dorado"
            >
              <IconoWhatsApp className="h-4 w-4" />
              {t("envio_boton")}
            </a>
          ) : (
            <p className="mt-4 text-sm text-stone-500">{t("pronto")}</p>
          )}
        </div>

        {/* Pago en línea: aún no existe. */}
        <div className="flex flex-col rounded-2xl border border-dashed border-stone-700 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-xl font-bold text-stone-300">{t("pago_titulo")}</h3>
            <span className="flex-none rounded-full bg-acento-dorado/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-acento-dorado">
              {t("pago_badge")}
            </span>
          </div>
          <p className="mt-2 flex-1 leading-relaxed text-stone-500">{t("pago_texto")}</p>
          <span
            aria-disabled="true"
            className="mt-4 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-stone-700 px-5 py-3 text-sm font-semibold text-stone-500"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            {t("pago_boton")}
          </span>
        </div>

        {/* Retiro en Quito, con mapa. */}
        <div className="flex flex-col rounded-2xl border border-borde-sutil p-5">
          <h3 className="font-serif text-xl font-bold text-texto-claro">{t("retiro_titulo")}</h3>
          <div className="mt-3">
            <MapaRetiro etiqueta={t("retiro_mapa_aria")} />
          </div>
          <address className="mt-3 not-italic leading-relaxed text-stone-400">
            <span className="block font-medium text-stone-200">{t("retiro_lugar")}</span>
            <span className="block">{t("retiro_direccion")}</span>
            <span className="block">{t("retiro_locales")}</span>
            <span className="block">{t("retiro_horario")}</span>
          </address>
          <a
            href={PUNTO_RETIRO.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-acento-dorado hover:underline"
          >
            {t("retiro_como_llegar")} ↗
          </a>
        </div>
      </div>
    </section>
  );
}
