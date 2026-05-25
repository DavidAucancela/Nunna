import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

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

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Placeholder de imagen de fondo — reemplazar con foto real */}
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

        {/* Indicador de scroll */}
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

      {/* Grid de personajes destacados — datos reales se cargan en Fase 1 */}
      <section className="border-t border-borde-sutil px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm uppercase tracking-[0.2em] text-acento-dorado">
            Personajes del pase
          </p>
          <h2 className="mt-2 text-center font-serif text-3xl font-bold text-texto-claro md:text-4xl">
            Los Seres
          </h2>
          {/* Placeholder — se reemplaza con PersonajeCard real */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {["Aya Uma", "Curiquingue", "Sacha Runa", "Capariche"].map((nombre) => (
              <div
                key={nombre}
                className="group rounded-2xl border border-borde-sutil bg-stone-900/50 p-6"
              >
                <div className="mb-4 aspect-[3/4] rounded-xl bg-stone-800" />
                <h3 className="font-serif text-lg font-semibold text-texto-claro">{nombre}</h3>
                <p className="mt-1 text-sm text-stone-500">Contenido próximamente</p>
              </div>
            ))}
          </div>
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
