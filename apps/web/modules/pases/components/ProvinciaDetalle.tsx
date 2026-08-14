"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { PaseListItem } from "@seres-del-pase/types";
import type { Recorridos } from "@/lib/data";
import type { ProvinciaConPases, Region } from "@/lib/services/provincias.service";
import { CalendarioGrid } from "@/modules/festividades/components/CalendarioGrid";
import { RecorridosProvincia } from "./RecorridosProvincia";

interface Props {
  provincia: ProvinciaConPases;
  /** Recorridos ya acotados a los pases de esta provincia (puede venir vacío). */
  recorridos: Recorridos;
  pasesInfo: PaseListItem[];
}

/**
 * Las 3 secciones de una provincia: Recorrido, Calendario, Información.
 * "Recorrido" cae a un estado "próximamente" cuando la provincia está marcada
 * (tiene pases en el calendario) pero ninguno tiene ruta trazada todavía —
 * hoy el caso de la mayoría de las provincias sembradas desde el PDF de
 * referencia (ver docs/AGREGAR-PROVINCIA.md).
 */
export function ProvinciaDetalle({ provincia, recorridos, pasesInfo }: Props) {
  const t = useTranslations("pases.mapa");
  const tPases = useTranslations("pases");

  const regionLabel: Record<Region, string> = {
    sierra: t("region.sierra"),
    costa: t("region.costa"),
    amazonia: t("region.amazonia"),
    insular: t("region.insular"),
  };

  const paseInfo = useMemo(() => {
    const conRecorrido = new Set(recorridos.pases.map((r) => r.paseSlug));
    const ordenados = [...provincia.pases].sort((a, b) => {
      const aTiene = conRecorrido.has(a.slug) ? 0 : 1;
      const bTiene = conRecorrido.has(b.slug) ? 0 : 1;
      if (aTiene !== bTiene) return aTiene - bTiene;
      return (a.mes ?? 0) - (b.mes ?? 0) || (a.dia ?? 0) - (b.dia ?? 0);
    });
    return ordenados[0] ?? null;
  }, [provincia.pases, recorridos.pases]);

  return (
    <div className="space-y-16">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">
          {regionLabel[provincia.region]}
        </p>
        <h2 className="mt-1 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
          {t("pases_en", { provincia: provincia.nombre })}
        </h2>
        <p className="mt-2 text-sm text-stone-500">{t("pases_count", { count: provincia.pases.length })}</p>
      </header>

      {/* ── Recorrido ── */}
      <section>
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-acento-dorado">
            {t("recorrido_titulo")}
          </p>
        </div>
        {recorridos.pases.length > 0 ? (
          <RecorridosProvincia recorridos={recorridos} pasesInfo={pasesInfo} />
        ) : (
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-2xl border border-dashed border-borde-sutil bg-stone-900/30 p-8 text-center">
              <p className="text-sm text-stone-500">{t("recorrido_proximamente")}</p>
            </div>
          </div>
        )}
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-6">
        {/* ── Calendario ── */}
        <section id="calendario-provincia" className="scroll-mt-16">
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-acento-dorado">
            {t("calendario_titulo")}
          </p>
          <CalendarioGrid pases={provincia.pases} />
        </section>

        {/* ── Información del evento ── */}
        {paseInfo && (
          <section>
            <p className="mb-5 text-xs uppercase tracking-[0.25em] text-acento-dorado">
              {t("informacion_titulo")}
            </p>
            <div className="rounded-2xl border border-borde-sutil bg-stone-900/30 p-6 md:p-8">
              <h3 className="font-serif text-2xl font-bold text-texto-claro">{paseInfo.nombre}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-500">
                {paseInfo.tipo && <span>{paseInfo.tipo}</span>}
                {paseInfo.ciudad && (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-stone-600" />
                    {paseInfo.ciudad}
                  </span>
                )}
                {paseInfo.personaje && (
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: paseInfo.color ?? "#C89B3C" }}
                    />
                    {paseInfo.personaje}
                  </span>
                )}
              </div>
              <p className="mt-4 max-w-2xl leading-relaxed text-stone-300">{paseInfo.fechaDescripcion}</p>
              {provincia.slug === "chimborazo" && (
                <p className="mt-6 border-t border-borde-sutil pt-4 text-xs text-stone-600">{tPases("nota")}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
