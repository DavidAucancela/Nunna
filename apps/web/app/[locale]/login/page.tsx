import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FadeUp } from "@/components/ui/FadeUp";
import { LoginForm } from "@/modules/auth/components/LoginForm";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return {
    title: `${t("titulo")} — Nunna`,
    description: t("subtitulo"),
  };
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <div className="min-h-[calc(100vh-4rem)] px-5 py-16 sm:px-6 sm:py-24">
      <FadeUp>
        <div className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-acento-dorado">{t("eyebrow")}</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-texto-claro sm:text-4xl">{t("titulo")}</h1>
          <p className="mx-auto mt-3 max-w-sm text-stone-400">{t("subtitulo")}</p>
        </div>

        <LoginForm />
      </FadeUp>
    </div>
  );
}
