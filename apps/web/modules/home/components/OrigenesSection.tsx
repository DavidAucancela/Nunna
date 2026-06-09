import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { ORIGEN_STYLES } from "@/lib/origen-styles";
import type { Origen } from "@/lib/origen-styles";

const ORIGENES: {
  id: Origen;
  cantidad: number;
  descripcion: string;
}[] = [
  {
    id: "prehispanico",
    cantidad: 4,
    descripcion:
      "Seres nacidos en la cosmovisión andina anterior a la conquista. Conectan con la Pachamama, los Apus y el ciclo del tiempo kichwa.",
  },
  {
    id: "colonial",
    cantidad: 3,
    descripcion:
      "Figuras introducidas durante la evangelización española, resignificadas por las comunidades kichwa para expresar su propia identidad.",
  },
  {
    id: "mestizo",
    cantidad: 1,
    descripcion:
      "Personajes surgidos del encuentro entre las tradiciones andinas y europeas, con elementos de ambas cosmovisiones integrados.",
  },
  {
    id: "mixto",
    cantidad: 1,
    descripcion:
      "Seres que mezclan múltiples períodos históricos, evidenciando la naturaleza viva y en transformación constante del pase.",
  },
];

export function OrigenesSection() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {ORIGENES.map((origen) => {
        const style = ORIGEN_STYLES[origen.id];
        return (
          <div
            key={origen.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-borde-sutil cursor-default"
          >
            {/* Fondo artístico */}
            <OrigenPlaceholder
              origen={origen.id}
              nombre={style.label}
              variant="hero"
              uid={`home-${origen.id}`}
              className="absolute inset-0"
            />

            {/* Overlay oscuro que se aclara en hover */}
            <div className="absolute inset-0 bg-fondo-oscuro/65 transition-all duration-500 group-hover:bg-fondo-oscuro/30" />

            {/* Glow ring estático */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ boxShadow: `inset 0 0 0 1.5px ${style.accentColor}50` }}
            />

            {/* Contenido */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: style.accentColor }}
              >
                {style.label}
              </p>
              <p className="mt-0.5 font-serif text-xl font-bold text-white sm:text-2xl">
                {origen.cantidad} {origen.cantidad === 1 ? "ser" : "seres"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-stone-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                {origen.descripcion}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
