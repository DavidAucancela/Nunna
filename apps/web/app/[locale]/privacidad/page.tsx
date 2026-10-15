import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo";

interface PrivacidadPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacidadPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Política de privacidad | Nunna",
    description: "Qué datos guarda Nunna cuando creas una cuenta para coleccionar personajes, y cómo borrarlos.",
    alternates: localeAlternates("/privacidad", locale),
  };
}

const ACTUALIZADA = "15 de octubre de 2026";
const CONTACTO = "soporte@nunna-ecu.com";

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">Nunna</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          Política de privacidad
        </h1>
        <p className="mt-4 text-sm text-stone-500">Última actualización: {ACTUALIZADA}</p>
      </header>

      <div className="space-y-8 text-lg leading-relaxed text-stone-400">
        <p>
          Puedes recorrer todo el sitio sin cuenta. Solo pedimos datos si decides{" "}
          <strong className="text-texto-claro">guardar un personaje en tu colección</strong>.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-texto-claro">Qué datos guardamos</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Tu <strong className="text-stone-300">correo electrónico</strong>, para iniciar sesión
              con un enlace mágico o con Google.
            </li>
            <li>
              Si entras con Google, tu <strong className="text-stone-300">nombre y foto de perfil</strong>{" "}
              básicos, que Google comparte al iniciar sesión. No accedemos a tus contactos, correos ni
              archivos.
            </li>
            <li>
              Los <strong className="text-stone-300">personajes que guardaste</strong> y la fecha en que
              lo hiciste.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-texto-claro">Para qué los usamos</h2>
          <p>
            Solo para mostrarte tu colección en cualquier dispositivo. No vendemos ni compartimos tus
            datos, no enviamos publicidad y no usamos herramientas de seguimiento ni de analítica de
            terceros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-texto-claro">Dónde se guardan</h2>
          <p>
            La cuenta y la colección se almacenan en Supabase. Los correos de inicio de sesión se
            envían a través de Resend. Tu navegador también guarda algunas preferencias en su
            almacenamiento local (por ejemplo, qué partes de una ficha ya viste); puedes borrarlas
            limpiando los datos del sitio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-texto-claro">Borrar tu cuenta</h2>
          <p>
            Escríbenos a{" "}
            <a href={`mailto:${CONTACTO}`} className="text-acento-dorado hover:underline">
              {CONTACTO}
            </a>{" "}
            desde el correo de tu cuenta y la borraremos junto con tu colección.
          </p>
        </section>
      </div>
    </div>
  );
}
