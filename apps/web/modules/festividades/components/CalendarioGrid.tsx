"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { PaseListItem } from "@seres-del-pase/types";
import { Link } from "@/i18n/navigation";

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

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
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

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative max-h-[90dvh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[90dvh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          style={{ touchAction: "pinch-zoom" }}
        />
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-300 shadow-lg transition-colors hover:bg-stone-700 hover:text-white"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}

function PaseCard({ pase }: { pase: PaseListItem }) {
  const acento = pase.color ?? "#C89B3C";
  const [lightbox, setLightbox] = useState<string | null>(null);
  const ruta = pase.inicio && pase.fin ? `${pase.inicio} → ${pase.fin}` : pase.ruta;

  return (
    <>
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            src={lightbox}
            alt={`Fotografía de ${pase.nombre}`}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      <article className="group flex flex-col overflow-hidden rounded-2xl border border-borde-sutil bg-stone-900/50 transition-all duration-300 hover:border-stone-700 hover:bg-stone-900/80">

        {/* Imagen — clickable para lightbox */}
        {pase.imagenPortada ? (
          <button
            type="button"
            onClick={() => setLightbox(pase.imagenPortada!)}
            className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-stone-950"
            aria-label={`Ver foto de ${pase.nombre}`}
          >
            <Image
              src={pase.imagenPortada}
              alt={pase.nombre}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradiente inferior para legibilidad del badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent" />
            {/* Badge tipo sobre la imagen */}
            {pase.tipo && (
              <span
                className="absolute bottom-2 left-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: `${acento}cc` }}
              >
                {pase.tipo}
              </span>
            )}
            {/* Ícono zoom en hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <svg width="16" height="16" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803zM10.5 7.5v6m3-3h-6" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          /* Sin foto — franja de color con tipo */
          <div className="flex h-2 w-full shrink-0" style={{ backgroundColor: acento }} />
        )}

        {/* Contenido */}
        <div className="flex flex-1 flex-col gap-2.5 p-3">
          {/* Título + badge tipo (si no hay imagen) */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-serif text-sm font-bold leading-snug text-texto-claro sm:text-base">
              <Link href={{ pathname: "/pases/[slug]", params: { slug: pase.slug } }} className="hover:underline">
                {pase.nombre}
              </Link>
            </h4>
            {!pase.imagenPortada && pase.tipo && (
              <span className="mt-0.5 shrink-0 rounded-full border border-stone-700 bg-stone-800 px-2 py-0.5 text-[9px] uppercase tracking-wider text-stone-400">
                {pase.tipo}
              </span>
            )}
          </div>

          {/* Metadatos compactos */}
          <div className="flex flex-col gap-1.5 text-xs text-stone-400">
            {pase.horario && (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" style={{ color: acento }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pase.horario}
              </span>
            )}
            {ruta && (
              <span className="flex items-start gap-1.5">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: acento }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="line-clamp-2">{ruta}</span>
              </span>
            )}
            {pase.personaje && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: acento }} />
                <span style={{ color: acento }}>{pase.personaje}</span>
              </span>
            )}
            {!pase.horario && pase.fechaDescripcion && (
              <p className="mt-0.5 leading-relaxed text-stone-500">
                {pase.fechaDescripcion}
              </p>
            )}
          </div>
        </div>

        {/* Línea de acento en la base */}
        <div className="h-[2px] w-full shrink-0 opacity-60" style={{ backgroundColor: acento }} />
      </article>
    </>
  );
}
