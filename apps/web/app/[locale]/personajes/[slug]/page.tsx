import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
import { getPersonaje, getPersonajes } from "@/lib/directus";
import { getOrigenStyle } from "@/lib/origen-styles";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { FadeUp, FadeUpGroup, FadeUpItem, StaggerLetters } from "@/components/ui/FadeUp";
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
      title: `${personaje.nombre} | Seres del Pase`,
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
    getPersonajes({ locale, limit: 8 }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  const otrosPersonajes = todosLosPersonajes.filter((p) => p.slug !== slug).slice(0, 4);
  const style = getOrigenStyle(personaje.origen);

  return (
    <article>
      <ScrollProgress color={style.accentColor} />

      {/* ── Hero a pantalla completa ── */}
      <section className="-mt-16 relative flex min-h-[100svh] items-end overflow-hidden">
        {imagenPortada ? (
          <Image
            src={imagenPortada.url}
            alt={imagenPortada.altText}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <OrigenPlaceholder
            origen={personaje.origen}
            nombre={personaje.nombre}
            variant="hero"
            className="absolute inset-0"
          />
        )}

        {/* Overlay gradiente más dramático */}
        <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-fondo-oscuro/30 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute left-5 top-20 z-20 sm:left-6">
          <Link
            href="/personajes"
            className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-acento-dorado"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 14 14">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12L5 7l4-5" />
            </svg>
            Todos los personajes
          </Link>
        </div>

        {/* Contenido del hero */}
        <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-14 sm:px-6 sm:pb-20">
          {/* Nombre kichwa */}
          {personaje.nombreKichwa && (
            <p
              className="font-serif text-base italic sm:text-lg"
              style={{ color: style.accentColor }}
            >
              {personaje.nombreKichwa}
            </p>
          )}

          {/* h1 con stagger de letras */}
          <h1 className="mt-1 font-serif font-bold leading-none text-texto-claro" style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}>
            <StaggerLetters text={personaje.nombre} delay={0.1} />
          </h1>

          {/* Badge origen */}
          {personaje.origen && (
            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur-sm"
              style={{
                borderColor: `${style.accentColor}40`,
                backgroundColor: `${style.accentColor}12`,
                color: style.accentColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: style.accentColor }}
              />
              {style.label}
            </span>
          )}
        </div>
      </section>

      {/* ── Contenido principal ── */}
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        {/* Resumen */}
        <FadeUp>
          <p className="text-lg font-light leading-relaxed text-texto-claro sm:text-xl">
            {personaje.resumen}
          </p>
        </FadeUp>

        {/* Simbolismo */}
        {personaje.simbolismo && (
          <FadeUp delay={0.1}>
            <div
              className="relative mt-12 rounded-2xl p-6 sm:p-8"
              style={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: `${style.accentColor}35`,
                backgroundColor: `${style.accentColor}08`,
              }}
            >
              <span
                className="absolute -top-3 left-6 bg-fondo-oscuro px-2 text-xs uppercase tracking-widest"
                style={{ color: style.accentColor }}
              >
                Simbolismo
              </span>
              <p className="font-serif text-lg leading-relaxed text-texto-claro sm:text-xl">
                {personaje.simbolismo}
              </p>
            </div>
          </FadeUp>
        )}

        {/* Divisor andino */}
        <FadeUp delay={0.15}>
          <div className="divider-andino mt-14 sm:mt-16">
            <span className="text-acento-dorado select-none" aria-hidden="true">✦</span>
          </div>
        </FadeUp>

        {/* Historia y significado */}
        <FadeUp delay={0.2}>
          <section className="mt-6">
            <h2 className="font-serif text-xl font-bold text-texto-claro sm:text-2xl">
              Historia y significado
            </h2>
            <div
              className="prose prose-invert prose-stone prose-dropcap mt-5 max-w-none prose-p:text-stone-400 prose-headings:font-serif prose-headings:text-texto-claro prose-a:text-acento-dorado sm:mt-6"
              dangerouslySetInnerHTML={{ __html: personaje.descripcion }}
            />
          </section>
        </FadeUp>

        {/* Testimonios */}
        {personaje.testimonios.length > 0 && (
          <FadeUp delay={0.2}>
            <section className="mt-14 sm:mt-16">
              <div className="divider-andino mb-6">
                <span className="text-acento-dorado select-none" aria-hidden="true">✦</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-texto-claro sm:text-2xl">
                Testimonios
              </h2>
              <div className="mt-6 space-y-6">
                {personaje.testimonios.map((t) => (
                  <div
                    key={t.id}
                    className="relative rounded-xl p-6 sm:p-7"
                    style={{
                      backgroundColor: "#1A1814",
                      borderLeft: `3px solid ${style.accentColor}`,
                    }}
                  >
                    {/* Comilla decorativa */}
                    <span
                      className="absolute right-5 top-4 font-serif text-6xl leading-none select-none pointer-events-none"
                      style={{ color: style.accentColor, opacity: 0.15 }}
                      aria-hidden="true"
                    >
                      "
                    </span>
                    <blockquote>
                      <p className="text-base italic leading-relaxed text-stone-300 sm:text-lg">
                        "{t.texto}"
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
                                className="text-stone-600 hover:text-stone-400 transition-colors"
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

        {/* Tags */}
        {personaje.tags.length > 0 && (
          <FadeUp delay={0.25}>
            <section className="mt-14 border-t border-borde-sutil pt-7 sm:mt-16 sm:pt-8">
              <div className="flex flex-wrap gap-2">
                {personaje.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-xs text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-300"
                  >
                    {tag.nombre}
                  </span>
                ))}
              </div>
            </section>
          </FadeUp>
        )}

        {/* Compartir */}
        <FadeUp delay={0.3}>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <WhatsAppShare nombre={personaje.nombre} />
            <span className="text-xs text-stone-600">Comparte este ser con alguien especial</span>
          </div>
        </FadeUp>
      </div>

      {/* ── Cross-sell ── */}
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
                Conoce a los otros seres
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
