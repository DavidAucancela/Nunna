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
  /** Nombre (Google) o correo de la cuenta con sesión, para "Pedido a nombre de …". */
  cuenta: string | null;
  /** A dónde vuelve el login: /contacto con la selección actual. */
  redirectPath?: string | undefined;
}

const CLASE_WHATSAPP =
  "mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#1FA855] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1B964C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-dorado";

/**
 * Entrega del pedido: envío (WhatsApp con plantilla) · pago en línea (próximamente) · retiro con
 * mapa (WhatsApp para coordinar). Aparece al elegir personajes.
 *
 * Los botones de WhatsApp se ven siempre, pero antes de abrir el chat se verifica la sesión: sin
 * ella se abre la ventana de ingreso (la del candado del navbar) en vez de WhatsApp.
 */
export function EntregaContacto({ envioHref, retiroHref, acceso, cuenta, redirectPath }: EntregaContactoProps) {
  const t = useTranslations("contacto");
  // La misma ventana de ingreso del candado del navbar; vuelve a /contacto con el pedido.
  const [loginAbierto, setLoginAbierto] = useState(false);

  // Verificación al tocar: con sesión sigue el enlace a WhatsApp; sin ella, ventana de ingreso.
  // Mientras la sesión aún se está leyendo (un instante al cargar) el toque no hace nada.
  const verificarSesion = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (acceso === "listo") return;
    e.preventDefault();
    if (acceso === "login") setLoginAbierto(true);
  };

  // Los dos botones de WhatsApp (envío y retiro); "muy pronto" si falta el número.
  const accion = (hrefWa: string | null, etiqueta: string) => {
    if (!hrefWa) return <p className="mt-4 text-sm text-stone-500">{t("pronto")}</p>;
    return (
      <a
        href={hrefWa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={verificarSesion}
        aria-haspopup={acceso === "login" ? "dialog" : undefined}
        className={CLASE_WHATSAPP}
      >
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
        {acceso === "listo" && cuenta && (
          <p className="text-sm text-stone-500">{t("cuenta_como", { cuenta })}</p>
        )}
      </div>

      <AnimatePresence>
        {loginAbierto && acceso === "login" && (
          <LoginModal
            onClose={() => setLoginAbierto(false)}
            redirectPath={redirectPath}
            subtitulo={t("acceso_texto")}
          />
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
