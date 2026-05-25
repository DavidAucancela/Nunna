import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { getPersonajes } from "@/lib/directus";

export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return {
    title: t("titulo"),
    description: t("subtitulo"),
  };
}

const FEATURED_ORDER = ["aya-uma", "diablos-de-lata", "payaso", "perro"];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const todosLosPersonajes = await getPersonajes({ locale });

  const personajesDestacados = [
    ...FEATURED_ORDER.map((slug) => todosLosPersonajes.find((p) => p.slug === slug)).filter(
      Boolean
    ),
    ...todosLosPersonajes.filter((p) => !FEATURED_ORDER.includes(p.slug)),
  ].slice(0, 4) as (typeof todosLosPersonajes)[0][];

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-900/90 to-fondo-oscuro" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-4 font-serif text-sm uppercase tracking-[0.3em] text-acento-dorado">
            Riobamba · Chimborazo · Ecuador
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight text-texto-claro md:text-7xl lg:text-8xl">
            {t("hero.titulo")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-300 md:text-xl">
            {t("hero.subtitulo")}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/personajes"
              className="rounded-full bg-acento-rojo px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              {t("hero.cta_principal")}
            </Link>
            <Link
              href="/calendario"
              className="rounded-full border border-stone-600 px-8 py-3 text-sm font-semibold text-stone-300 transition-colors hover:border-stone-400 hover:text-white"
            >
              {t("hero.cta_secundario")}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-stone-500">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* Introducción */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="font-serif text-3xl font-bold text-texto-claro md:text-4xl">
          {t("intro.titulo")}
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">{t("intro.texto")}</p>
      </section>

      {/* Personajes destacados */}
      <section className="border-t border-borde-sutil px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm uppercase tracking-[0.2em] text-acento-dorado">
            Personajes del pase
          </p>
          <h2 className="mt-2 text-center font-serif text-3xl font-bold text-texto-claro md:text-4xl">
            Los Seres
          </h2>

          {personajesDestacados.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {personajesDestacados.map((personaje) => (
                <PersonajeCard key={personaje.id} personaje={personaje} />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_ORDER.map((slug) => (
                <div
                  key={slug}
                  className="rounded-2xl border border-borde-sutil bg-stone-900/50 p-6"
                >
                  <div className="mb-4 aspect-[3/4] rounded-xl bg-stone-800" />
                  <div className="h-4 w-24 rounded bg-stone-800" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/personajes"
              className="text-sm font-medium text-acento-dorado underline-offset-4 hover:underline"
            >
              Ver todos los personajes →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
