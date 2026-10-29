import type { Metadata } from "next";
import type { PresentacionBeat } from "@seres-del-pase/types";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { localeAlternates } from "@/lib/seo";
import { HeroDespertar } from "@/modules/personajes/components/HeroDespertar";
import { ParallaxHero } from "@/modules/personajes/components/ParallaxHero";
import { PersonajeVisualSection } from "@/modules/personajes/components/PersonajeVisualSection";
import { HistoriaPresentacion } from "@/modules/personajes/components/HistoriaPresentacion";
import { ArtesanoSection } from "@/modules/personajes/components/ArtesanoSection";
import { ColeccionCounter } from "@/modules/personajes/components/ColeccionCounter";
import { PersonajesLibro } from "@/modules/personajes/components/PersonajesLibro";
import { QuoteRevelacion } from "@/modules/personajes/components/QuoteRevelacion";
import { GuardarPersonaje, CentinelaGuardar } from "@/modules/coleccion/components/GuardarPersonaje";
import { RevealText } from "@/components/ui/RevealText";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

interface PersonajePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Corta el resumen en un gancho corto (primera frase) + el resto, para que la
 * primera pantalla de la ficha no sea un muro de texto. Corte simple en el
 * primer `.`/`!`/`?` seguido de espacio — suficiente para el resumen editorial
 * controlado de `personajes.json` (sin abreviaturas problemáticas).
 */
function primeraFrase(texto: string): { hook: string; resto: string | undefined } {
  const match = texto.match(/^([\s\S]*?[.!?])\s+([\s\S]*)$/);
  if (!match) return { hook: texto, resto: undefined };
  const [, hook, resto] = match;
  return { hook: (hook ?? texto).trim(), resto: resto?.trim() || undefined };
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

  return {
    title: personaje.nombre,
    description: personaje.resumen,
    alternates: localeAlternates({ pathname: "/personajes/[slug]", params: { slug } }, locale),
    openGraph: {
      title: `${personaje.nombre} | Nunna`,
      description: personaje.resumen,
      // La imagen sale de opengraph-image.tsx (frente de la tarjeta + nombre + leyenda).
    },
  };
}

