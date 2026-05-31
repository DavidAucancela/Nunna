import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPases } from "@/lib/data";

interface PasesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PasesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pases" });

  return { title: t("titulo"), description: t("descripcion") };
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function PasesPage({ params }: PasesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pases" });
  const pases = await getPases({ locale });

  const pasesPorMes = MESES.reduce<Record<number, typeof pases>>((acc, _, i) => {
    const mes = i + 1;
    const pasesDelMes = pases.filter((p) => p.mes === mes);
    if (pasesDelMes.length > 0) acc[mes] = pasesDelMes;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-16">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">Festividades</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          {t("titulo")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">{t("descripcion")}</p>
      </header>

      {Object.entries(pasesPorMes).map(([mes, pasesDelMes]) => (
        <section key={mes} className="mb-16">
          <h2 className="mb-6 font-serif text-2xl font-bold text-acento-dorado">
            {MESES[Number(mes) - 1]}
          </h2>
          <div className="space-y-4">
            {pasesDelMes.map((pase) => (
              <a
                key={pase.id}
                href={`/${locale}/pases/${pase.slug}`}
                className="group flex items-center gap-6 rounded-2xl border border-borde-sutil bg-stone-900/30 p-6 transition-colors hover:border-stone-600 hover:bg-stone-900/60"
              >
                <div className="min-w-16 text-center">
                  {pase.dia ? (
                    <span className="text-3xl font-bold text-texto-claro">
                      {String(pase.dia).padStart(2, "0")}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-500">{t("fecha_movil")}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-texto-claro group-hover:text-acento-dorado">
                    {pase.nombre}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">{pase.fechaDescripcion}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
