import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPersonajes } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import { FormularioContacto, type PersonajeContacto } from "@/modules/contacto/components/FormularioContacto";

interface ContactoPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contacto" });
  return {
    title: t("meta_titulo"),
    description: t("meta_descripcion"),
    alternates: localeAlternates("/contacto", locale),
  };
}

// Sin carrito ni pago en línea (aún): se eligen personajes, se ve el precio y se pide por WhatsApp.
export default async function ContactoPage({ params }: ContactoPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contacto" });

  const personajes: PersonajeContacto[] = (await getPersonajes({ locale, withImage: true }))
    .sort((a, b) => (a.tarjeta?.orden ?? 99) - (b.tarjeta?.orden ?? 99))
    // Nombre e ícono impresos en la tarjeta: lo que la persona tiene en la mano.
    .map((p) => ({
      slug: p.slug,
      nombre: p.tarjeta?.nombre ?? p.nombre,
      // Ícono de línea del reverso de la tarjeta; la foto del imán solo si faltara.
      icono: p.tarjeta?.icono,
      imagen: p.imagenPortada,
    }));

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-6 sm:pt-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-acento-dorado">{t("eyebrow")}</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{t("titulo")}</h1>
        <p className="mt-4 text-base leading-relaxed text-stone-300 sm:text-lg">{t("intro")}</p>
      </header>

      <FormularioContacto personajes={personajes} />
    </div>
  );
}
