"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { PaseListItem } from "@seres-del-pase/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface CalendarioGridProps {
  pases: PaseListItem[];
}

export function CalendarioGrid({ pases }: CalendarioGridProps) {
  const [selected, setSelected] = useState<{ mes: number; dia: number; pases: PaseListItem[] } | null>(null);
  const detalleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    detalleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  function getDiasConEvento(mes: number): Record<number, PaseListItem[]> {
    const result: Record<number, PaseListItem[]> = {};
    for (const p of pases) {
      if (p.mes === mes && p.dia) {
        if (!result[p.dia]) result[p.dia] = [];
        result[p.dia]!.push(p);
      }
    }
    return result;
  }

  return (
    <div>
      {/* Grid 3×4 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MESES.map((nombreMes, idx) => {
          const mesNum = idx + 1;
          const diasCount = DIAS_POR_MES[idx]!;
          const eventos = getDiasConEvento(mesNum);
          const tieneEventos = Object.keys(eventos).length > 0;

          return (
            <div
              key={mesNum}
              className={`rounded-2xl border p-4 transition-colors ${
                tieneEventos
                  ? "border-acento-dorado/30 bg-stone-900/60"
                  : "border-borde-sutil bg-stone-900/20"
              }`}
            >
              <h3
                className={`mb-3 font-serif text-base font-semibold ${
                  tieneEventos ? "text-acento-dorado" : "text-stone-500"
                }`}
              >
                {nombreMes}
              </h3>

              {/* Mini grid de días */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: diasCount }, (_, d) => {
                  const dia = d + 1;
                  const eventosDelDia = eventos[dia];
                  const hasEvento = !!eventosDelDia?.length;

                  return (
                    <button
                      key={dia}
                      onClick={() =>
                        hasEvento
                          ? setSelected({ mes: mesNum, dia, pases: eventosDelDia! })
                          : undefined
                      }
                      className={`flex h-6 w-6 items-center justify-center rounded text-[10px] transition-all ${
                        hasEvento
                          ? "cursor-pointer bg-acento-dorado text-fondo-oscuro font-semibold hover:scale-110 hover:shadow-lg hover:shadow-acento-dorado/30"
                          : "text-stone-700 cursor-default"
                      } ${
                        selected?.mes === mesNum && selected?.dia === dia
                          ? "ring-2 ring-acento-dorado ring-offset-1 ring-offset-fondo-oscuro"
                          : ""
                      }`}
                      aria-label={hasEvento ? `${dia} de ${nombreMes}: ${eventosDelDia!.map((e) => e.nombre).join(", ")}` : undefined}
                      disabled={!hasEvento}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>

              {/* Resumen de eventos del mes */}
              {tieneEventos && (
                <div className="mt-3 space-y-1">
                  {Object.entries(eventos).map(([dia, evs]) => (
                    <button
                      key={dia}
                      onClick={() =>
                        setSelected({ mes: mesNum, dia: Number(dia), pases: evs })
                      }
                      className="flex w-full items-start gap-2 rounded-lg px-1 py-0.5 text-left text-xs transition-colors hover:bg-stone-800"
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acento-dorado" />
                      <span className="text-stone-400">
                        <span className="font-medium text-stone-300">{dia} —</span>{" "}
                        {evs.map((e) => e.nombre).join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel de detalle — tarjetas con la información completa del pase */}
      {selected && (
        <div ref={detalleRef} className="mt-8 scroll-mt-20 rounded-2xl border border-acento-dorado/30 bg-stone-900/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-acento-dorado">
                {selected.dia} de {MESES[selected.mes - 1]}
              </p>
              <h3 className="mt-1 font-serif text-xl font-bold text-texto-claro">
                {selected.pases.length === 1
                  ? selected.pases[0]!.nombre
                  : `${selected.pases.length} eventos`}
              </h3>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {selected.pases.map((pase) => (
              <PaseCard key={pase.id} pase={pase} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaseCard({ pase }: { pase: PaseListItem }) {
  const acento = pase.color ?? "#C89B3C";

  return (
    <article
      className="overflow-hidden rounded-xl border border-borde-sutil bg-stone-900/40"
      style={{ borderLeftWidth: 3, borderLeftColor: acento }}
    >
      {pase.imagenPortada && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-950">
          <Image
            src={pase.imagenPortada}
            alt={`Información del ${pase.nombre}`}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-serif text-base font-semibold text-texto-claro">
            {pase.nombre}
          </h4>
          {pase.tipo && (
            <span className="mt-0.5 shrink-0 rounded-full border border-stone-700 bg-stone-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-400">
              {pase.tipo}
            </span>
          )}
        </div>

        {/* Datos del recorrido oficial */}
        {pase.horario && (
          <p className="mt-3 flex items-center gap-2 text-sm text-stone-400">
            <svg className="h-4 w-4 shrink-0 text-acento-dorado" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pase.horario}
          </p>
        )}

        {(pase.inicio || pase.fin || pase.ruta) && (
          <p className="mt-2 flex items-start gap-2 text-sm text-stone-400">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-acento-dorado" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {pase.inicio && pase.fin ? `${pase.inicio} → ${pase.fin}` : pase.ruta}
          </p>
        )}

        {pase.personaje && (
          <p className="mt-2 flex items-center gap-2 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: acento }} />
            <span className="text-stone-500">Personaje:</span>
            <span className="font-medium" style={{ color: acento }}>{pase.personaje}</span>
          </p>
        )}

        {/* Festividades sin recorrido — solo descripción */}
        {!pase.horario && pase.fechaDescripcion && (
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            {pase.fechaDescripcion}
          </p>
        )}
      </div>
    </article>
  );
}
