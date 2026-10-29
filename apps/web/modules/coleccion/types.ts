import type { TarjetaArte } from "@seres-del-pase/types";

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
  /** Imán recortado (fondo transparente) si `imagenPortada` trae fondo. */
  imagenIman?: string | null;
  /** Frase corta (leyenda) — usada por PersonajesLibro en /mis-personajes. */
  leyenda?: string | null;
  /** Arte de la tarjeta impresa — los círculos de la colección. */
  tarjeta?: TarjetaArte | null;
}
