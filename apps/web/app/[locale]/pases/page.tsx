import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPases, getRecorridos, getProvinciasConPases } from "@/lib/data";
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

// Sin <header> visible a propósito: el mapa (con su propio eyebrow/título) es lo
// primero que se ve al entrar — fusiona lo que antes eran /pases y /calendario.
export default async function PasesPage({ params }: PasesPageProps) {
  const { locale } = await params;

  const [pases, recorridos] = await Promise.all([
    getPases({ locale }),
    getRecorridos(),
  ]);
  const provincias = await getProvinciasConPases(pases);

  return (
    <div className="pb-16 pt-10">
      <PasesExplorador provincias={provincias} pasesInfo={pases} recorridos={recorridos} />
    </div>
  );
}
