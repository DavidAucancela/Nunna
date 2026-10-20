import type { EntregaTienda, Producto, TipoProducto } from "@seres-del-pase/types";
import tiendaRaw from "../data/tienda.json";
import personajesRaw from "../data/personajes.json";

// Orden de la tienda: primero la colección completa, luego imanes y figuras.
const ORDEN_TIPO: Record<TipoProducto, number> = { set: 0, iman: 1, figura: 2 };

interface ProductoRaw {
  id: string;
  tipo: string;
  precio: number;
  disponible?: boolean;
  personajeSlug?: string;
  imagen?: string | null;
  incluye?: string[];
}

function toProducto(raw: ProductoRaw): Producto {
  const personaje = raw.personajeSlug
    ? personajesRaw.find((p) => p.slug === raw.personajeSlug)
    : undefined;
  const tipo = raw.tipo as TipoProducto;
  const producto: Producto = {
    id: raw.id,
    tipo,
    precio: raw.precio,
    disponible: raw.disponible !== false,
    nombre: personaje ? (personaje.tarjeta?.nombre ?? personaje.nombre) : "",
  };
  if (raw.personajeSlug) producto.personajeSlug = raw.personajeSlug;
  if (raw.incluye) producto.incluye = raw.incluye;
  if (personaje?.tarjeta?.ilustracion) producto.ilustracion = personaje.tarjeta.ilustracion;
  // Imán: la figura del imán. Figura grande: su foto propia si existe (si no, la UI usa la ilustración).
  const imagen = raw.imagen ?? (tipo === "iman" ? personaje?.imagenPortada : undefined);
  if (imagen) producto.imagen = imagen;
  return producto;
}

function ordenTarjeta(slug?: string): number {
  return personajesRaw.find((p) => p.slug === slug)?.tarjeta?.orden ?? 99;
}

/** Catálogo completo, ordenado: set → imanes → figuras (cada grupo por el orden de la tarjeta). */
export async function getProductos(_options: { locale?: string } = {}): Promise<Producto[]> {
  return (tiendaRaw.productos as ProductoRaw[])
    .map(toProducto)
    .sort(
      (a, b) =>
        ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo] ||
        ordenTarjeta(a.personajeSlug) - ordenTarjeta(b.personajeSlug),
    );
}

export async function getEntrega(): Promise<EntregaTienda> {
  return tiendaRaw.entrega as EntregaTienda;
}
