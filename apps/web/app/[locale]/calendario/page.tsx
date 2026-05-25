import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

interface CalendarioPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Calendario" };
}

export default async function CalendarioPage({ params }: CalendarioPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 text-5xl">📅</div>
      <h1 className="font-serif text-4xl font-bold text-texto-claro">Calendario festivo</h1>
      <p className="mt-4 max-w-md text-stone-400">
        El calendario de pases y festividades estará disponible próximamente.
      </p>
    </div>
  );
}
