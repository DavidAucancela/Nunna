"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { getOrigenStyle } from "@/lib/origen-styles";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface PersonajesCarruselProps {
  personajes: PersonajeListItem[];
}

export function PersonajesCarrusel({ personajes }: PersonajesCarruselProps) {
  const [activeId, setActiveId] = useState<string>(personajes[0]?.id ?? "");
  const router = useRouter();

  const handleClick = useCallback(
    (p: PersonajeListItem) => {
      if (activeId === p.id) {
        router.push(`/personajes/${p.slug}`);
      } else {
        setActiveId(p.id);
      }
    },
    [activeId, router]
  );

  return (
    <div className="flex h-[400px] gap-1.5 sm:h-[480px]">
      {personajes.map((p) => {
        const style = getOrigenStyle(p.origen);
        const isActive = activeId === p.id;
        const hasImage = !!p.imagenPortada;

        return (
          <div
            key={p.id}
            className="relative min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-borde-sutil"
            style={{
              flex: isActive ? 5 : 0.55,
              transition: "flex 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={() => setActiveId(p.id)}
            onClick={() => handleClick(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleClick(p)}
            aria-label={p.nombre}
          >
            {/* Imagen de fondo */}
            {hasImage ? (
              <Image
                src={p.imagenPortada!}
                alt={p.nombre}
                fill
                className="object-cover object-top"
                style={{
                  opacity: isActive ? 1 : 0.25,
                  transform: isActive ? "scale(1)" : "scale(1.08)",
                  transition: "opacity 0.55s ease, transform 0.55s ease",
                }}
                sizes="(max-width: 640px) 70vw, 420px"
              />
            ) : (
              <div className="absolute inset-0">
                <OrigenPlaceholder
                  origen={p.origen}
                  nombre={p.nombre}
                  variant="card"
                  className="absolute inset-0"
                />
              </div>
            )}

            {/* Gradiente oscuro inferior */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />

            {/* Overlay adicional cuando está colapsado */}
            <div
              className="absolute inset-0 bg-stone-950 transition-opacity duration-500"
              style={{ opacity: isActive ? 0 : 0.55 }}
            />

            {/* Borde acento cuando está activo */}
            <div
              className="absolute inset-0 rounded-2xl transition-opacity duration-300"
              style={{
                boxShadow: `inset 0 0 0 1px ${style.accentColor}60`,
                opacity: isActive ? 1 : 0,
              }}
            />

            {/* Nombre vertical — solo cuando está colapsado */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{ opacity: isActive ? 0 : 1, pointerEvents: isActive ? "none" : "auto" }}
              aria-hidden={isActive}
            >
              <p
                className="max-h-[78%] overflow-hidden font-serif text-[11px] font-semibold text-stone-400 [writing-mode:vertical-rl] [text-overflow:ellipsis] rotate-180 select-none"
              >
                {p.nombre}
              </p>
            </div>

            {/* Contenido expandido — solo cuando está activo */}
            <div
              className="absolute bottom-0 left-0 right-0 p-5 transition-all duration-300"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateY(0)" : "translateY(8px)",
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <span
                className="mb-2.5 inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-widest font-medium"
                style={{ color: style.accentColor, borderColor: `${style.accentColor}40` }}
              >
                {style.label}
              </span>

              {p.nombreKichwa && (
                <p
                  className="mb-0.5 font-serif text-xs italic leading-none"
                  style={{ color: style.accentColor }}
                >
                  {p.nombreKichwa}
                </p>
              )}

              <p className="font-serif text-xl font-bold leading-tight text-white mb-4">
                {p.nombre}
              </p>

              <Link
                href={`/personajes/${p.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-stone-950/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
              >
                Ver personaje
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
