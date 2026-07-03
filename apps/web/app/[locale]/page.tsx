import type { Metadata } from "next";
import { HeroSection }         from "@/modules/home/components/HeroSection";
import { MarqueeStrip }        from "@/modules/home/components/MarqueeStrip";
import { ProductoSection }     from "@/modules/home/components/ProductoSection";
import { CtaFinal }            from "@/modules/home/components/CtaFinal";
import { localeAlternates } from "@/lib/seo";


interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  // Título/descripción se heredan del layout; aquí solo canonical + hreflang.
  return { alternates: localeAlternates("/", locale) };
}

export default async function HomePage(_props: HomePageProps) {
  return (
    <>
      {/* 1. Hero — mosaico de personajes */}
      <HeroSection />

      {/* 2. Marquee — nombres en kichwa y español */}
      <MarqueeStrip />

      {/* 3. Producto — qué es Nunna y cómo funciona */}
      <ProductoSection />

      {/* 4. CTA — ¿Tienes un imán? Escanea tu QR */}
      <CtaFinal />
    </>
  );
}
