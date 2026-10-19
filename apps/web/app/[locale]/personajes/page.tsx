import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getPersonajes } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";

interface PersonajesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PersonajesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personajes" });
  return {
    title: t("titulo"),
    description: t("descripcion"),
    alternates: localeAlternates("/personajes", locale),
  };
}

// Foto real de cada personaje en su pase (la de mayor resolución) y su encuadre.
const FOTO_PASE: Record<string, { src: string; pos?: string }> = {
  "aya-uma": { src: "/personajes/aya-uma/aya-uma-pase-tocado-de-cuernos-colores.webp", pos: "75% 30%" },
  "diablos-de-lata": { src: "/personajes/diablos-de-lata/diablos-de-lata-pase-mascara-roja-de-perfil.jpg", pos: "38% 40%" },
  cucurucho: { src: "/personajes/cucurucho/cucurucho-pase-tres-penitentes-con-cruz.webp", pos: "50% 35%" },
  perro: { src: "/personajes/perro/perro-pase-traje-de-general-blanco-y-dorado.webp", pos: "50% 20%" },
  "danzante-yaruquies": { src: "/personajes/danzante-yaruquies/danzante-yaruquies-pase-frente-a-catedral-riobamba.webp", pos: "50% 40%" },
  payaso: { src: "/personajes/payaso/payaso-pase-mascara-de-nariz-verde.jpg", pos: "50% 35%" },
};

// Título = nombre impreso en la tarjeta; subtítulo = nombre kichwa, salvo estos.
const SUBTITULO: Record<string, string> = {
  "aya-uma": "Aya Huma",
  cucurucho: "Chuku runa",
};

export default async function PersonajesPage({ params }: PersonajesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personajes" });

  const personajes = (await getPersonajes({ locale, withImage: true })).sort(
    (a, b) => (a.tarjeta?.orden ?? 99) - (b.tarjeta?.orden ?? 99),
  );

  // Una sola pantalla: encabezado + los 6 personajes + aviso de próximos.
  // Al seguir con el scroll se llega al footer.
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] min-h-[560px] max-w-7xl flex-col px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-8">
      <header className="mb-4 sm:mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-acento-dorado">Ecuador</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-texto-claro sm:text-4xl">{t("titulo")}</h1>
      </header>

      <ul className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2 sm:grid-cols-3 sm:grid-rows-2 sm:gap-4">
        {personajes.map((p, i) => {
          const foto = FOTO_PASE[p.slug];
          const src = foto?.src ?? p.imagenPortada;
          const titulo = p.tarjeta?.nombre ?? p.nombre;
          const subtitulo = SUBTITULO[p.slug] ?? p.nombreKichwa;
          return (
            <li key={p.slug} className="min-h-0">
              <Link
                href={{ pathname: "/personajes/[slug]", params: { slug: p.slug } }}
                className="group relative block h-full overflow-hidden rounded-lg bg-stone-900 ring-1 ring-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento-dorado"
              >
                {src && (
                  <Image
                    src={src}
                    alt={`${titulo} en el pase`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    priority={i < 3}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ objectPosition: foto?.pos ?? "50% 30%" }}
                  />
                )}
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                  <h2 className="font-serif text-lg font-bold leading-tight text-texto-claro [text-shadow:0_2px_12px_rgba(0,0,0,0.8)] sm:text-3xl">
                    {titulo}
                  </h2>
                  {subtitulo && subtitulo !== titulo && (
                    <p className="mt-0.5 font-serif text-xs italic text-acento-dorado sm:text-base">
                      {subtitulo}
                    </p>
                  )}
                  <span className="mt-2 hidden text-sm text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                    {t("ver_detalle")} →
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-stone-500 sm:mt-6 sm:text-sm">
        <span className="mr-2 text-acento-dorado" aria-hidden="true">✦</span>
        {t("proximamente")}
        <span className="ml-2 text-acento-dorado" aria-hidden="true">✦</span>
      </p>
    </div>
  );
}
