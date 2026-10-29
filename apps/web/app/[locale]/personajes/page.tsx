import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPersonajes } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import {
  PersonajesColeccion,
  type PersonajeColeccion,
} from "@/modules/personajes/components/PersonajesColeccion";

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

// Una sola ventana: la colección (círculos del reverso de la tarjeta) y, con el botón de abajo,
// el modo compra sobre los mismos círculos (candados, elegir, pedido y entrega por WhatsApp).
export default async function PersonajesPage({ params }: PersonajesPageProps) {
  const { locale } = await params;
  const tc = await getTranslations({ locale, namespace: "comun" });

  const personajes: PersonajeColeccion[] = (await getPersonajes({ locale, withImage: true }))
    .sort((a, b) => (a.tarjeta?.orden ?? 99) - (b.tarjeta?.orden ?? 99))
    // Nombre e ícono impresos en la tarjeta: lo que la persona tiene en la mano.
    .map((p) => ({
      slug: p.slug,
      nombre: p.tarjeta?.nombre ?? p.nombre,
      origen: p.origen ? tc(`origen.${p.origen}`) : undefined,
      icono: p.tarjeta?.icono,
      imagen: p.imagenPortada,
    }));

  return <PersonajesColeccion personajes={personajes} />;
}
