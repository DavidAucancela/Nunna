"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cotizar } from "@/lib/contacto/precios";
import { TARJETA } from "@/modules/personajes/components/TarjetaNunna";
import type { Entrega } from "./PasoEntrega";

/** `login`: hay cuentas y no hay sesión → el envío pide entrar primero. */
export type AccesoEnvio = "listo" | "login" | "cargando";

interface Props {
  personajes: { slug: string; nombre: string; icono?: string | undefined }[];
  entrega: Entrega;
  acceso: AccesoEnvio;
  /** Nombre (Google) o correo de la cuenta con sesión. */
  cuenta: string | null;
  onCambiarPersonajes: () => void;
  onCambiarEntrega: () => void;
}

/**
 * Paso 4 de la compra: el resumen de lo que va en el mensaje (personajes, total, entrega y a nombre
 * de quién). El botón para enviar (o para iniciar sesión) va en la barra de abajo.
 */
export function PasoEnviar({ personajes, entrega, acceso, cuenta, onCambiarPersonajes, onCambiarEntrega }: Props) {
  const t = useTranslations("contacto");
  const c = cotizar(personajes.length);

  const fila = (titulo: string, cambiar: (() => void) | null, contenido: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">{titulo}</p>
        <div className="mt-1.5">{contenido}</div>
      </div>
      {cambiar && (
        <button
          type="button"
          onClick={cambiar}
          className="flex-none rounded-full px-2 py-1 text-xs font-semibold text-acento-dorado hover:underline"
        >
          {t("cambiar")}
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-borde-sutil bg-stone-900/40 px-5 sm:px-6">
      {fila(
        t("resumen_titulo", { n: personajes.length }),
        onCambiarPersonajes,
        <ul className="flex flex-wrap gap-2">
          {personajes.map((p) => (
            <li key={p.slug} className="flex items-center gap-2 rounded-full border border-borde-sutil py-1 pl-1 pr-3">
              <span
                className="relative h-7 w-7 overflow-hidden rounded-full"
                style={{ background: TARJETA.placa }}
              >
                {p.icono && <Image src={p.icono} alt="" fill sizes="28px" className="object-cover mix-blend-multiply" />}
              </span>
              <span className="text-sm text-stone-200">{p.nombre}</span>
            </li>
          ))}
        </ul>,
      )}
      {fila(
        t("total"),
        null,
        <p className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-bold text-acento-dorado">${c.total}</span>
          {c.ahorro > 0 && <span className="text-sm text-stone-500 line-through">${c.regular}</span>}
          <span className="text-sm text-stone-400">{entrega === "envio" ? t("mas_envio") : t("sin_envio")}</span>
        </p>,
      )}
      {fila(
        t("entrega_titulo"),
        onCambiarEntrega,
        <p className="text-stone-200">
          {entrega === "envio" ? t("envio_titulo") : `${t("retiro_titulo")} · ${t("retiro_lugar")}`}
          <span className="mt-0.5 block text-sm text-stone-400">
            {entrega === "envio" ? t("envio_datos") : t("retiro_horario")}
          </span>
        </p>,
      )}
      {fila(
        t("a_nombre_de"),
        null,
        acceso === "listo" ? (
          <p className="text-stone-200">{cuenta ?? "—"}</p>
        ) : (
          <p className="text-sm leading-relaxed text-stone-400">{t("acceso_texto")}</p>
        ),
      )}
    </div>
  );
}
