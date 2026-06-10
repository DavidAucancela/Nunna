import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { ParallaxHero } from "@/modules/personajes/components/ParallaxHero";
import { GaleriaSection } from "@/modules/personajes/components/GaleriaSection";
import { PersonajesCarrusel } from "@/modules/personajes/components/PersonajesCarrusel";
import { FadeUp } from "@/components/ui/FadeUp";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

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
    getPersonajes({ locale }),
    getTranslations({ locale, namespace: "historia" }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  const imagenBanner = personaje.imagenBanner
    ? { url: personaje.imagenBanner, altText: `${personaje.nombre} — Nunna` }
    : undefined;
  const otrosPersonajes = todosLosPersonajes.filter((p) => p.slug !== slug && !!p.imagenPortada);
  const style = getOrigenStyle(personaje.origen);

  return (
    <article>
      <ScrollToTop />
      {/* ── 1. Hero ── */}
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

      {/* ── 2. Resumen editorial ── */}
      <FadeUp>
        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="relative">
            <span
              className="absolute -top-4 -left-1 select-none font-serif text-8xl leading-none sm:-left-4"
              style={{ color: style.accentColor, opacity: 0.15 }}
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <p className="relative font-serif text-2xl font-light leading-relaxed text-texto-claro sm:text-3xl">
              {personaje.resumen}
            </p>
          </div>
        </section>
      </FadeUp>

      {/* ── 3. Ficha de datos ── */}
      <FadeUp>
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-borde-sutil bg-borde-sutil sm:grid-cols-3">

            {/* Origen */}
            <div className="bg-stone-900/40 px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-2">Origen</p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  color: style.accentColor,
                  borderColor: `${style.accentColor}40`,
                  backgroundColor: `${style.accentColor}10`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full flex-none" style={{ backgroundColor: style.accentColor }} />
                {style.label}
              </span>
            </div>

            {/* Festividad */}
            <div className="bg-stone-900/40 px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-2">Festividad</p>
              <p className="text-sm text-stone-300 leading-snug">Pase del Niño Riobambeño</p>
            </div>

            {/* Nombres alt */}
            <div className="bg-stone-900/40 px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-2">
                {personaje.nombresAlt.length > 1 ? "También conocido como" : "Nombre alternativo"}
              </p>
              {personaje.nombresAlt.length > 0 ? (
                <p className="text-sm italic text-stone-400 leading-snug">
                  {personaje.nombresAlt.join(", ")}
                </p>
              ) : (
                <p className="text-sm text-stone-700">—</p>
              )}
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ── 4. Historia ── */}
      {personaje.narrativa && (
        <FadeUp>
          <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6 sm:pb-28">

            {/* Título sección */}
            <div className="mb-14 flex items-center gap-4">
              <h2 className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
                {t("titulo_seccion")}
              </h2>
              <div className="h-px flex-1 bg-borde-sutil" />
            </div>

            {/* Leyenda — cita centrada */}
            <div className="mb-16 text-center">
              <span
                className="-mb-5 block select-none font-serif text-7xl leading-none sm:text-8xl"
                style={{ color: style.accentColor, opacity: 0.2 }}
                aria-hidden="true"
              >
                &ldquo;
              </span>
              <p
                className="font-serif text-xl italic leading-relaxed sm:text-2xl"
                style={{ color: style.accentColor }}
              >
                {personaje.narrativa.leyenda}
              </p>
            </div>

            {/* Capítulos con números */}
            <div className="space-y-12">
              {personaje.narrativa.capitulos.map((cap, i) => (
                <div key={i} className="flex gap-5 sm:gap-8">
                  <span
                    className="select-none font-serif text-4xl font-bold leading-none text-stone-800 sm:text-5xl flex-none w-10 sm:w-14 text-right pt-1"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3
                      className="font-serif text-lg font-semibold mb-3 leading-snug"
                      style={{ color: style.accentColor }}
                    >
                      {cap.titulo}
                    </h3>
                    <p className="text-stone-400 leading-relaxed text-base">
                      {cap.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Secreto — caja dramática */}
            <div className="mt-16 overflow-hidden rounded-2xl">
              {/* Header del secreto */}
              <div
                className="flex items-center gap-3 px-6 py-3.5"
                style={{ backgroundColor: `${style.accentColor}22` }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  style={{ color: style.accentColor }}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] font-medium"
                  style={{ color: style.accentColor }}
                >
                  {t("secreto_label")}
                </p>
              </div>
              {/* Cuerpo del secreto */}
              <div
                className="px-6 py-6"
                style={{
                  backgroundColor: `${style.accentColor}08`,
                  borderLeft: `1px solid ${style.accentColor}20`,
                  borderRight: `1px solid ${style.accentColor}20`,
                  borderBottom: `1px solid ${style.accentColor}20`,
                }}
              >
                <p className="text-stone-200 leading-relaxed text-base">
                  {personaje.narrativa.secreto}
                </p>
              </div>
            </div>
          </section>
        </FadeUp>
      )}

      {/* ── 5. Galería ── */}
      <GaleriaSection
        multimedia={personaje.multimedia}
        accentColor={style.accentColor}
        nombre={personaje.nombre}
      />

      {/* ── 6. Grid de personajes ── */}
      {otrosPersonajes.length > 0 && (
        <FadeUp>
          <section className="border-t border-borde-sutil px-5 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-4xl">
              <div className="mb-10 text-center">
                <p
                  className="text-xs uppercase tracking-[0.2em] mb-2"
                  style={{ color: style.accentColor }}
                >
                  Más personajes del pase
                </p>
                <h2 className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
                  Conoce a los otros personajes
                </h2>
              </div>

              <PersonajesCarrusel personajes={otrosPersonajes} />
            </div>
          </section>
        </FadeUp>
      )}
    </article>
  );
}
