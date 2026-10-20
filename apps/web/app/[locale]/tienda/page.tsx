import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getEntrega, getPersonajes, getProductos } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import { formatoPrecio } from "@/lib/tienda/carrito";
import { CirculoColeccion, ordenTarjeta, type TarjetaPersonaje } from "@/modules/personajes/components/TarjetaNunna";
import { BotonAgregar } from "@/modules/tienda/components/BotonAgregar";
import { CajaRegalo } from "@/modules/tienda/components/MiniaturaProducto";
import { ProductoCard } from "@/modules/tienda/components/ProductoCard";

interface TiendaPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TiendaPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tienda" });
  return {
    title: t("meta_titulo"),
    description: t("meta_descripcion"),
    alternates: localeAlternates("/tienda", locale),
  };
}

export default async function TiendaPage({ params }: TiendaPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "tienda" });

  const [productos, entrega, personajes] = await Promise.all([
    getProductos({ locale }),
    getEntrega(),
    getPersonajes({ locale }),
  ]);

  const set = productos.find((p) => p.tipo === "set");
  const imanes = productos.filter((p) => p.tipo === "iman");
  const figuras = productos.filter((p) => p.tipo === "figura");
  const precio = (n: number) => formatoPrecio(n, locale);

  // Ahorro del set frente a comprar sueltos los imanes que trae.
  const sueltos = set?.incluye?.reduce((s, slug) => s + (imanes.find((i) => i.personajeSlug === slug)?.precio ?? 0), 0) ?? 0;
  const ahorro = set ? sueltos - set.precio : 0;

  const tarjetas = ordenTarjeta(
    personajes.filter((p): p is typeof p & TarjetaPersonaje => !!p.tarjeta && !!set?.incluye?.includes(p.slug)),
  );

  const textosCard = (tipo: "iman" | "figura") => ({
    tipo: t(`tipo.${tipo}`),
    agotado: t("agotado"),
    verFicha: t("ver_ficha"),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-14">
      {/* Encabezado */}
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-acento-dorado">{t("eyebrow")}</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{t("titulo")}</h1>
        <p className="mt-3 text-base leading-relaxed text-stone-300 sm:text-lg">{t("intro")}</p>
      </header>
      <ol className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-3">
        {(["uno", "dos", "tres"] as const).map((paso, i) => (
          <li key={paso} className="flex items-center gap-3 rounded-xl border border-borde-sutil px-3 py-2.5 text-sm text-stone-300">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-acento-dorado/60 font-serif text-acento-dorado">
              {i + 1}
            </span>
            {t(`pasos.${paso}`)}
          </li>
        ))}
      </ol>

      {/* Colección completa en caja de regalo */}
      {set && (
        <section
          aria-labelledby="tienda-set"
          className="mt-12 grid items-center gap-8 overflow-hidden rounded-3xl border border-acento-dorado/30 bg-gradient-to-br from-[#37220A]/70 via-stone-950 to-stone-950 p-5 sm:p-8 md:grid-cols-[1.1fr_1fr] md:gap-12"
        >
          <div className="grid grid-cols-3 gap-3 sm:gap-5" style={{ containerType: "inline-size" }}>
            {tarjetas.map((p) => (
              <CirculoColeccion
                key={p.slug}
                personaje={p}
                activo
                sizes="(max-width: 768px) 28vw, 160px"
                etiquetaClassName="mt-2 text-[length:3.6cqw]"
              />
            ))}
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-acento-dorado">
              <CajaRegalo className="h-4 w-4" />
              {t("set.eyebrow")}
            </p>
            <h2 id="tienda-set" className="mt-2 font-serif text-3xl font-bold leading-tight text-texto-claro sm:text-4xl">
              {t("set.titulo")}
            </h2>
            <p className="mt-3 leading-relaxed text-stone-300">{t("set.texto")}</p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-serif text-4xl font-bold tabular-nums text-texto-claro">{precio(set.precio)}</span>
              {ahorro > 0 && (
                <>
                  <span className="text-lg tabular-nums text-stone-500 line-through">{precio(sueltos)}</span>
                  <span className="text-sm text-acento-dorado">{t("set.ahorro", { monto: precio(ahorro) })}</span>
                </>
              )}
            </div>
            <div className="mt-5 max-w-xs">
              {set.disponible ? (
                <BotonAgregar productoId={set.id} nombre={t("set.titulo")} />
              ) : (
                <p className="text-sm uppercase tracking-wider text-stone-400">{t("agotado")}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Imanes */}
      <section aria-labelledby="tienda-imanes" className="mt-16">
        <h2 id="tienda-imanes" className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
          {t("imanes.titulo")}
        </h2>
        <p className="mt-1 text-stone-400">{t("imanes.texto")}</p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {imanes.map((p) => (
            <ProductoCard key={p.id} producto={p} locale={locale} textos={textosCard("iman")} />
          ))}
        </ul>
      </section>

      {/* Figuras grandes */}
      {figuras.length > 0 && (
        <section aria-labelledby="tienda-figuras" className="mt-16">
          <h2 id="tienda-figuras" className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
            {t("figuras.titulo")}
          </h2>
          <p className="mt-1 text-stone-400">{t("figuras.texto")}</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {figuras.map((p) => (
              <ProductoCard key={p.id} producto={p} locale={locale} textos={textosCard("figura")} />
            ))}
          </ul>
        </section>
      )}

      {/* Entrega */}
      <section aria-labelledby="tienda-entrega" className="mt-16">
        <h2 id="tienda-entrega" className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
          {t("entrega.titulo")}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-borde-sutil p-5">
            <h3 className="font-serif text-xl font-bold text-texto-claro">{t("entrega.envio_titulo")}</h3>
            <p className="mt-2 leading-relaxed text-stone-300">{t("entrega.envio_texto")}</p>
          </div>
          {entrega.retiro.map((r) => (
            <div key={r.id} className="rounded-2xl border border-borde-sutil p-5">
              <h3 className="font-serif text-xl font-bold text-texto-claro">{t("entrega.retiro_titulo")}</h3>
              <address className="mt-2 not-italic leading-relaxed text-stone-300">
                <span className="block font-medium text-texto-claro">{r.lugar}</span>
                <span className="block">
                  {r.direccion}, {r.ciudad}
                </span>
                {r.locales && <span className="block">{t("entrega.locales", { locales: r.locales })}</span>}
                {r.horario && <span className="block">{t("entrega.horario", { horario: r.horario })}</span>}
              </address>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
