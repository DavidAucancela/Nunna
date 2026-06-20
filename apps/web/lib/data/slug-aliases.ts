/**
 * Contrato permanente del QR — los slugs impresos en los imanes no pueden cambiar.
 *
 * El QR de cada imán codifica /[locale]/personajes/<slug>. Una vez impreso, ese
 * slug es para siempre. Si necesitas renombrar un personaje:
 *   1. Cambia su "slug" en lib/data/personajes.json al nombre nuevo.
 *   2. Agrega aquí { from: "<slug-viejo>", to: "<slug-nuevo>" }.
 *
 * next.config.ts genera un 301 por cada alias (en es/qu/en), así los imanes ya
 * vendidos —cuyo QR apunta al slug viejo— siguen llegando a la ficha correcta.
 * Nunca borres ni edites un alias existente: equivale a romper imanes impresos.
 */
export interface SlugAlias {
  /** Slug viejo impreso en imanes ya vendidos. */
  from: string;
  /** Slug actual del personaje en personajes.json. */
  to: string;
}

export const slugAliases: SlugAlias[] = [
  // Ejemplo (una vez agregado, mantener para siempre):
  // { from: "diablo-huma", to: "aya-uma" },
];
