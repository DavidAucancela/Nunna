"use client";

import { useState } from "react";
import type { PaseListItem } from "@seres-del-pase/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface PaseEnDia {
  dia: number;
  pases: PaseListItem[];
}

interface CalendarioGridProps {
  pases: PaseListItem[];
  pasesFijos: { mes: number; dia: number | null; nombre: string; descripcion: string; tipo: string }[];
}

export function CalendarioGrid({ pases, pasesFijos }: CalendarioGridProps) {
  const [selected, setSelected] = useState<{ mes: number; dia: number; pases: { nombre: string; descripcion: string; tipo: string }[] } | null>(null);

  function getDiasConEvento(mes: number): Record<number, { nombre: string; descripcion: string; tipo: string }[]> {
    const result: Record<number, { nombre: string; descripcion: string; tipo: string }[]> = {};

    for (const p of pases) {
      if (p.mes === mes && p.dia) {
        if (!result[p.dia]) result[p.dia] = [];
        result[p.dia]!.push({
          nombre: p.nombre,
          descripcion: p.fechaDescripcion ?? "",
          tipo: p.fechaTipo ?? "pase",
        });
      }
    }

    for (const p of pasesFijos) {
      if (p.mes === mes && p.dia) {
        if (!result[p.dia]) result[p.dia] = [];
        const yaExiste = result[p.dia]!.some((e) => e.nombre === p.nombre);
        if (!yaExiste) {
          result[p.dia]!.push({ nombre: p.nombre, descripcion: p.descripcion, tipo: p.tipo });
        }
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

      {/* Panel de detalle */}
      {selected && (
        <div className="mt-8 rounded-2xl border border-acento-dorado/30 bg-stone-900/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-acento-dorado">
                {selected.dia} de {MESES[selected.mes - 1]}
              </p>
              <h3 className="mt-1 font-serif text-xl font-bold text-texto-claro">
                {selected.pases.map((p) => p.nombre).join(" · ")}
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
          <div className="mt-4 space-y-3">
            {selected.pases.map((p, i) => (
              <div key={i}>
                {p.descripcion && (
                  <p className="text-sm leading-relaxed text-stone-400">{p.descripcion}</p>
                )}
                <span className="mt-1 inline-flex rounded-full border border-stone-700 bg-stone-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-500">
                  {p.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
