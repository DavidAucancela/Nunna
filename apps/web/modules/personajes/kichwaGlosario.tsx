import { type ReactNode } from "react";

/**
 * Significados kichwa de los términos que aparecen en las narrativas.
 * Solo las palabras presentes aquí muestran tooltip; el resto de
 * `palabrasClave` recibe un énfasis tipográfico suave.
 * ⚠ Traducciones tentativas — revisar con hablante nativo (misma deuda que
 * los namespaces kichwa de i18n).
 */
export const KICHWA_GLOSARIO: Record<string, string> = {
  "aya": "espíritu, ánima",
  "uma": "cabeza",
  "aya uma": "cabeza del espíritu",
  "pachamama": "Madre Tierra",
  "kay pacha": "el mundo del aquí y ahora",
  "uku pacha": "el mundo de adentro, el de los ancestros",
  "hanan pacha": "el mundo de arriba",
  "allku": "perro",
  "supay": "espíritu dual del mundo de adentro",
};

function esLetra(ch: string | undefined): boolean {
  return !!ch && /\p{L}/u.test(ch);
}

/**
 * Envuelve las palabras clave del texto: términos con entrada en el glosario
 * kichwa → underline punteado + tooltip; el resto → énfasis suave. La
 * detección respeta límites de palabra aun con tildes (sin \b, que falla
 * con caracteres no ASCII).
 */
export function renderConTerminos(texto: string, terminos: string[], accentColor: string): ReactNode {
  if (terminos.length === 0) return texto;

  const escaped = [...terminos]
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "giu");
  const parts = texto.split(re);

  return parts.map((part, i) => {
    const esTermino = i % 2 === 1;
    if (!esTermino) return part;

    const prev = parts[i - 1];
    const next = parts[i + 1];
    const limpio = !esLetra(prev?.slice(-1)) && !esLetra(next?.charAt(0));
    if (!limpio) return part;

    const significado = KICHWA_GLOSARIO[part.toLowerCase()];
    if (!significado) {
      return (
        <em key={i} className="not-italic font-medium text-texto-claro">
          {part}
        </em>
      );
    }
    return <TerminoKichwa key={i} termino={part} significado={significado} accentColor={accentColor} />;
  });
}

/** Palabra kichwa con tooltip de traducción al hover/focus. */
export function TerminoKichwa({
  termino,
  significado,
  accentColor,
}: {
  termino: string;
  significado: string;
  accentColor: string;
}) {
  return (
    <span className="group relative inline-block">
      <span
        tabIndex={0}
        className="cursor-help font-medium underline decoration-dotted underline-offset-4 focus-visible:outline-none"
        style={{ color: accentColor, textDecorationColor: `${accentColor}70` }}
      >
        {termino}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-borde-sutil bg-stone-900 px-3 py-2 text-xs not-italic leading-snug text-stone-300 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="mb-0.5 block text-[9px] uppercase tracking-[0.25em]" style={{ color: accentColor }}>
          Kichwa
        </span>
        {significado}
      </span>
    </span>
  );
}
