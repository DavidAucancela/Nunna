import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { FadeUp, FadeUpGroup, FadeUpItem } from "@/components/ui/FadeUp";
import { getPersonajes } from "@/lib/data";
import type { PersonajeListItem } from "@seres-del-pase/types";

const FEATURED_SLUGS = ["aya-uma", "perro", "diablos-de-lata", "payaso"];

const FALLBACKS: PersonajeListItem[] = [
  { id: "aya-uma",        slug: "aya-uma",        nombre: "Aya Uma",        origen: "prehispanico", resumen: "El señor de los vientos y la dualidad cósmica.", totalPases: 0 },
  { id: "perro",          slug: "perro",           nombre: "Perro",          origen: "prehispanico", resumen: "El guardián del umbral entre el mundo de los vivos y los muertos.", totalPases: 0 },
  { id: "diablos-de-lata", slug: "diablos-de-lata", nombre: "Diablos de Lata", origen: "colonial",    resumen: "Máscara de hojalata y espíritu irreverente del carnaval andino.", totalPases: 0 },
  { id: "payaso",         slug: "payaso",          nombre: "Payaso",         origen: "mixto",        resumen: "El bufón que mezcla humor y crítica social.", totalPases: 0 },
];

const COMO_FUNCIONA = [
  {
    num: "01",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    titulo: "Elige tu imán",
    texto: "Cada imán lleva un ser único de los pases riobambeños, moldeado en 3D.",
  },
  {
    num: "02",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.75h.75v.75h-.75v-.75zM16.75 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75H13.5V13.5zM13.5 19.5h.75v.75H13.5V19.5zM19.5 13.5h.75v.75h-.75V13.5zM19.5 19.5h.75v.75h-.75V19.5zM16.5 16.5h.75v.75h-.75v-.75z" />
      </svg>
    ),
    titulo: "Escanea el QR",
    texto: "Con la cámara de tu teléfono — sin app. En segundos estás en la ficha del ser.",
  },
  {
    num: "03",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    titulo: "Descubre al ser",
    texto: "Historia, simbolismo, traje y cosmovisión kichwa — en español, kichwa e inglés.",
  },
];

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const allPersonajes = await getPersonajes({ locale });
  const slugMap = new Map(allPersonajes.map((p) => [p.slug, p]));

  const featuredPersonajes: PersonajeListItem[] = FEATURED_SLUGS.map(
    (slug, i) => slugMap.get(slug) ?? FALLBACKS[i]!
  );

  return (
    <>
      <HeroSection />

      {/* ── Contadores culturales ── */}
      <section className="border-y border-borde-sutil bg-stone-950/50 py-14">
        <div className="mx-auto max-w-3xl grid grid-cols-3 gap-8 px-6 text-center">
          <AnimatedCounter value={8}   label={t("stats.seres")} />
          <AnimatedCounter value={500} label={t("stats.historia")} suffix="+" />
          <AnimatedCounter value={3}   label={t("stats.idiomas")} />
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="border-b border-borde-sutil px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <FadeUp>
            <p className="text-center text-xs uppercase tracking-[0.25em] text-acento-dorado">
              El producto
            </p>
            <h2 className="mt-2 text-center font-serif text-3xl font-bold text-texto-claro md:text-4xl">
              Cómo funciona
            </h2>
          </FadeUp>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {COMO_FUNCIONA.map((paso, i) => (
              <FadeUp key={paso.num} delay={i * 0.12}>
                <div className="relative rounded-2xl border border-borde-sutil bg-stone-900/40 p-6 transition-colors hover:border-stone-700 hover:bg-stone-900/70">
                  <span className="font-serif text-5xl font-bold leading-none text-stone-800 select-none">
                    {paso.num}
                  </span>
                  <div className="mt-4 text-acento-dorado">
                    {paso.icon}
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-texto-claro">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
                    {paso.texto}
                  </p>
                  {i < 2 && (
                    <span className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-stone-700 sm:block">
                      →
                    </span>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Introducción ── */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <FadeUp>
          <h2 className="font-serif text-3xl font-bold text-texto-claro md:text-4xl">
            {t("intro.titulo")}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-400">{t("intro.texto")}</p>
        </FadeUp>
      </section>

      {/* ── Personajes destacados ── */}
      <section className="border-t border-borde-sutil px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-center text-sm uppercase tracking-[0.2em] text-acento-dorado">
              Personajes del pase
            </p>
            <h2 className="mt-2 text-center font-serif text-3xl font-bold text-texto-claro md:text-4xl">
              Los Seres
            </h2>
          </FadeUp>

          <FadeUpGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPersonajes.map((p) => (
              <FadeUpItem key={p.slug}>
                <PersonajeCard personaje={p} />
              </FadeUpItem>
            ))}
          </FadeUpGroup>

          <FadeUp delay={0.3}>
            <div className="mt-12 text-center">
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

      {/* ── El ritual del pase ── */}
      <section className="border-t border-borde-sutil px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <FadeUp>
              <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">
                {t("ritual.subtitulo")}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
                {t("ritual.titulo")}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-stone-400">{t("ritual.texto")}</p>
              <div className="mt-8">
                <Link
                  href="/calendario"
                  className="inline-flex items-center gap-2 text-sm font-medium text-acento-dorado underline-offset-4 hover:underline"
                >
                  {t("ritual.cta")} →
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-borde-sutil">
                <OrigenPlaceholder
                  origen="prehispanico"
                  nombre="Pase"
                  variant="hero"
                  className="absolute inset-0"
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── CTA: escanea tu imán ── */}
      <section className="px-6 py-20">
        <FadeUp>
          <div className="mx-auto max-w-3xl rounded-3xl border border-acento-dorado/20 bg-gradient-to-b from-acento-dorado/8 to-acento-jade/5 px-8 py-14 text-center">
            <svg
              className="mx-auto mb-6 h-12 w-12 text-acento-dorado"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.75h.75v.75h-.75v-.75zM16.75 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75H13.5V13.5zM13.5 19.5h.75v.75H13.5V19.5zM19.5 13.5h.75v.75h-.75V13.5zM19.5 19.5h.75v.75h-.75V19.5zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            <h2 className="font-serif text-3xl font-bold text-texto-claro">{t("qr.titulo")}</h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-stone-400">{t("qr.texto")}</p>
            <div className="mt-8">
              <Link
                href="/personajes"
                className="rounded-full bg-acento-rojo px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-acento-rojo/25 transition-all hover:bg-red-700"
              >
                {t("qr.cta")}
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </>
  );
}