export default async function PersonajePage({ params }: PersonajePageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const [personaje, todosPersonajes, t] = await Promise.all([
    getPersonaje(slug, locale),
    getPersonajes({}),
    getTranslations({ locale, namespace: "historia" }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  // Foto real de pase a pantalla completa; su altText sale de la misma foto en `multimedia`.
  const imagenBanner = personaje.imagenBanner
    ? {
        url: personaje.imagenBanner,
        altText:
          personaje.multimedia.find((m) => m.url === personaje.imagenBanner)?.altText ??
          `${personaje.nombre} — Nunna`,
        ...(personaje.imagenBannerPosicion ? { posicion: personaje.imagenBannerPosicion } : {}),
      }
    : undefined;
  const style = getOrigenStyle(personaje.origen);

  const otrosPersonajes = todosPersonajes.filter((p) => p.slug !== slug);

  const heroProps = {
    nombre: personaje.nombre,
    nombreKichwa: personaje.nombreKichwa,
    nombresAlt: personaje.nombresAlt,
    origen: personaje.origen,
    imagen: imagenPortada,
    imagenBanner,
    origenLabel: style.label,
    accentColor: style.accentColor,
  };

  // Lookup mínimo para la animación de guardado (grid de la colección).
  const coleccionLookup = todosPersonajes.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    imagenPortada: p.imagenPortada ?? null,
  }));

  // Gancho corto de la primera pantalla: si el JSON trae `resumenCorto` se usa
  // tal cual (y todo el `resumen` queda como "resto" plegado); si no, se deriva
  // la primera frase del resumen y el resto queda plegado bajo "Leer más".
  // Fallback al nombre si el resumen llegara vacío (dato mal cargado) — evita
  // pintar una cita vacía en la primera pantalla.
  const { hook: hookDerivado, resto } = personaje.resumenCorto
    ? { hook: personaje.resumenCorto, resto: personaje.resumen }
    : primeraFrase(personaje.resumen);
  const hook = hookDerivado || personaje.nombre;

  // Beats del modo presentación: si el JSON trae `presentacion` (visuales del
  // autor + frases breves) se usa tal cual; si no, se derivan de los capítulos
  // de la narrativa para que la ficha funcione ya, antes de tener los assets.
  // El fallback reutiliza las imágenes existentes del personaje como visual de
  // cada beat (rota entre ellas); sin imágenes cae al placeholder por origen.
  // Solo fotos reales de pase (por `orden`, sin afiches con texto): la historia se cuenta
  // con la fiesta, no con el imán — el imán ya está en el hero y en la anatomía. Si un
  // personaje aún no tiene fotos de pase, cae a sus demás imágenes.
  const imagenesPase = personaje.multimedia
    .filter((m) => m.tipo === "imagen" && m.titulo === "en-pase" && !/afiche/i.test(m.id))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const imagenesBeat = imagenesPase.length
    ? imagenesPase
    : personaje.multimedia.filter((m) => m.tipo === "imagen");
  const presentacionBeats: PresentacionBeat[] = personaje.presentacion?.length
    ? personaje.presentacion
    : (personaje.narrativa?.capitulos ?? []).map((c, i) => {
        const img = imagenesBeat[i % Math.max(imagenesBeat.length, 1)];
        return {
          id: `cap-${i}`,
          altText: img?.altText ?? `${personaje.nombre} — ${c.titulo}`,
          titulo: c.titulo,
          texto: c.texto,
          ...(img ? { visual: img.url } : {}),
        };
      });

  return (
    <article>
      <ScrollToTop />

      {/* ── 1. Hero — Despertar inmersivo si el personaje tiene experiencia v2 ── */}
      {personaje.experiencia ? (
        <HeroDespertar {...heroProps} />
      ) : (
        <ParallaxHero {...heroProps} />
      )}

      {/* ── 2. La Voz del Espíritu — gancho pintado por scroll + resto plegado ── */}
      <QuoteRevelacion
        hook={hook}
        resto={resto}
        accentColor={style.accentColor}
        origen={personaje.origen}
      >
        <WhatsAppShare nombre={personaje.nombre} />
        <ColeccionCounter slug={personaje.slug} nombre={personaje.nombre} />
        <GuardarPersonaje
          slug={personaje.slug}
          nombre={personaje.nombre}
          origen={personaje.origen ?? null}
          imagenPortada={imagenPortada?.url ?? null}
          accentColor={style.accentColor}
          personajes={coleccionLookup}
        />
      </QuoteRevelacion>

      {/* ── 4. Modo presentación (visuales + frases breves; leyenda + secreto) ── */}
      {personaje.narrativa && presentacionBeats.length > 0 && (
        <HistoriaPresentacion
          beats={presentacionBeats}
          secreto={personaje.narrativa.secreto}
          accentColor={style.accentColor}
          nombre={personaje.nombre}
          origen={personaje.origen}
          artesanoFirma={personaje.artesanoFirma}
          palabrasClave={personaje.narrativa.palabrasClave}
        />
      )}

      {/* ── 4b. Artesano (si el campo existe en el JSON) ── */}
      {personaje.artesano && (
        <ArtesanoSection
          artesano={personaje.artesano}
          nombre={personaje.nombre}
          {...(personaje.origen ? { origen: personaje.origen } : {})}
          accentColor={style.accentColor}
        />
      )}

      {/* ── 5. El personaje — Anatomía + Galería fusionadas ── */}
      <PersonajeVisualSection
        slug={personaje.slug}
        nombre={personaje.nombre}
        accentColor={style.accentColor}
        multimedia={personaje.multimedia}
        imagen={imagenPortada}
        hotspots={personaje.hotspots}
        experiencia={personaje.experiencia}
        eyebrow={t("visual_eyebrow")}
        titulo={t("visual_titulo")}
      />

      {/* Al llegar aquí (fin de la ficha) se invita a guardar al personaje si llegó por QR. */}
      <CentinelaGuardar slug={personaje.slug} />

      {/* ── 6. Cross-sell ── */}
      {otrosPersonajes.length > 0 && (
        <section className="border-t border-borde-sutil py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="mb-12 text-center">
              <p
                className="mb-3 text-[11px] uppercase tracking-[0.3em]"
                style={{ color: `${style.accentColor}80` }}
              >
                {t("coleccion_eyebrow")}
              </p>
              <RevealText
                as="h2"
                by="word"
                text={t("coleccion_titulo")}
                className="font-display block text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.98] text-texto-claro"
              />
            </div>
            <PersonajesLibro personajes={otrosPersonajes} />
          </div>
        </section>
      )}
    </article>
  );
}
