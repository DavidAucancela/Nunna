"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface Props<T> {
  items: T[];
  getKey: (item: T) => string;
  /** `alto` = alto real de la fila en px (crece si hay `maxItemHeight`). */
  renderItem: (item: T, alto: number) => ReactNode;
  /** Alto de cada elemento en px — de ahí sale cuántos caben por página. */
  itemHeight: number;
  /** Si se da, las filas se estiran para llenar el alto, hasta este tope. */
  maxItemHeight?: number;
  columnas?: number;
  gap?: number;
  labelAnterior: string;
  labelSiguiente: string;
  /** Texto del indicador, p. ej. "2 de 4". */
  labelPagina: (n: number, total: number) => string;
}

/**
 * Lista sin scroll: mide el alto disponible, muestra los elementos que caben y
 * pasa de grupo con flechas. `/pases` es una ventana fija — nada dentro de ella
 * se desplaza, ni la página ni los paneles.
 */
export function ListaPaginada<T>({
  items,
  getKey,
  renderItem,
  itemHeight,
  maxItemHeight,
  columnas = 1,
  gap = 8,
  labelAnterior,
  labelSiguiente,
  labelPagina,
}: Props<T>) {
  const reduced = useReducedMotion();
  const areaRef = useRef<HTMLDivElement>(null);
  const [filas, setFilas] = useState(1);
  const [altoArea, setAltoArea] = useState(0);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const medir = () => {
      setAltoArea(el.clientHeight);
      setFilas(Math.max(1, Math.floor((el.clientHeight + gap) / (itemHeight + gap))));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemHeight, gap]);

  const porPagina = filas * columnas;
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));
  const actual = Math.min(pagina, totalPaginas - 1);
  const visibles = items.slice(actual * porPagina, (actual + 1) * porPagina);
  // Se reparte el alto entre las filas que de verdad se muestran, no entre las
  // que cabrían: con 6 elementos en 2 columnas son 3, aunque entren 5.
  const filasVisibles = Math.max(1, Math.min(filas, Math.ceil(visibles.length / columnas)));
  const altoItem = maxItemHeight
    ? Math.max(
        itemHeight,
        Math.min(maxItemHeight, Math.floor((altoArea - gap * (filasVisibles - 1)) / filasVisibles))
      )
    : itemHeight;

  // Lista nueva (otra provincia) → primera página.
  useEffect(() => setPagina(0), [items]);

  const botonFlecha =
    "flex h-11 w-11 items-center justify-center rounded-full border border-borde-sutil text-lg text-texto-claro transition-colors hover:border-acento-dorado hover:text-acento-dorado focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 disabled:cursor-default disabled:opacity-30 disabled:hover:border-borde-sutil disabled:hover:text-texto-claro";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={actual}
            className="grid"
            style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`, gap }}
            initial="fuera"
            animate="dentro"
            exit="sale"
            variants={{
              fuera: {},
              dentro: { transition: { staggerChildren: reduced ? 0 : 0.055 } },
              sale: { opacity: 0, transition: { duration: reduced ? 0 : 0.15 } },
            }}
          >
            {/* Los elementos entran uno tras otro, no en bloque. */}
            {visibles.map((item) => (
              <motion.li
                key={getKey(item)}
                style={{ height: altoItem }}
                variants={{
                  fuera: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
                  dentro: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: reduced ? 0 : 0.32, ease: "easeOut" },
                  },
                }}
              >
                {renderItem(item, altoItem)}
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {totalPaginas > 1 && (
        <div className="flex flex-shrink-0 items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setPagina(actual - 1)}
            disabled={actual === 0}
            aria-label={labelAnterior}
            className={botonFlecha}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <p aria-live="polite" className="text-sm tabular-nums text-stone-400 md:text-base">
            {labelPagina(actual + 1, totalPaginas)}
          </p>
          <button
            type="button"
            onClick={() => setPagina(actual + 1)}
            disabled={actual === totalPaginas - 1}
            aria-label={labelSiguiente}
            className={botonFlecha}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  );
}
