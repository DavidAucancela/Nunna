import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FadeUp } from "@/components/ui/FadeUp";
import { LoginCard } from "@/modules/auth/components/LoginCard";

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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-12 sm:px-6">
      <FadeUp className="flex w-full justify-center">
        <LoginCard />
      </FadeUp>
    </div>
  );
}
