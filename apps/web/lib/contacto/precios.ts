// Precios de los imanes en /contacto. No hay carrito ni pago en el sitio: el precio se muestra
// para que la persona sepa cuánto cuesta y viaja en el mensaje de WhatsApp.

export const PRECIOS = { unidad: 4, trio: 10, coleccion: 20 } as const;
export const TAMANO_TRIO = 3;
export const TAMANO_COLECCION = 6;

export type Promo = "ninguna" | "trio" | "coleccion";

export interface Cotizacion {
  cantidad: number;
  colecciones: number;
  trios: number;
  sueltos: number;
  total: number;
  /** Lo que costaría sin promociones (cantidad × precio por unidad). */
  regular: number;
  ahorro: number;
  promo: Promo;
}

/** Arma el mejor precio: primero colecciones de 6, luego grupos de 3, luego sueltos a $4. */
export function cotizar(cantidad: number): Cotizacion {
  const n = Math.max(0, Math.floor(cantidad));
  const colecciones = Math.floor(n / TAMANO_COLECCION);
  const resto = n % TAMANO_COLECCION;
  const trios = Math.floor(resto / TAMANO_TRIO);
  const sueltos = resto % TAMANO_TRIO;
  const total = colecciones * PRECIOS.coleccion + trios * PRECIOS.trio + sueltos * PRECIOS.unidad;
  const regular = n * PRECIOS.unidad;
  return {
    cantidad: n,
    colecciones,
    trios,
    sueltos,
    total,
    regular,
    ahorro: regular - total,
    promo: colecciones > 0 ? "coleccion" : trios > 0 ? "trio" : "ninguna",
  };
}

/** Cuántos imanes faltan para la próxima promoción (null si ya tiene la colección o no eligió nada). */
export function siguientePromo(cantidad: number): { promo: Exclude<Promo, "ninguna">; faltan: number } | null {
  if (cantidad <= 0) return null;
  if (cantidad < TAMANO_TRIO) return { promo: "trio", faltan: TAMANO_TRIO - cantidad };
  if (cantidad < TAMANO_COLECCION) return { promo: "coleccion", faltan: TAMANO_COLECCION - cantidad };
  return null;
}
