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

      {/* ── 4. Galería ── */}
      <GaleriaSection multimedia={personaje.multimedia} accentColor={style.accentColor} />

      {/* ── 5. CTA QR — teaser de la experiencia ── */}
      <FadeUp>
        <section
          className="mx-5 my-14 rounded-2xl px-8 py-12 text-center sm:mx-6 sm:my-20 sm:px-12"
          style={{ backgroundColor: `${style.accentColor}0D`, border: `1px solid ${style.accentColor}25` }}
        >
          <p
            className="mb-1 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: `${style.accentColor}99` }}
          >
            Experiencia exclusiva
          </p>
          <h2 className="mt-3 font-serif text-xl font-bold text-texto-claro sm:text-2xl">
            {t("cta_qr_titulo").replace("{nombre}", personaje.nombre)}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">
            Escanea el QR de tu llavero para vivir el ritual completo — leyenda, historia y el secreto del artesano.
          </p>
          <Link
            href={`/${locale}/personajes/${slug}/historia`}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: style.accentColor, color: "#0F0E0C" }}
          >
            {t("cta_qr_boton")}
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </FadeUp>

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
