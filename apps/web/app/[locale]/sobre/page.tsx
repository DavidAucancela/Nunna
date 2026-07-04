import type { Metadata } from "next";
import Link from "next/link";
import { localeAlternates } from "@/lib/seo";

interface SobrePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SobrePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Sobre el proyecto | Personajes del Pase",
    description:
      "Nunna es un catálogo digital de los personajes de las fiestas populares del Ecuador — tradición viva de todo el país.",
    alternates: localeAlternates("/sobre", locale),
  };
}

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">El proyecto</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          Sobre el proyecto
        </h1>
      </header>

      <div className="space-y-8 text-lg leading-relaxed text-stone-400">
        <p>
          <strong className="text-texto-claro">Nunna</strong> es un catálogo digital
          dedicado a los personajes de las fiestas populares del Ecuador — una tradición festiva
          viva a lo largo de todo el país.
        </p>

        <p>
          Cada imán lleva grabado el QR de un personaje. Al escanearlo, el comprador accede
          a la ficha completa del ser: su historia, simbolismo, traje y su lugar en la cosmovisión
          kichwa andina.
        </p>

        <p>
          El proyecto nace de la convicción de que las tradiciones culturales no se preservan
          encerrándolas en museos, sino poniéndolas en las manos — y en los bolsillos — de la
          gente.
        </p>

        <div className="border-l-2 border-acento-dorado pl-6">
          <p className="text-stone-300">
            &ldquo;Aya Uma antes que Diablo Huma. Los nombres importan porque los nombres son memoria.&rdquo;
          </p>
        </div>

        <p>
          El contenido está publicado bajo{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-acento-dorado hover:underline"
          >
            CC BY-NC-SA 4.0
          </a>
          . El código bajo{" "}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-acento-dorado hover:underline"
          >
            MIT
          </a>
          .
        </p>
      </div>

      <div className="mt-16">
        <Link
          href="/personajes"
          className="rounded-full bg-acento-rojo px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Conoce a los personajes →
        </Link>
      </div>
    </div>
  );
}
