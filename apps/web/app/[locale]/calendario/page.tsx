import type { Metadata } from "next";
import { getPases } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import { CalendarioGrid } from "@/modules/festividades/components/CalendarioGrid";

interface CalendarioPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CalendarioPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Calendario festivo",
    description: "Fechas y festividades de las fiestas populares del Ecuador.",
    alternates: localeAlternates("/calendario", locale),
  };
}

export default async function CalendarioPage() {
  const pases = await getPases({});

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Ecuador
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          Calendario festivo
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">
          Las fiestas populares del Ecuador se concentran en pocos meses del año. Elige un mes para ver sus
          pases y festividades con horarios, rutas y personajes.
        </p>
      </header>

      <CalendarioGrid pases={pases} />
    </div>
  );
}
