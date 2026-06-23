"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { PaseListItem } from "@seres-del-pase/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface CalendarioGridProps {
  pases: PaseListItem[];
}

export function CalendarioGrid({ pases }: CalendarioGridProps) {
  // Solo importan los meses que tienen pases (la mayoría del año no tiene).
  const porMes = useMemo(() => {
    const map = new Map<number, PaseListItem[]>();
    for (const p of pases) {
      if (!p.mes) continue;
      if (!map.has(p.mes)) map.set(p.mes, []);
      map.get(p.mes)!.push(p);
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.dia ?? 0) - (b.dia ?? 0));
    return map;
  }, [pases]);

  const mesesActivos = useMemo(
    () => [...porMes.keys()].sort((a, b) => a - b),
    [porMes]
  );

  const [mesSel, setMesSel] = useState(mesesActivos[0] ?? 12);
  const eventosMes = porMes.get(mesSel) ?? [];

  // Agrupar los pases del mes por día (un día puede tener varios pases).
  const porDia = useMemo(() => {
    const map = new Map<number, PaseListItem[]>();
    for (const p of eventosMes) {
      const dia = p.dia ?? 0;
      if (!map.has(dia)) map.set(dia, []);
      map.get(dia)!.push(p);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [eventosMes]);

  if (mesesActivos.length === 0) {
    return (
      <p className="text-stone-500">Aún no hay pases programados.</p>
    );
  }

  return (
    <div>
      {/* Selector — solo los meses con pases */}
      <div className="flex flex-wrap gap-2.5">
        {mesesActivos.map((m) => {
          const count = porMes.get(m)!.length;
          const active = m === mesSel;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMesSel(m)}
              aria-pressed={active}
              className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 ${
                active
                  ? "border-acento-dorado bg-acento-dorado font-semibold text-fondo-oscuro shadow-[0_0_16px_rgba(200,155,60,0.3)]"
                  : "border-borde-sutil bg-stone-900/40 text-stone-300 hover:border-acento-dorado/60 hover:text-acento-dorado"
              }`}
            >
              {MESES[m - 1]}
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                  active
                    ? "bg-fondo-oscuro/20 text-fondo-oscuro"
                    : "bg-acento-dorado/15 text-acento-dorado"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pases del mes seleccionado — agrupados por día, en grid */}
      <div className="mt-10 space-y-12">
        {porDia.map(([dia, evs]) => (
          <section key={dia}>
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-serif text-4xl font-bold leading-none text-acento-dorado">
                {String(dia).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-medium text-texto-claro">
                  {MESES[mesSel - 1]}
                </p>
                <p className="text-xs text-stone-500">
                  {evs.length === 1 ? "1 evento" : `${evs.length} eventos`}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {evs.map((pase) => (
                <PaseCard key={pase.id} pase={pase} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PaseCard({ pase }: { pase: PaseListItem }) {
  const acento = pase.color ?? "#C89B3C";

  return (
    <article
      className="overflow-hidden rounded-xl border border-borde-sutil bg-stone-900/40 transition-colors hover:border-acento-dorado/40"
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
