import type { Metadata } from "next";
import { HeroSection }         from "@/modules/home/components/HeroSection";
import { ProductoSection }     from "@/modules/home/components/ProductoSection";
import { CtaFinal }            from "@/modules/home/components/CtaFinal";
import { localeAlternates } from "@/lib/seo";
import { getPersonajes } from "@/lib/data";
import type { TarjetaPersonaje } from "@/modules/personajes/components/TarjetaNunna";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  // Título/descripción se heredan del layout; aquí solo canonical + hreflang.
  return { alternates: localeAlternates("/", locale) };
}

export default async function HomePage(_props: HomePageProps) {
  const personajes = await getPersonajes({});
  const tarjetas: TarjetaPersonaje[] = personajes.flatMap((p) =>
    p.tarjeta ? [{ slug: p.slug, tarjeta: p.tarjeta }] : [],
  );

  return (
    <>
      {/* 1. Hero — mosaico de personajes */}
      <HeroSection />

      {/* 2. Producto — qué es Nunna y cómo funciona */}
      <ProductoSection tarjetas={tarjetas} />

      {/* 3. CTA — ¿Tienes un imán? Escanea tu QR */}
      <CtaFinal />
    </>
  );
}
