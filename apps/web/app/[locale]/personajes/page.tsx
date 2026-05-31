import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { PersonajeCardProximo } from "@/components/personajes/PersonajeCardProximo";
import { FadeUpGroup, FadeUpItem } from "@/components/ui/FadeUp";
import { getPersonajes } from "@/lib/data";
import type { Origen } from "@/lib/origen-styles";

interface PersonajesPageProps {
  params: Promise<{ locale: string }>;
}

// Próximamente — vacío porque todos los personajes ya están publicados en Directus
const PROXIMOS: { slug: string; nombre: string; nombreKichwa?: string; origen: Origen }[] = [];

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

  const slugsPublicados = new Set(personajes.map((p) => p.slug));
  const proximosFiltrados = PROXIMOS.filter((p) => !slugsPublicados.has(p.slug));

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-12 mt-4">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Chimborazo · Ecuador
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          {t("titulo")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">{t("descripcion")}</p>
      </header>

      <FadeUpGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Personajes publicados */}
        {personajes.map((personaje) => (
          <FadeUpItem key={personaje.id}>
            <PersonajeCard personaje={personaje} />
          </FadeUpItem>
        ))}

        {/* Próximamente */}
        {proximosFiltrados.map((p) => (
          <FadeUpItem key={p.slug}>
            <PersonajeCardProximo
              nombre={p.nombre}
              nombreKichwa={p.nombreKichwa}
              origen={p.origen}
            />
          </FadeUpItem>
        ))}
      </FadeUpGroup>

      {personajes.length === 0 && proximosFiltrados.length === 0 && (
        <p className="py-24 text-center text-stone-500">{t("sin_resultados")}</p>
      )}
    </div>
  );
}
