import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { ParallaxHero } from "@/components/personajes/ParallaxHero";
import { GaleriaSection } from "@/components/personajes/GaleriaSection";
import { FadeUp, FadeUpGroup, FadeUpItem } from "@/components/ui/FadeUp";

interface PersonajePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const personajes = await getPersonajes({});
  return personajes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PersonajePageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const personaje = await getPersonaje(slug, locale);

  if (!personaje) return { title: "No encontrado" };

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");

  return {
    title: personaje.nombre,
    description: personaje.resumen,
    openGraph: {
      title: `${personaje.nombre} | Nunna`,
      description: personaje.resumen,
      images: imagenPortada ? [{ url: imagenPortada.url, alt: imagenPortada.altText }] : [],
    },
  };
}

export default async function PersonajePage({ params }: PersonajePageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const [personaje, todosLosPersonajes, t] = await Promise.all([
    getPersonaje(slug, locale),
    getPersonajes({ locale, withImage: true }),
    getTranslations({ locale, namespace: "historia" }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  const imagenBanner = personaje.imagenBanner
    ? { url: personaje.imagenBanner, altText: `${personaje.nombre} — Nunna` }
    : undefined;
  const otrosPersonajes = todosLosPersonajes.filter((p) => p.slug !== slug).slice(0, 4);
  const style = getOrigenStyle(personaje.origen);

  return (
    <article>
      {/* ── 1. Hero con parallax ── */}
      <ParallaxHero
        nombre={personaje.nombre}
        nombreKichwa={personaje.nombreKichwa}
        nombresAlt={personaje.nombresAlt}
        origen={personaje.origen}
        imagen={imagenPortada}
        imagenBanner={imagenBanner}
        origenLabel={style.label}
        accentColor={style.accentColor}
      />

      {/* ── 2. Resumen — lead editorial ── */}
      <FadeUp>
        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          <p className="font-serif text-2xl font-light leading-relaxed text-texto-claro sm:text-3xl">
            {personaje.resumen}
          </p>
        </section>
      </FadeUp>

      {/* ── 3. Ficha básica — chips de datos ── */}
      <FadeUp>
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wider"
              style={{ borderColor: `${style.accentColor}50`, color: style.accentColor, backgroundColor: `${style.accentColor}10` }}
            >
              {style.label}
            </span>
            <span className="rounded-full border border-stone-700 bg-stone-900/60 px-4 py-1.5 text-xs font-medium text-stone-400">
              Personaje del pase riobambeño
            </span>
            {personaje.nombresAlt[0] && (
              <span className="rounded-full border border-stone-700 bg-stone-900/60 px-4 py-1.5 text-xs font-medium italic text-stone-500">
                {personaje.nombresAlt[0]}
              </span>
            )}
          </div>
        </section>
      </FadeUp>

      {/* ── 4. Historia ── */}
      {personaje.narrativa && (
        <FadeUp>
          <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6 sm:pb-28">
            <h2 className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl mb-10">
              {t("titulo_seccion")}
            </h2>

            {/* Leyenda */}
            <blockquote
              className="border-l-2 pl-6 mb-14"
              style={{ borderColor: style.accentColor }}
            >
              <p
                className="font-serif text-xl italic leading-relaxed"
                style={{ color: style.accentColor }}
              >
                &ldquo;{personaje.narrativa.leyenda}&rdquo;
              </p>
            </blockquote>

            {/* Capítulos */}
            <div className="space-y-10">
              {personaje.narrativa.capitulos.map((cap, i) => (
                <div key={i}>
                  <h3
                    className="font-serif text-lg font-semibold mb-3"
                    style={{ color: style.accentColor }}
                  >
                    {cap.titulo}
                  </h3>
                  <p className="text-stone-400 leading-relaxed">
                    {cap.texto}
                  </p>
                </div>
              ))}
            </div>

            {/* Secreto */}
            <div
              className="mt-14 rounded-2xl px-8 py-8"
              style={{ backgroundColor: `${style.accentColor}0D`, border: `1px solid ${style.accentColor}25` }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.3em] mb-4"
                style={{ color: `${style.accentColor}99` }}
              >
                {t("secreto_label")}
              </p>
              <p className="text-stone-300 leading-relaxed">
                {personaje.narrativa.secreto}
              </p>
            </div>
          </section>
        </FadeUp>
      )}

      {/* ── 5. Galería ── */}
      <GaleriaSection multimedia={personaje.multimedia} accentColor={style.accentColor} />

      {/* ── 6. Cross-sell ── */}
      {otrosPersonajes.length > 0 && (
        <section className="border-t border-borde-sutil px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <FadeUp>
              <p
                className="text-center text-xs uppercase tracking-[0.2em]"
                style={{ color: style.accentColor }}
              >
                Más personajes del pase
              </p>
              <h2 className="mt-2 text-center font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
                Conoce a los otros personajes
              </h2>
            </FadeUp>
            <FadeUpGroup className="mt-8 grid gap-4 grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {otrosPersonajes.map((otro) => (
                <FadeUpItem key={otro.id}>
                  <PersonajeCard personaje={otro} />
                </FadeUpItem>
              ))}
            </FadeUpGroup>
            <FadeUp delay={0.3}>
              <div className="mt-10 text-center">
                <Link
                  href="/personajes"
                  className="text-sm font-medium text-acento-dorado underline-offset-4 hover:underline"
                >
                  Ver todos los personajes →
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      )}
    </article>
  );
}
