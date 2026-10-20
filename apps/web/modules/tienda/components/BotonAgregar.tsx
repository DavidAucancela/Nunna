"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCarrito } from "@/components/tienda/CarritoProvider";

/**
 * Agrega un producto al carrito y abre el cajón.
 * `pildora` = versión chica que flota sobre las tarjetas de /personajes.
 */
export function BotonAgregar({
  productoId,
  nombre,
  etiqueta,
  variante = "bloque",
  className = "",
}: {
  productoId: string;
  /** Para el aria-label ("Agregar Perro al carrito"). */
  nombre: string;
  etiqueta?: string;
  variante?: "bloque" | "pildora";
  className?: string;
}) {
  const t = useTranslations("tienda");
  const { agregar } = useCarrito();
  const [hecho, setHecho] = useState(false);

  useEffect(() => {
    if (!hecho) return;
    const id = window.setTimeout(() => setHecho(false), 1400);
    return () => window.clearTimeout(id);
  }, [hecho]);

  const estilos =
    variante === "pildora"
      ? "gap-1 rounded-full bg-acento-rojo/95 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-black/40 backdrop-blur-sm hover:bg-acento-rojo sm:px-3.5 sm:text-xs"
      : "w-full justify-center gap-2 rounded-full bg-acento-rojo px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a02a28]";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        agregar(productoId);
        setHecho(true);
      }}
      aria-label={t("agregar_a", { nombre })}
      className={`inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-dorado ${estilos} ${className}`}
    >
      {hecho ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <IconoCarrito className="h-3.5 w-3.5" />
      )}
      {etiqueta ?? t("agregar")}
    </button>
  );
}

export function IconoCarrito({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}
