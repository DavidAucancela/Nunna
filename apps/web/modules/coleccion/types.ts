/** Datos mínimos de un personaje para la colección (/mis-personajes, animación de guardado). */
export interface PersonajeLite {
  slug: string;
  nombre: string;
  nombreKichwa?: string | null;
  origen: string | null;
  imagenPortada: string | null;
  imagenBanner?: string | null;
  /** Foto de los 4 imanes juntos — usada por PersonajesLibro en /mis-personajes. */
  imagenGrupo?: string | null;
  /** Frase corta (leyenda) — usada por PersonajesLibro en /mis-personajes. */
  leyenda?: string | null;
}
