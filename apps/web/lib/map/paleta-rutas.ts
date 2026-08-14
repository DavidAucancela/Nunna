/**
 * Colores para las rutas de recorrido dentro de una provincia (`RecorridosProvincia`).
 * NUNCA incluir `#B8312F` (acento-rojo): ese color está reservado para "provincia
 * seleccionada" en el mapa nacional (`MapaEcuador`) — reutilizarlo aquí haría que
 * una ruta se lea como el mismo estado.
 *
 * No se reutiliza el campo editorial `color` de `pases.json`: el dataset actual
 * solo tiene 5 valores distintos y uno de ellos es exactamente el rojo reservado.
 */
export const PALETA_RUTAS: readonly string[] = [
  "#C89B3C", // acento-dorado (marca)
  "#4A90D9", // azul
  "#1F4D3F", // acento-jade
  "#D97A4A", // naranja terracota
  "#8B6BD1", // violeta
  "#5FBE8B", // verde menta
  "#D14F8F", // magenta
  "#7FA6A3", // gris-verde
];

const ROJO_RESERVADO = "#B8312F";

if (PALETA_RUTAS.some((c) => c.toUpperCase() === ROJO_RESERVADO)) {
  throw new Error(`PALETA_RUTAS no debe contener el rojo reservado (${ROJO_RESERVADO})`);
}

export function colorParaRuta(index: number): string {
  return PALETA_RUTAS[index % PALETA_RUTAS.length]!;
}
