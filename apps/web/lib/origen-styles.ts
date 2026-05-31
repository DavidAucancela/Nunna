export type Origen = "prehispanico" | "colonial" | "mestizo" | "mixto";

export const ORIGEN_STYLES: Record<
  Origen,
  { bgFrom: string; bgVia: string; accentColor: string; patternId: string; label: string }
> = {
  prehispanico: {
    bgFrom: "#1A5C44",   // jade oscuro — claramente verde
    bgVia: "#0F2920",
    accentColor: "#34D399",
    patternId: "chakana",
    label: "Prehispánico",
  },
  colonial: {
    bgFrom: "#5C3D00",   // ámbar oscuro — claramente dorado
    bgVia: "#2A1C00",
    accentColor: "#FBBF24",
    patternId: "espiral",
    label: "Colonial",
  },
  mestizo: {
    bgFrom: "#5C1414",   // rojo oscuro — claramente carmesí
    bgVia: "#2A0A0A",
    accentColor: "#F87171",
    patternId: "rombo",
    label: "Mestizo",
  },
  mixto: {
    bgFrom: "#2E1460",   // violeta oscuro — claramente índigo
    bgVia: "#150A2A",
    accentColor: "#A78BFA",
    patternId: "espiral",
    label: "Mixto",
  },
};

export const DEFAULT_ORIGEN_STYLE = {
  bgFrom: "#2A2420",
  bgVia: "#1A1614",
  accentColor: "#C89B3C",
  patternId: "rombo",
  label: "Personaje",
};

export function getOrigenStyle(origen?: string) {
  if (!origen) return DEFAULT_ORIGEN_STYLE;
  return ORIGEN_STYLES[origen as Origen] ?? DEFAULT_ORIGEN_STYLE;
}
