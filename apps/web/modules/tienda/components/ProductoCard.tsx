import type { Producto } from "@seres-del-pase/types";
import { Link } from "@/i18n/navigation";
import { formatoPrecio } from "@/lib/tienda/carrito";
import { BotonAgregar } from "./BotonAgregar";
import { MiniaturaProducto } from "./MiniaturaProducto";

/** Tarjeta de un imán o figura en /tienda. */
export function ProductoCard({
  producto,
  locale,
  textos,
}: {
  producto: Producto;
  locale: string;
  textos: { tipo: string; agotado: string; verFicha: string };
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-borde-sutil bg-stone-950/60">
      <div className="relative">
        <MiniaturaProducto
          producto={producto}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="aspect-[4/5] w-full"
        />
        {!producto.disponible && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] uppercase tracking-wider text-stone-300">
            {textos.agotado}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-acento-dorado">{textos.tipo}</p>
        <h3 className="mt-0.5 font-serif text-lg font-bold leading-tight text-texto-claro">{producto.nombre}</h3>
        {producto.personajeSlug && (
          <Link
            href={{ pathname: "/personajes/[slug]", params: { slug: producto.personajeSlug } }}
            className="mt-1 text-xs text-stone-400 underline-offset-2 hover:text-texto-claro hover:underline"
          >
            {textos.verFicha} →
          </Link>
        )}
        <div className="mt-auto pt-3">
          <p className="mb-2 font-serif text-2xl font-bold tabular-nums text-texto-claro">
            {formatoPrecio(producto.precio, locale)}
          </p>
          {producto.disponible && <BotonAgregar productoId={producto.id} nombre={producto.nombre} />}
        </div>
      </div>
    </li>
  );
}
