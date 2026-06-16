import { getPersonajes, getPersonaje, getRecorridos } from "@/lib/data";
import { HeroSection }         from "@/modules/home/components/HeroSection";
import { MarqueeStrip }        from "@/modules/home/components/MarqueeStrip";
import { PersonajesShowcase }  from "@/modules/home/components/PersonajesShowcase";
import { ProductoSection }     from "@/modules/home/components/ProductoSection";
import { PaseMapSection }      from "@/modules/home/components/PaseMapSection";
import { CtaFinal }            from "@/modules/home/components/CtaFinal";
import type { PersonajeListItem } from "@seres-del-pase/types";


interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const FEATURED_SLUGS = ["aya-uma", "diablos-de-lata", "perro", "payaso"];

const FALLBACKS: PersonajeListItem[] = [
  { id: "aya-uma",         slug: "aya-uma",         nombre: "Aya Uma",         origen: "prehispanico", resumen: "", totalPases: 0, imagenPortada: "/personajes/aya-uma.png" },
  { id: "diablos-de-lata", slug: "diablos-de-lata", nombre: "Diablos de lata", origen: "mestizo",      resumen: "", totalPases: 0, imagenPortada: "/personajes/diablos-de-lata.png" },
  { id: "perro",           slug: "perro",           nombre: "Perro",           origen: "prehispanico", resumen: "", totalPases: 0, imagenPortada: "/personajes/perro.png" },
  { id: "payaso",          slug: "payaso",          nombre: "Payaso",          origen: "mixto",        resumen: "", totalPases: 0, imagenPortada: "/personajes/payaso.png" },
];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const allPersonajes = await getPersonajes({ locale });
  const slugMap = new Map(allPersonajes.map((p) => [p.slug, p]));

  const featured = await Promise.all(
    FEATURED_SLUGS.map(async (slug, i) => {
      const base = slugMap.get(slug) ?? FALLBACKS[i]!;
      const leyenda = (await getPersonaje(slug))?.narrativa?.leyenda;
      return leyenda ? { ...base, leyenda } : { ...base };
    })
  );

  const recorridos = await getRecorridos();

  return (
    <>
      {/* 1. Hero — mosaico de personajes */}
      <HeroSection />

      {/* 2. Marquee — nombres en kichwa y español */}
      <MarqueeStrip />

      {/* 3. Personajes — grid asimétrico */}
      <section className="border-b border-borde-sutil px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <PersonajesShowcase personajes={featured} />
        </div>
      </section>

      {/* 4. Producto — cómo funciona */}
      <ProductoSection />

      {/* 5. Mapa del pase — animado por scroll */}
      <PaseMapSection recorridos={recorridos} />

      {/* 7. CTA final */}
      <CtaFinal />
    </>
  );
}
