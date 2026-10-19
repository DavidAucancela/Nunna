"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { RielParada } from "@/lib/pase-camera/riel";

interface Props {
  paradas: RielParada[];
}

function paradaKey(parada: RielParada): string {
  return parada.tipo === "personaje" ? (parada.waypoint.slug ?? parada.waypoint.nombre) : parada.elemento.id;
}

/**
 * Alternativa estática (reduced-motion / sin WebGL / mientras la escena 3D no
 * ha terminado de precargar): tira horizontal de tarjetas, misma data
 * (RielParada[]) que la versión 3D — sin dataset paralelo.
 */
export function PaseCameraFallback({ paradas }: Props) {
  const t = useTranslations("pases");

  return (
    <div className="w-full">
      <p className="mx-auto mb-4 max-w-3xl px-5 text-center text-xs italic text-stone-500 sm:px-6">
        {t("recorrido_visual_fallback_nota")}
      </p>
      <div
        role="list"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-6"
      >
        {paradas.map((parada) => (
          <div
            key={paradaKey(parada)}
            role="listitem"
            className="flex w-64 flex-none snap-start flex-col overflow-hidden rounded-2xl border border-borde-sutil bg-stone-900/40"
          >
            {parada.tipo === "personaje" ? (
              <>
                <div className="relative h-40 w-full bg-stone-950">
                  <Image
                    src={parada.waypoint.imagen}
                    alt={parada.waypoint.alt}
                    fill
                    sizes="256px"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-acento-dorado">
                    {t("recorrido_visual_personaje_label")}
                  </p>
                  <p className="mt-1 font-serif text-sm font-semibold text-texto-claro">
                    {parada.waypoint.nombre}
                  </p>
                  {parada.waypoint.dato && (
                    <p className="mt-1 text-xs text-stone-400">{parada.waypoint.dato}</p>
                  )}
                  {parada.waypoint.slug && (
                  <Link
                    href={{ pathname: "/personajes/[slug]", params: { slug: parada.waypoint.slug } }}
                    className="mt-2 inline-block text-xs font-medium text-acento-dorado hover:underline"
                  >
                    {t("ver_ficha_personaje", { nombre: parada.waypoint.label })}
                  </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-40 flex-col justify-center p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-acento-dorado">
                  {t("recorrido_visual_elemento_label")}
                </p>
                <p className="mt-1 font-serif text-sm font-semibold text-texto-claro">
                  {parada.elemento.nombre}
                </p>
                <p className="mt-1 text-xs text-stone-400">{parada.elemento.texto}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
