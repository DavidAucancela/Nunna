import type { Metadata } from "next";
import { getPases } from "@/lib/data";
import { CalendarioGrid } from "@/modules/festividades/components/CalendarioGrid";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Calendario festivo",
    description: "Fechas y festividades de los pases del Chimborazo — Riobamba, Ecuador.",
  };
}

export default async function CalendarioPage() {
  const pases = await getPases({});

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Chimborazo · Ecuador
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          Calendario festivo
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">
          Los pases riobambeños siguen el ciclo agrícola-ritual andino. Haz clic en cualquier fecha
          marcada para conocer la información completa del pase o festividad.
        </p>

        {/* Leyenda */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-acento-dorado text-[9px] font-bold text-fondo-oscuro">
              15
            </span>
            Día con evento
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded border border-borde-sutil text-[9px] text-stone-700">
              7
            </span>
            Sin eventos
          </span>
        </div>
      </header>

      <CalendarioGrid pases={pases} />
    </div>
  );
}
