import Image from "next/image";
import type { Producto } from "@seres-del-pase/types";

/**
 * Visual de un producto: la foto del imán, o la ilustración de la tarjeta mientras
 * la figura grande no tenga foto propia. El set (caja de regalo) usa un dibujo de caja.
 */
export function MiniaturaProducto({
  producto,
  sizes,
  className = "",
}: {
  producto: Producto;
  sizes: string;
  className?: string;
}) {
  if (producto.tipo === "set") {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-br from-[#37220A] to-stone-950 ${className}`}>
        <CajaRegalo className="h-1/2 w-1/2 text-acento-dorado" />
      </div>
    );
  }

  const foto = producto.imagen;
  const src = foto ?? producto.ilustracion;
  return (
    <div className={`relative overflow-hidden ${foto ? "bg-stone-900" : "bg-gradient-to-b from-[#37220A] to-stone-950"} ${className}`}>
      {src && (
        <Image
          src={src}
          alt={producto.tipo === "iman" ? `Imán de ${producto.nombre}` : `${producto.nombre} — figura de colección`}
          fill
          sizes={sizes}
          className={foto ? "object-cover object-top" : "object-contain object-bottom p-[8%]"}
        />
      )}
    </div>
  );
}

export function CajaRegalo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="7" y="19" width="34" height="23" rx="2" />
      <rect x="4" y="12" width="40" height="8" rx="2" />
      <path d="M24 12v30" />
      <path d="M24 12c-3-6-11-7-11-2s8 2 11 2zM24 12c3-6 11-7 11-2s-8 2-11 2z" strokeLinejoin="round" />
    </svg>
  );
}
