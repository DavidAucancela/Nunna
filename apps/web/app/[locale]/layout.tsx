import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Fraunces } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MainContent } from "@/components/layout/MainContent";
import { LenisProvider } from "@/components/ui/LenisProvider";
import "@/styles/globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return {
    metadataBase: new URL("https://seres-del-pase.ec"),
    title: {
      template: "%s | Nunna",
      default: t("titulo"),
    },
    description: t("subtitulo"),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-icon.svg", type: "image/svg+xml" },
      ],
    },
    openGraph: {
      type: "website",
      locale,
      siteName: "Nunna",
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`dark ${fraunces.variable}`} suppressHydrationWarning>
      <body className="bg-fondo-oscuro text-texto-claro antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-acento-dorado focus:px-4 focus:py-2 focus:text-fondo-oscuro"
        >
          Saltar al contenido
        </a>
        <NextIntlClientProvider messages={messages}>
          <LenisProvider>
            <Header />
            <MainContent footer={<Footer />}>{children}</MainContent>
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
