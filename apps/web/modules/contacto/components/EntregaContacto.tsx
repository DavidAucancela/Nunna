"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { IconoWhatsApp } from "@/components/ui/IconoWhatsApp";
import { PUNTO_RETIRO } from "@/lib/contacto/retiro";
import { LoginModal } from "@/modules/auth/components/LoginModal";
import { MapaRetiro } from "./MapaRetiro";

/** `login`: hay cuentas y no hay sesión → los botones de WhatsApp piden entrar primero. */
export type AccesoEntrega = "listo" | "login" | "cargando";

interface EntregaContactoProps {
  envioHref: string | null;
  retiroHref: string | null;
  acceso: AccesoEntrega;
  correo: string | null;
  /** A dónde vuelve el login: /contacto con la selección actual. */
  redirectPath?: string | undefined;
}

const CLASE_WHATSAPP =
  "mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#1FA855] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1B964C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-dorado";

function IconoCandado({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path strokeLinecap="round" d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Entrega del pedido: envío (WhatsApp con plantilla) · pago en línea (próximamente) · retiro con
 * mapa (WhatsApp para coordinar). Aparece al elegir personajes; los botones exigen sesión.
 */
export function EntregaContacto({ envioHref, retiroHref, acceso, correo, redirectPath }: EntregaContactoProps) {
  const t = useTranslations("contacto");
  // La misma ventana de ingreso del candado del navbar; vuelve a /contacto con el pedido.
  const [loginAbierto, setLoginAbierto] = useState(false);
  const irAlLogin = () => setLoginAbierto(true);

  // Mismo lugar para los dos botones de WhatsApp: libre, bloqueado o "muy pronto" sin número.
  const accion = (hrefWa: string | null, etiqueta: string) => {
    if (!hrefWa) return <p className="mt-4 text-sm text-stone-500">{t("pronto")}</p>;
    if (acceso === "cargando") {
      return <span aria-hidden="true" className="mt-4 block h-11 animate-pulse rounded-full bg-stone-800/70" />;
    }
    if (acceso === "login") {
      return (
        <button
          type="button"
          onClick={irAlLogin}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-borde-sutil px-5 py-3 text-sm font-semibold text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
        >
          <IconoCandado className="h-4 w-4" />
          {t("acceso_boton")}
        </button>
      );
    }
    return (
      <a href={hrefWa} target="_blank" rel="noopener noreferrer" className={CLASE_WHATSAPP}>
        <IconoWhatsApp className="h-4 w-4" />
        {etiqueta}
      </a>
    );
  };

  return (
    <section aria-labelledby="contacto-entrega-titulo" id="contacto-entrega" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="contacto-entrega-titulo" className="font-serif text-2xl font-bold text-texto-claro">
            {t("entrega_titulo")}
          </h2>
          <p className="mt-1 text-sm text-stone-400">{t("entrega_ayuda")}</p>
        </div>
        {acceso === "listo" && correo && (
          <p className="text-sm text-stone-500">{t("cuenta_como", { correo })}</p>
        )}
      </div>

      {acceso === "login" && (envioHref || retiroHref) && (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-acento-dorado/40 bg-acento-dorado/[0.06] p-4 sm:flex-row sm:items-center sm:p-5">
          <span className="hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-acento-dorado/15 text-acento-dorado sm:inline-flex">
            <IconoCandado className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-texto-claro">{t("acceso_titulo")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-400">{t("acceso_texto")}</p>
          </div>
          <button
            type="button"
            onClick={irAlLogin}
            className="inline-flex flex-none items-center justify-center gap-2 rounded-full bg-acento-dorado px-6 py-3 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-dorado"
          >
            <IconoCandado className="h-4 w-4" />
            {t("acceso_iniciar")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {loginAbierto && acceso === "login" && (
          <LoginModal onClose={() => setLoginAbierto(false)} redirectPath={redirectPath} />
        )}
      </AnimatePresence>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {/* Envío: abre WhatsApp con el pedido y los datos de envío por llenar. */}
        <div className="flex flex-col rounded-2xl border border-borde-sutil p-5">
          <h3 className="font-serif text-xl font-bold text-texto-claro">{t("envio_titulo")}</h3>
          <p className="mt-2 flex-1 leading-relaxed text-stone-400">{t("envio_texto")}</p>
          {accion(envioHref, t("envio_boton"))}
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

        {/* Retiro en Quito, con mapa: WhatsApp para coordinar cuándo pasar. */}
        <div className="flex flex-col rounded-2xl border border-borde-sutil p-5">
          <h3 className="font-serif text-xl font-bold text-texto-claro">{t("retiro_titulo")}</h3>
          <div className="mt-3">
            <MapaRetiro etiqueta={t("retiro_mapa_aria")} />
          </div>
          <address className="mt-3 flex-1 not-italic leading-relaxed text-stone-400">
            <span className="block font-medium text-stone-200">{t("retiro_lugar")}</span>
            <span className="block">{t("retiro_direccion")}</span>
            <span className="block">{t("retiro_locales")}</span>
            <span className="block">{t("retiro_horario")}</span>
            <a
              href={PUNTO_RETIRO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-acento-dorado hover:underline"
            >
              {t("retiro_como_llegar")} ↗
            </a>
          </address>
          {accion(retiroHref, t("retiro_boton"))}
        </div>
      </div>
    </section>
  );
}
