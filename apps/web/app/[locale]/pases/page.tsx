import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getPases,
  getPersonaje,
  getRecorridos,
  getProvinciasConPases,
  limitarPasesPorProvincia,
} from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import { PasesExplorador } from "@/modules/pases/components/PasesExplorador";

interface PasesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PasesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pases" });

  return {
    title: t("titulo"),
    description: t("descripcion"),
    alternates: localeAlternates("/pases", locale),
  };
}

// Ventana fija sin scroll de página: mapa del país → provincia → recorrido de
// un pase, todo dentro de `PasesExplorador` (ver su comentario).
export default async function PasesPage({ params }: PasesPageProps) {
  const { locale } = await params;

  const [pases, recorridos] = await Promise.all([
    getPases({ locale }),
    getRecorridos(),
  ]);
  // Cada provincia muestra hasta 5 pases, primero los que ya tienen recorrido.
  const provincias = limitarPasesPorProvincia(
    await getProvinciasConPases(pases),
    new Map(recorridos.pases.map((r) => [r.paseSlug, r.esDemo])),
  );

  // Foto real de pase para la tarjeta de cada provincia (si la hay): la de una
  // parada de sus recorridos o, si no, una foto "en-pase" de su personaje. Las
  // `imagenPortada` de pases.json son afiches de ruta, no sirven de fondo.
  const fotosProvincia: Record<string, string> = {};
  for (const provincia of provincias) {
    const slugs = new Set(provincia.pases.map((p) => p.slug));
    const deRecorrido = recorridos.pases
      .filter((r) => slugs.has(r.paseSlug))
      .flatMap((r) => r.waypoints)
      .find((w) => w.imagen)?.imagen;
    let foto = deRecorrido;
    for (const pase of provincia.pases) {
      if (foto || !pase.personajeSlug) continue;
      const personaje = await getPersonaje(pase.personajeSlug, locale);
      foto = personaje?.multimedia.find((m) => m.tipo === "imagen" && m.titulo === "en-pase")?.url;
    }
    if (foto) fotosProvincia[provincia.slug] = foto;
  }

  return (
    <PasesExplorador
      provincias={provincias}
      pasesInfo={pases}
      recorridos={recorridos}
      fotosProvincia={fotosProvincia}
    />
  );
}
