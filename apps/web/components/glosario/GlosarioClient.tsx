"use client";

import { useState, useMemo, useRef } from "react";
import type { GlosarioKichwa } from "@seres-del-pase/types";

interface GlosarioClientProps {
  palabras: GlosarioKichwa[];
}

export function GlosarioClient({ palabras }: GlosarioClientProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return palabras;
    return palabras.filter(
      (p) =>
        p.palabra.toLowerCase().includes(q) ||
        p.traduccion.toLowerCase().includes(q) ||
        (p.contexto ?? "").toLowerCase().includes(q)
    );
  }, [query, palabras]);

  const grupos = useMemo(() => {
    return filtered.reduce<Record<string, GlosarioKichwa[]>>((acc, p) => {
      const letra = p.palabra[0]?.toUpperCase() ?? "#";
      if (!acc[letra]) acc[letra] = [];
      acc[letra]!.push(p);
      return acc;
    }, {});
  }, [filtered]);

  const letras = Object.keys(grupos).sort((a, b) => a.localeCompare(b));
  const todasLasLetras = [...new Set(palabras.map((p) => p.palabra[0]?.toUpperCase() ?? "#"))].sort(
    (a, b) => a.localeCompare(b)
  );

  return (
    <div>
      {/* Barra de búsqueda */}
      <div className="relative mt-8">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar palabra, traducción o contexto…"
          className="w-full rounded-xl border border-borde-sutil bg-stone-900/50 py-3 pl-11 pr-4 text-sm text-texto-claro placeholder-stone-600 outline-none transition-colors focus:border-acento-dorado/40 focus:bg-stone-900"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-500 hover:text-stone-300 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Contador + nav alfabética */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-xs text-stone-500">
          {filtered.length} {filtered.length === 1 ? "palabra" : "palabras"}
          {query && <span className="ml-1">para "{query}"</span>}
        </span>

        {!query && (
          <nav className="flex flex-wrap gap-1.5" aria-label="Índice alfabético">
            {todasLasLetras.map((letra) => {
              const tieneResultados = grupos[letra] !== undefined;
              return (
                <a
                  key={letra}
                  href={`#letra-${letra}`}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                    tieneResultados
                      ? "text-acento-dorado hover:bg-stone-800"
                      : "text-stone-700 pointer-events-none"
                  }`}
                >
                  {letra}
                </a>
              );
            })}
          </nav>
        )}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-stone-500">
          <p>No hay palabras que coincidan con "{query}".</p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {letras.map((letra) => (
            <section key={letra} id={`letra-${letra}`}>
              <h2 className="mb-4 border-b border-borde-sutil pb-2 font-serif text-2xl font-bold text-acento-dorado">
                {letra}
                <span className="ml-2 text-sm font-sans font-normal text-stone-600">
                  ({grupos[letra]!.length})
                </span>
              </h2>
              <dl className="space-y-4">
                {grupos[letra]!.map((p) => (
                  <div key={p.id}>
                    <dt className="flex items-baseline gap-3">
                      <span className="font-serif text-lg font-semibold italic text-texto-claro">
                        {p.palabra}
                      </span>
                      {p.pronunciacion && (
                        <span className="text-xs text-stone-500">[{p.pronunciacion}]</span>
                      )}
                    </dt>
                    <dd className="mt-1 text-stone-400">
                      <strong className="text-stone-300">{p.traduccion}</strong>
                      {p.contexto && <span className="ml-2 text-sm">— {p.contexto}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
