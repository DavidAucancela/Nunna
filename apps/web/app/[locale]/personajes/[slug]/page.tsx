import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { ParallaxHero } from "@/components/personajes/ParallaxHero";
import { SimbolismoSection } from "@/components/personajes/SimbolismoSection";
import { NarrativaSection } from "@/components/personajes/NarrativaSection";
import { HotspotsViewer } from "@/components/personajes/HotspotsViewer";
import { GaleriaSection } from "@/components/personajes/GaleriaSection";
import { FadeUp, FadeUpGroup, FadeUpItem } from "@/components/ui/FadeUp";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";

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

  const [personaje, todosLosPersonajes] = await Promise.all([
    getPersonaje(slug, locale),
    getPersonajes({ locale, withImage: true }),
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
      <ScrollProgress color={style.accentColor} />

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

      {/* ── 2. Resumen — lead editorial grande ── */}
      <FadeUp>
        <section className="mx-auto max-w-3xl px-5 py-20 sm:px-6 sm:py-28">
          <p className="font-serif text-2xl font-light leading-relaxed text-texto-claro sm:text-3xl">
            {personaje.resumen}
          </p>
        </section>
      </FadeUp>

      {/* ── 3. Simbolismo — interlude cinematográfico ── */}
      {personaje.simbolismo && (
        <SimbolismoSection
          simbolismo={personaje.simbolismo}
          accentColor={style.accentColor}
        />
      )}

      {/* ── 4. Hotspots — anatomía interactiva del traje ── */}
      {imagenPortada && personaje.hotspots && personaje.hotspots.length > 0 && (
        <HotspotsViewer
          imagen={imagenPortada}
          hotspots={personaje.hotspots}
          accentColor={style.accentColor}
        />
      )}

      {/* ── 5. Narrativa — scrollytelling ── */}
      {personaje.narrativa && (
        <NarrativaSection
          leyenda={personaje.narrativa.leyenda}
          secreto={personaje.narrativa.secreto}
          capitulos={personaje.narrativa.capitulos}
          accentColor={style.accentColor}
        />
      )}

      {/* ── 6. Galería ── */}
      <GaleriaSection multimedia={personaje.multimedia} accentColor={style.accentColor} />

      {/* ── 7. Testimonios ── */}
      {personaje.testimonios.length > 0 && (
        <FadeUp>
          <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
            <h2 className="mb-6 font-serif text-xl font-bold text-texto-claro sm:text-2xl">
              Testimonios
            </h2>
            <div className="space-y-6">
              {personaje.testimonios.map((t) => (
                <div
                  key={t.id}
                  className="relative rounded-xl p-6 sm:p-7"
                  style={{
                    backgroundColor: "#1A1814",
                    borderLeft: `3px solid ${style.accentColor}`,
                  }}
                >
                  <span
                    className="absolute right-5 top-4 font-serif text-6xl leading-none select-none pointer-events-none"
                    style={{ color: style.accentColor, opacity: 0.12 }}
                    aria-hidden="true"
                  >
                    &#8220;
                  </span>
                  <blockquote>
                    <p className="text-base italic leading-relaxed text-stone-300 sm:text-lg">
                      &ldquo;{t.texto}&rdquo;
                    </p>
                    <footer className="mt-4 flex flex-wrap items-center gap-1 text-sm text-stone-500">
                      <span className="font-medium text-stone-400">{t.autor}</span>
                      {t.cargo && (
                        <>
                          <span className="text-stone-700">·</span>
                          <span>{t.cargo}</span>
                        </>
                      )}
                      {t.fuente && (
                        <>
                          <span className="text-stone-700">—</span>
                          {t.url ? (
                            <a
                              href={t.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-600 transition-colors hover:text-stone-400"
                            >
                              {t.fuente}
                            </a>
                          ) : (
                            <span className="text-stone-600">{t.fuente}</span>
                          )}
                        </>
                      )}
                    </footer>
                  </blockquote>
                </div>
              ))}
            </div>
          </section>
        </FadeUp>
      )}

      {/* ── 7. Tags + Compartir ── */}
      <FadeUp>
        <div className="mx-auto max-w-3xl px-5 pb-20 pt-4 sm:px-6">
          {personaje.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {personaje.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-xs text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-300"
                >
                  {tag.nombre}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <WhatsAppShare nombre={personaje.nombre} />
            <span className="text-xs text-stone-600">
              Comparte este personaje con alguien especial
            </span>
          </div>
        </div>
      </FadeUp>

      {/* ── 8. Cross-sell ── */}
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
