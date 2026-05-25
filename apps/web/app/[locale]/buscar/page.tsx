import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

interface BuscarPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Buscar" };
}

export default async function BuscarPage({ params }: BuscarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 text-5xl">🔍</div>
      <h1 className="font-serif text-4xl font-bold text-texto-claro">Búsqueda</h1>
      <p className="mt-4 max-w-md text-stone-400">
        La búsqueda semántica por personajes, elementos y glosario estará disponible próximamente.
      </p>
    </div>
  );
}
