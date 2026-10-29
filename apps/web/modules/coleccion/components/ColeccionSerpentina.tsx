"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { hrefContacto } from "@/lib/contacto/whatsapp";
import type { PersonajeLite } from "../types";

export interface SerpentinaOrigen {
  origen: string;
  total: number;
  got: number;
  earned: boolean;
}

interface Props {
  personajes: PersonajeLite[];
  guardados: Set<string>;
  /** Cuándo se guardó cada uno (vacío mientras carga o sin sesión). */
  fechas: Map<string, Date>;
  origenes: SerpentinaOrigen[];
  fullCollection: boolean;
  onCertificadoPersonaje: (p: PersonajeLite) => void;
  onCertificadoOrigen: (origen: string) => void;
  onCertificadoColeccion: () => void;
}

/** Centro horizontal (%) de las tarjetas: izquierda/derecha, en móvil y desde `sm`. */
const CENTROS = { movil: [43, 57], sm: [29, 71] } as const;

function curva(desde: number, hasta: number) {
  return `M ${desde} 0 C ${desde} 70, ${hasta} 30, ${hasta} 100`;
}

/** "#C60D0D" → "rgba(198,13,13,a)" para el halo detrás del imán. */
function halo(hex: string | undefined, a: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return `rgba(200,155,60,${a})`;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function Candado() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

function Plaza({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />
    </svg>
  );
}

/** Tramo curvo que llega a una parada desde la anterior (dos trazados: móvil y `sm`+). */
function Conector({ i, hecho, alCentro = false }: { i: number; hecho: boolean; alCentro?: boolean }) {
  const izq = i % 2 === 0;
  const trazos = (["movil", "sm"] as const).map((k) => {
    const [cIzq, cDer] = CENTROS[k];
    const desde = i === 0 ? 50 : izq ? cDer : cIzq;
    return { k, d: curva(desde, alCentro ? 50 : izq ? cIzq : cDer) };
  });
  return (
    <>
      {trazos.map(({ k, d }) => (
        <svg
          key={k}
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={`${k === "movil" ? "block sm:hidden" : "hidden sm:block"} h-14 w-full sm:h-[72px]`}
        >
          <path
            d={d}
            fill="none"
            stroke={hecho ? "#C89B3C" : "#6B6157"}
            strokeWidth={hecho ? 4 : 2.5}
            strokeDasharray={hecho ? undefined : "2 9"}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ))}
    </>
  );
}

/**
 * /mis-personajes como una comparsa en camino: el estandarte arriba, luego cada personaje como una
 * parada de la serpentina (primero los que ya bailan contigo, por la fecha en que se unieron; después
 * los puestos libres) y la plaza al final. Cada parada pone de pie el imán real; los que faltan son su
 * silueta con un candado y llevan a conseguirlo.
 */
export function ColeccionSerpentina({
  personajes,
  guardados,
  fechas,
  origenes,
  fullCollection,
  onCertificadoPersonaje,
  onCertificadoOrigen,
  onCertificadoColeccion,
}: Props) {
  const t = useTranslations("coleccion");
  const tl = useTranslations("logros");
  const tc = useTranslations("comun");
  const locale = useLocale();
  const reducir = useReducedMotion();
  const formato = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const porOrden = (a: PersonajeLite, b: PersonajeLite) => (a.tarjeta?.orden ?? 99) - (b.tarjeta?.orden ?? 99);
  const conmigo = personajes
    .filter((p) => guardados.has(p.slug))
    .sort((a, b) => {
      const fa = fechas.get(a.slug)?.getTime();
      const fb = fechas.get(b.slug)?.getTime();
      return fa !== undefined && fb !== undefined && fa !== fb ? fa - fb : porOrden(a, b);
    });
  const libres = personajes.filter((p) => !guardados.has(p.slug)).sort(porOrden);
  const paradas = [...conmigo, ...libres];
  const n = conmigo.length;
  const faltan = personajes.length - n;

  const aparece = (i: number) =>
    reducir
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.45, ease: "easeOut" as const, delay: Math.min(i, 3) * 0.05 },
        };

  return (
    <div>
      {/* Estandarte: encabeza la comparsa */}
      <div className="flex justify-center">
        <div
          className={`flex w-[170px] flex-col items-center gap-1 px-3 pb-8 pt-4 text-center ${
            fullCollection ? "bg-acento-dorado text-fondo-oscuro" : "bg-[#2E4A3E] text-[#F3EBDA]"
          }`}
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{t("estandarte")}</span>
          <span className="font-serif text-4xl font-black leading-none">
            {n}/{personajes.length}
          </span>
          <span className="text-[11px] font-semibold">
            {fullCollection ? t("comparsa_completa") : t("bailan_contigo")}
          </span>
        </div>
      </div>

      <ol className="flex flex-col">
        {paradas.map((p, i) => {
          const tiene = guardados.has(p.slug);
          const nombre = p.tarjeta?.nombre ?? p.nombre;
          const fecha = fechas.get(p.slug);
          const iman = p.imagenIman ?? p.imagenPortada;
          return (
            <li key={p.slug} className="flex flex-col">
              <Conector i={i} hecho={tiene} />
              <div className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <motion.div
                  {...aparece(i)}
                  className={`flex w-[86%] items-end gap-2.5 rounded-[22px] pb-3.5 pl-2 pr-4 sm:w-[58%] sm:gap-[18px] ${
                    tiene
                      ? "border border-acento-dorado/50 bg-[#171411] shadow-[0_18px_40px_-24px_rgba(200,155,60,0.6)]"
                      : "border-[1.5px] border-dashed border-stone-600 bg-[#121010]"
                  }`}
                >
                  {/* El imán "sale" de la tarjeta: sube sobre el borde. */}
                  <Link
                    href={tiene ? { pathname: "/personajes/[slug]", params: { slug: p.slug } } : hrefContacto(p.slug)}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="relative -mt-10 flex h-[150px] w-[104px] flex-none items-end justify-center sm:-mt-14 sm:h-[200px] sm:w-[150px]"
                  >
                    {tiene && (
                      <span
                        className="absolute inset-x-[10%] bottom-0 h-[70%] rounded-full blur-[2px]"
                        style={{ background: halo(p.tarjeta?.color, 0.45) }}
                      />
                    )}
                    {iman && (
                      <Image
                        src={iman}
                        alt=""
                        width={300}
                        height={400}
                        sizes="(max-width: 640px) 104px, 150px"
                        className={`relative max-h-full w-auto object-contain ${
                          tiene ? "drop-shadow-[0_14px_14px_rgba(0,0,0,0.7)]" : "opacity-[0.16] brightness-0 invert"
                        }`}
                      />
                    )}
                    {!tiene && (
                      <span className="absolute left-1/2 top-[46%] flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full border border-white/25 bg-fondo-oscuro/90 text-stone-200">
                        <Candado />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1 pt-4">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        tiene ? "text-acento-dorado" : "text-stone-400"
                      }`}
                    >
                      {tiene
                        ? fecha
                          ? t("parada_guardado", { n: i + 1, fecha: formato.format(fecha) })
                          : t("parada_conmigo", { n: i + 1 })
                        : t("parada_libre", { n: i + 1 })}
                    </span>
                    <h3
                      className={`font-serif text-[19px] font-bold leading-tight sm:text-2xl ${
                        tiene ? "text-texto-claro" : "text-stone-300"
                      }`}
                    >
                      {nombre}
                    </h3>
                    {p.leyenda && (
                      <p className="hidden font-serif text-sm italic leading-relaxed text-stone-400 sm:block">
                        “{p.leyenda}”
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {tiene ? (
                        <>
                          <Link
                            href={{ pathname: "/personajes/[slug]", params: { slug: p.slug } }}
                            aria-label={`${t("ver_su_ficha")}: ${nombre}`}
                            className="inline-flex h-9 items-center rounded-full border border-borde-sutil px-3.5 text-xs font-semibold text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
                          >
                            {t("ver_su_ficha")}
                          </Link>
                          <button
                            type="button"
                            onClick={() => onCertificadoPersonaje(p)}
                            aria-label={`${t("ver_certificado")}: ${nombre}`}
                            className="inline-flex h-9 items-center rounded-full px-2 text-xs font-semibold text-acento-dorado/90 underline-offset-2 hover:underline"
                          >
                            {t("certificado")}
                          </button>
                        </>
                      ) : (
                        <Link
                          href={hrefContacto(p.slug)}
                          aria-label={`${t("conseguir_iman")}: ${nombre}`}
                          className="inline-flex h-9 items-center rounded-full border border-acento-dorado px-3.5 text-xs font-semibold text-acento-dorado transition-colors hover:bg-acento-dorado hover:text-fondo-oscuro"
                        >
                          {t("conseguir_iman")}
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </li>
          );
        })}

        {/* Meta: la plaza — el gran final, centrado y destacado. */}
        <li className="flex flex-col">
          <Conector i={paradas.length} hecho={fullCollection} alCentro />
          <motion.section
            {...aparece(paradas.length)}
            aria-labelledby="meta-guardian"
            className={`relative mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border-2 px-5 pb-6 pt-7 text-center sm:px-10 sm:pb-8 sm:pt-9 ${
              fullCollection
                ? "border-[#F0D98A] bg-[radial-gradient(ellipse_at_top,rgba(200,155,60,0.32),#15110A_70%)] shadow-[0_0_0_8px_rgba(240,217,138,0.08),0_30px_80px_-30px_rgba(200,155,60,0.7)]"
                : "border-acento-dorado/45 bg-[radial-gradient(ellipse_at_top,rgba(200,155,60,0.14),#121010_70%)]"
            }`}
          >
            <motion.span
              aria-hidden="true"
              animate={fullCollection && !reducir ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24 ${
                fullCollection
                  ? "border-[3px] border-[#F0D98A] bg-acento-dorado text-fondo-oscuro"
                  : "border-2 border-acento-dorado/60 bg-fondo-oscuro text-acento-dorado"
              }`}
            >
              <Plaza className="h-9 w-9 sm:h-11 sm:w-11" />
            </motion.span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-acento-dorado">{t("meta")}</p>
            <h2 id="meta-guardian" className="mt-1 font-serif text-4xl font-bold text-[#F0D98A] sm:text-5xl">
              {tl("coleccion_completa")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-300 sm:text-base">
              {fullCollection ? t("meta_texto_completa") : t("meta_texto", { total: personajes.length })}
            </p>

            {/* La comparsa completa: los que bailan contigo y los puestos libres. */}
            <ul className="mx-auto mt-6 grid max-w-lg grid-cols-6 items-end gap-1 sm:gap-2" aria-label={t("meta_comparsa")}>
              {[...personajes]
                .sort((a, b) => (a.tarjeta?.orden ?? 99) - (b.tarjeta?.orden ?? 99))
                .map((p) => {
                  const tiene = guardados.has(p.slug);
                  const img = p.imagenIman ?? p.imagenPortada;
                  return (
                    <li key={p.slug} className="flex h-16 items-end justify-center sm:h-24" title={p.tarjeta?.nombre ?? p.nombre}>
                      {img && (
                        <Image
                          src={img}
                          alt={tiene ? p.tarjeta?.nombre ?? p.nombre : ""}
                          width={120}
                          height={160}
                          sizes="64px"
                          className={`h-auto max-h-full w-auto max-w-full object-contain ${
                            tiene ? "drop-shadow-[0_8px_8px_rgba(0,0,0,0.7)]" : "opacity-[0.16] brightness-0 invert"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
            </ul>
            <div className="mx-auto mt-3 h-1.5 max-w-lg overflow-hidden rounded-full bg-stone-800">
              <div className="h-full rounded-full bg-acento-dorado" style={{ width: `${(n / personajes.length) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-stone-400">{t("meta_progreso", { n, total: personajes.length })}</p>

            {fullCollection ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <a
                  href="#recorrido-premio"
                  className="inline-flex h-11 items-center rounded-full bg-acento-dorado px-5 text-sm font-semibold text-fondo-oscuro"
                >
                  {t("ver_recorrido")}
                </a>
                <button
                  type="button"
                  onClick={onCertificadoColeccion}
                  className="inline-flex h-11 items-center rounded-full border border-[#F0D98A]/70 px-5 text-sm font-semibold text-[#F0D98A] transition-colors hover:bg-acento-dorado/15"
                >
                  {t("cert_guardian_boton")}
                </button>
              </div>
            ) : (
              <>
                <p className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-full border border-borde-sutil px-4 py-2 text-xs text-stone-300 sm:text-sm">
                  <Candado />
                  {t("meta_premio")}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link
                    href={{ pathname: "/personajes", query: { personajes: libres.map((p) => p.slug).join(",") } }}
                    className="inline-flex h-11 items-center rounded-full bg-acento-dorado px-5 text-sm font-semibold text-fondo-oscuro"
                  >
                    {t("meta_conseguir", { n: faltan })}
                  </Link>
                </div>
              </>
            )}
          </motion.section>
        </li>
      </ol>

      {/* Logros: una medalla por origen; las conseguidas abren su certificado. */}
      <section aria-labelledby="tus-logros" className="mt-14">
        <h2 id="tus-logros" className="text-center font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
          {t("logros_titulo")}
        </h2>
        <ul className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {origenes.map((o) => {
            const label = tc(`origen.${o.origen}` as "origen.prehispanico");
            const del = personajes.filter((p) => p.origen === o.origen);
            const faltanDel = del.filter((p) => !guardados.has(p.slug)).map((p) => p.tarjeta?.nombre ?? p.nombre);
            return (
              <li
                key={o.origen}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center ${
                  o.earned ? "border-acento-dorado/60 bg-acento-dorado/[0.08]" : "border-borde-sutil bg-[#121010]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    o.earned ? "bg-acento-dorado text-fondo-oscuro shadow-[0_0_0_5px_rgba(200,155,60,0.2)]" : "border-2 border-dashed border-stone-600 text-stone-500"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
                    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />
                  </svg>
                </span>
                <span className={`font-serif text-base font-bold leading-tight ${o.earned ? "text-texto-claro" : "text-stone-300"}`}>
                  {tl("origen_completo", { origen: label })}
                </span>
                <span className="flex h-9 items-end justify-center gap-1">
                  {del.map((p) => {
                    const img = p.imagenIman ?? p.imagenPortada;
                    const tiene = guardados.has(p.slug);
                    return img ? (
                      <Image
                        key={p.slug}
                        src={img}
                        alt=""
                        width={60}
                        height={80}
                        sizes="28px"
                        className={`h-9 w-auto object-contain ${tiene ? "" : "opacity-[0.16] brightness-0 invert"}`}
                      />
                    ) : null;
                  })}
                </span>
                {o.earned ? (
                  <button
                    type="button"
                    onClick={() => onCertificadoOrigen(o.origen)}
                    aria-label={`${tl("origen_completo", { origen: label })} — ${t("ver_certificado")}`}
                    className="mt-auto inline-flex h-9 items-center rounded-full border border-acento-dorado px-3.5 text-xs font-semibold text-acento-dorado transition-colors hover:bg-acento-dorado hover:text-fondo-oscuro"
                  >
                    {t("ver_certificado")}
                  </button>
                ) : (
                  <span className="mt-auto text-xs leading-snug text-stone-400">{t("logro_falta", { nombres: faltanDel.join(", ") })}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
