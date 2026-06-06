"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { getOrigenStyle } from "@/lib/origen-styles";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface PersonajesCarruselProps {
  personajes: PersonajeListItem[];
}

export function PersonajesCarrusel({ personajes }: PersonajesCarruselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [personajes]);

  const scroll = (dir: "prev" | "next") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Fades laterales */}
      <div className={`pointer-events-none absolute left-0 top-0 bottom-4 z-10 w-16 bg-gradient-to-r from-fondo-oscuro to-transparent transition-opacity duration-300 ${atStart ? "opacity-0" : "opacity-100"}`} />
      <div className={`pointer-events-none absolute right-0 top-0 bottom-4 z-10 w-16 bg-gradient-to-l from-fondo-oscuro to-transparent transition-opacity duration-300 ${atEnd ? "opacity-0" : "opacity-100"}`} />

      {/* Botón anterior */}
      <button
        onClick={() => scroll("prev")}
        disabled={atStart}
        aria-label="Personaje anterior"
        className={`absolute left-2 top-[40%] z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/90 text-stone-300 backdrop-blur-sm transition-all duration-200 hover:border-stone-600 hover:text-white ${atStart ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Botón siguiente */}
      <button
        onClick={() => scroll("next")}
        disabled={atEnd}
        aria-label="Personaje siguiente"
        className={`absolute right-2 top-[40%] z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/90 text-stone-300 backdrop-blur-sm transition-all duration-200 hover:border-stone-600 hover:text-white ${atEnd ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {personajes.map((p) => {
          const style = getOrigenStyle(p.origen);
          const hasImage = !!p.imagenPortada;

          return (
            <Link
              key={p.id}
              href={`/personajes/${p.slug}`}
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
              className="group flex-none w-[150px] sm:w-[180px] focus:outline-none"
            >
              {/* Imagen */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-borde-sutil transition-all duration-300 group-hover:border-stone-600 group-hover:shadow-lg">
                {hasImage ? (
                  <Image
                    src={p.imagenPortada!}
                    alt={p.nombre}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="180px"
                  />
                ) : (
                  <OrigenPlaceholder
                    origen={p.origen}
                    nombre={p.nombre}
                    variant="card"
                    className="absolute inset-0"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/10 to-transparent" />

                {/* Badge origen */}
                <span
                  className="absolute left-2.5 top-2.5 rounded-full border border-white/10 bg-stone-950/70 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                  style={{ color: style.accentColor }}
                >
                  {style.label}
                </span>

                {/* Nombre */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {p.nombreKichwa && (
                    <p className="font-serif text-[10px] italic leading-none mb-0.5" style={{ color: style.accentColor }}>
                      {p.nombreKichwa}
                    </p>
                  )}
                  <p className="font-serif text-sm font-bold leading-tight text-white">
                    {p.nombre}
                  </p>
                </div>

                {/* Glow on hover */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px ${style.accentColor}40` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
