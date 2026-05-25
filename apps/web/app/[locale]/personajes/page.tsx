import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { getPersonajes } from "@/lib/directus";

export const dynamic = "force-dynamic";

interface PersonajesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PersonajesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personajes" });

  return {
    title: t("titulo"),
    description: t("descripcion"),
  };
}

export default async function PersonajesPage({ params }: PersonajesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personajes" });

  const personajes = await getPersonajes({ locale });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Chimborazo · Ecuador
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          {t("titulo")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">{t("descripcion")}</p>
      </header>

      {personajes.length === 0 ? (
        <p className="py-24 text-center text-stone-500">{t("sin_resultados")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {personajes.map((personaje) => (
            <PersonajeCard key={personaje.id} personaje={personaje} />
          ))}
        </div>
      )}
    </div>
  );
}
