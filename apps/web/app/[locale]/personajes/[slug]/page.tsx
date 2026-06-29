import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes, getPases } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { HeroGated } from "@/modules/personajes/components/HeroGated";
import { AnatomiaGated } from "@/modules/personajes/components/AnatomiaGated";
import { GaleriaSection } from "@/modules/personajes/components/GaleriaSection";
import { NarrativaSection } from "@/modules/personajes/components/NarrativaSection";
import { CuandoVerloSection } from "@/modules/personajes/components/CuandoVerloSection";
import { PersonajesCarrusel } from "@/modules/personajes/components/PersonajesCarrusel";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";
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

  const [personaje, todosPersonajes, pases, t] = await Promise.all([
    getPersonaje(slug, locale),
    getPersonajes({}),
    getPases({}),
    getTranslations({ locale, namespace: "historia" }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  const imagenBanner = personaje.imagenBanner
    ? { url: personaje.imagenBanner, altText: `${personaje.nombre} — Nunna` }
    : undefined;
  const style = getOrigenStyle(personaje.origen);

  const pasesDelPersonaje = pases.filter((p) => p.personaje === personaje.nombre);
  const festividad =
    pasesDelPersonaje.length > 0
      ? `${pasesDelPersonaje.length} ${pasesDelPersonaje.length === 1 ? "pase" : "pases"} del Niño Riobambeño`
      : "Pases del Niño Riobambeño";

  const otrosPersonajes = todosPersonajes.filter((p) => p.slug !== slug);

  return (
    <article>
      <ScrollToTop />

      {/* ── 1. Hero (gated: experiencia inmersiva = premio del desbloqueo) ── */}
      <HeroGated
        slug={personaje.slug}
        experiencia={personaje.experiencia}
        nombre={personaje.nombre}
        nombreKichwa={personaje.nombreKichwa}
        nombresAlt={personaje.nombresAlt}
        origen={personaje.origen}
        imagen={imagenPortada}
        imagenBanner={imagenBanner}
        origenLabel={style.label}
        accentColor={style.accentColor}
        audioAmbiente={personaje.audioAmbiente}
      />

      {/* ── 2. Resumen editorial + compartir ── */}
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
          <div className="mt-8">
            <WhatsAppShare nombre={personaje.nombre} />
          </div>
        </section>
      </FadeUp>

      {/* ── 3. Ficha de datos ── */}
      <FadeUp>
        <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-borde-sutil bg-borde-sutil sm:grid-cols-3">

            {/* Origen */}
            <div className="bg-stone-900/40 px-6 py-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">Origen</p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  color: style.accentColor,
                  borderColor: `${style.accentColor}40`,
                  backgroundColor: `${style.accentColor}10`,
                }}
              >
                <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: style.accentColor }} />
                {style.label}
              </span>
            </div>

            {/* Festividad — desde pases.json */}
            <div className="bg-stone-900/40 px-6 py-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">Festividad</p>
              <p className="text-sm leading-snug text-stone-300">{festividad}</p>
            </div>

            {/* Nombres alt */}
            <div className="bg-stone-900/40 px-6 py-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">
                {personaje.nombresAlt.length > 1 ? "También conocido como" : "Nombre alternativo"}
              </p>
              {personaje.nombresAlt.length > 0 ? (
                <p className="text-sm italic leading-snug text-stone-400">
                  {personaje.nombresAlt.join(", ")}
                </p>
              ) : (
                <p className="text-sm text-stone-700">—</p>
              )}
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ── 4. Cuándo y dónde verlo ── */}
      <CuandoVerloSection
        pases={pasesDelPersonaje}
        accentColor={style.accentColor}
        eyebrow={t("cuando_eyebrow")}
        titulo={t("cuando_titulo")}
      />

      {/* ── 5. Historia (scrollytelling con sticky desktop + secreto interactivo) ── */}
      {personaje.narrativa && (
        <NarrativaSection
          leyenda={personaje.narrativa.leyenda}
          secreto={personaje.narrativa.secreto}
          capitulos={personaje.narrativa.capitulos}
          accentColor={style.accentColor}
          {...(personaje.artesanoFirma ? { artesanoFirma: personaje.artesanoFirma } : {})}
        />
      )}

      {/* ── 5b. Anatomía (experiencia v2 — solo con hotspots, gated por desbloqueo) ── */}
      {personaje.experiencia && personaje.hotspots?.length && imagenPortada ? (
        <AnatomiaGated
          slug={personaje.slug}
          imagen={imagenPortada}
          hotspots={personaje.hotspots}
          accentColor={style.accentColor}
          nombre={personaje.nombre}
        />
      ) : null}

      {/* ── 6. Galería (3 grupos + lightbox) ── */}
      <GaleriaSection
        multimedia={personaje.multimedia}
        accentColor={style.accentColor}
        nombre={personaje.nombre}
      />

      {/* ── 7. Cross-sell ── */}
      {otrosPersonajes.length > 0 && (
        <section className="border-t border-borde-sutil py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="mb-10 text-center">
              <p
                className="mb-3 text-[10px] uppercase tracking-[0.3em]"
                style={{ color: `${style.accentColor}80` }}
              >
                {t("coleccion_eyebrow")}
              </p>
              <h2 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">
                {t("coleccion_titulo")}
              </h2>
            </div>
            <PersonajesCarrusel personajes={otrosPersonajes} />
          </div>
        </section>
      )}
    </article>
  );
}
