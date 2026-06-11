import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("nav");

  return (
    <footer className="border-t border-borde-sutil bg-fondo-oscuro px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-serif text-lg font-bold text-texto-claro">Nunna</p>
            <p className="mt-2 text-sm text-stone-500">
              Catálogo cultural sobre los personajes de los pases de Riobamba y la provincia de
              Chimborazo, Ecuador.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-stone-500">Explorar</p>
            <ul className="space-y-2">
              {(["personajes", "mapa", "calendario", "glosario"] as const).map((key) => (
                <li key={key}>
                  <Link
                    href={`/${key}`}
                    className="text-sm text-stone-400 transition-colors hover:text-texto-claro"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-stone-500">Proyecto</p>
            <ul className="space-y-2">
              <li>
                <Link href="/sobre" className="text-sm text-stone-400 hover:text-texto-claro">
                  {t("sobre")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-borde-sutil pt-6 text-xs text-stone-600">
          <p>
            Contenido bajo{" "}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-400"
            >
              CC BY-NC-SA 4.0
            </a>
            {" · "}
            Código bajo{" "}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-400"
            >
              MIT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
