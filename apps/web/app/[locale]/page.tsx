import { getPersonajes } from "@/lib/data";
import { HeroSection }         from "@/modules/home/components/HeroSection";
import { MarqueeStrip }        from "@/modules/home/components/MarqueeStrip";
import { PersonajesShowcase }  from "@/modules/home/components/PersonajesShowcase";
import { ProductoSection }     from "@/modules/home/components/ProductoSection";
import { OrigenesSection }     from "@/modules/home/components/OrigenesSection";
import { StatsSection }        from "@/modules/home/components/StatsSection";
import { CtaFinal }            from "@/modules/home/components/CtaFinal";
import { FadeUp }              from "@/components/ui/FadeUp";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const FEATURED_SLUGS = ["aya-uma", "diablos-de-lata", "perro", "payaso"];

const LEYENDAS: Record<string, string> = {
  "aya-uma":         "Donde el espíritu camina, la tierra responde.",
  "diablos-de-lata": "Tomaron el símbolo del miedo y lo convirtieron en el corazón de la fiesta.",
  "perro":           "El Allku guarda el umbral que ningún humano puede cruzar solo.",
  "payaso":          "La máscara sonríe fija. La verdad no necesita permiso para salir.",
};

const FALLBACKS: PersonajeListItem[] = [
  { id: "aya-uma",         slug: "aya-uma",         nombre: "Aya Uma",         origen: "prehispanico", resumen: "", totalPases: 0, imagenPortada: "/personajes/aya-uma/portada.png" },
  { id: "diablos-de-lata", slug: "diablos-de-lata", nombre: "Diablos de lata", origen: "mestizo",      resumen: "", totalPases: 0, imagenPortada: "/personajes/diablos-de-lata/portada.png" },
  { id: "perro",           slug: "perro",           nombre: "Perro",           origen: "prehispanico", resumen: "", totalPases: 0, imagenPortada: "/personajes/perro/portada.png" },
  { id: "payaso",          slug: "payaso",          nombre: "Payaso",          origen: "mixto",        resumen: "", totalPases: 0, imagenPortada: "/personajes/payaso/portada.png" },
];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const allPersonajes = await getPersonajes({ locale });
  const slugMap = new Map(allPersonajes.map((p) => [p.slug, p]));

  const featured = FEATURED_SLUGS.map((slug, i) => {
    const base = slugMap.get(slug) ?? FALLBACKS[i]!;
    const leyenda = LEYENDAS[slug];
    return leyenda ? { ...base, leyenda } : { ...base };
  });

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

      {/* 5. Orígenes — las 4 culturas */}
      <section className="border-b border-borde-sutil px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <div className="mb-10 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">El cosmos andino</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
                Cuatro orígenes, una sola celebración
              </h2>
            </div>
          </FadeUp>
          <OrigenesSection />
        </div>
      </section>

      {/* 6. Stats — foto de pase + cita + contadores */}
      <StatsSection />

      {/* 7. CTA final */}
      <CtaFinal />
    </>
  );
}
