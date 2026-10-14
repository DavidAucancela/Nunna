"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PaseListItem } from "@seres-del-pase/types";
import type { Recorridos } from "@/lib/data";
import { acotarRecorridos } from "@/lib/services/recorrido.service";
import type {
  ProvinciaConPases,
  Region,
} from "@/lib/services/provincias.service";
import { colorParaRuta } from "@/lib/map/paleta-rutas";
import { ListaPaginada } from "./ListaPaginada";
import { MapaEcuador, type RutaMapa } from "./MapaEcuador";
import { ProvinciaCard } from "./ProvinciaCard";
import {
  RecorridoScrollytelling,
  type PaseSugerido,
} from "./RecorridoScrollytelling";

interface Props {
  provincias: ProvinciaConPases[];
  pasesInfo: PaseListItem[];
  recorridos: Recorridos;
  /** Foto real de pase por provincia (slug → url); la mayoría aún no tiene. */
  fotosProvincia: Record<string, string>;
}

// Lo que dura el acercamiento del mapa a la ruta antes de abrir el recorrido.
const MS_ENTRADA = 800;
// Si el mapa del recorrido no avisa que pintó (red lenta), se muestra igual.
const MS_ESPERA_MAPA = 2500;

/** "20 dic" / "abr" (sin día) — `null` si el pase no tiene fecha de calendario. */
function fechaCorta(pase: PaseListItem, locale: string): string | null {
  if (pase.mes == null) return null;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    ...(pase.dia != null ? { day: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, pase.mes - 1, pase.dia ?? 1)));
}

/**
 * El pase de la lista que viene después de `hoy` en el calendario (los pases
 * se repiten cada año: pasado diciembre, el siguiente es el primero de enero).
 */
function proximoPase(
  pases: PaseListItem[],
  hoy: Date,
): PaseListItem | undefined {
  const clave = (mes: number, dia: number) => mes * 100 + dia;
  const ahora = clave(hoy.getMonth() + 1, hoy.getDate());
  const conFecha = pases
    .filter((p) => p.mes != null)
    .sort((a, b) => clave(a.mes!, a.dia ?? 1) - clave(b.mes!, b.dia ?? 1));
  return (
    conFecha.find((p) => clave(p.mes!, p.dia ?? 31) >= ahora) ?? conFecha[0]
  );
}

/** Día y mes por separado, para el sello de fecha de la tarjeta de pase. */
function partesFecha(
  pase: PaseListItem,
  locale: string,
): { dia: string; mes: string } | null {
  if (pase.mes == null) return null;
  const mes = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(2024, pase.mes - 1, 1)))
    .replace(".", "");
  return { dia: pase.dia != null ? String(pase.dia) : "·", mes };
}

function useEsEscritorio(): boolean {
  const [es, setEs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const actualizar = () => setEs(mq.matches);
    actualizar();
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);
  return es;
}

/**
 * `/pases` es una ventana fija, sin scroll de página, con tres vistas que
 * comparten un mismo diseño — mapa a la izquierda (55 %), panel a la derecha:
 *  1. País — mapa del Ecuador (solo provincias con pases) + índice.
 *  2. Provincia — el mapa hace zoom a la ciudad y dibuja las rutas; al lado,
 *     los pases para entrar (los que aún no tienen ruta salen apagados).
 *  3. Pase — "Un pase, un camino" (`RecorridoScrollytelling`). Es la única
 *     vista que usa el scroll: es lo que hace avanzar el recorrido.
 *
 * Entrar a un pase es una transición en dos tiempos: el mapa se cierra sobre
 * la ruta elegida mientras el panel anuncia el pase, y solo entonces el
 * recorrido aparece encima, con su mapa ya pintado en ese mismo encuadre. La
 * ventana queda fija por debajo (invisible) para no recrear el mapa al volver.
 */
export function PasesExplorador({
  provincias,
  pasesInfo,
  recorridos,
  fotosProvincia,
}: Props) {
  const t = useTranslations("pases.mapa");
  const tPases = useTranslations("pases");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const esEscritorio = useEsEscritorio();

  const [provinciaSlug, setProvinciaSlug] = useState<string | null>(null);
  const [paseSlug, setPaseSlug] = useState<string | null>(null);
  /** Pase al que se está entrando (mapa acercándose) — todavía no abierto. */
  const [entrando, setEntrando] = useState<string | null>(null);
  const [recorridoListo, setRecorridoListo] = useState(false);
  const [ventanaOculta, setVentanaOculta] = useState(false);
  /** El recorrido se está desvaneciendo para volver a la provincia. */
  const [saliendo, setSaliendo] = useState(false);
  /** Sentido del relevo de paneles: 1 = se avanza (entra por la derecha), -1 = se vuelve. */
  const [sentido, setSentido] = useState<1 | -1>(1);
  const [rutaDestacada, setRutaDestacada] = useState<string | null>(null);
  const entradaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pase al que se va al terminar de desvanecer el actual (salto entre pases). */
  const siguienteRef = useRef<string | null>(null);
  // La fecha del visitante solo existe en el cliente: hasta montar no se pinta
  // nada que dependa de ella (la página es SSG; evita desajustes de hidratación).
  const [hoy, setHoy] = useState<Date | null>(null);
  useEffect(() => setHoy(new Date()), []);

  const provincia = provincias.find((p) => p.slug === provinciaSlug) ?? null;
  const enPase = paseSlug != null;
  const infoPorSlug = useMemo(
    () => new Map(pasesInfo.map((p) => [p.slug, p])),
    [pasesInfo],
  );

  const recorridosProvincia = useMemo(
    () =>
      acotarRecorridos(recorridos, provincia?.pases.map((p) => p.slug) ?? []),
    [provincia, recorridos],
  );

  const rutas = useMemo<RutaMapa[]>(
    () =>
      recorridosProvincia.pases.map((r, i) => ({
        slug: r.paseSlug,
        color: colorParaRuta(i),
        coords: r.ruta,
      })),
    [recorridosProvincia],
  );
  const colorPorPase = useMemo(
    () => new Map(rutas.map((r) => [r.slug, r.color])),
    [rutas],
  );

  // Primero los pases que se pueden recorrer; dentro de cada grupo, por fecha.
  const pasesOrdenados = useMemo(() => {
    if (!provincia) return [];
    return [...provincia.pases].sort((a, b) => {
      const porRuta =
        Number(colorPorPase.has(b.slug)) - Number(colorPorPase.has(a.slug));
      return (
        porRuta ||
        (a.mes ?? 13) - (b.mes ?? 13) ||
        (a.dia ?? 32) - (b.dia ?? 32)
      );
    });
  }, [provincia, colorPorPase]);

  // Al terminar un recorrido se sugieren 2 pases más: primero los de la misma
  // provincia; si no alcanzan, los de otras (elegirlos cambia de provincia).
  const sugeridos = useMemo<PaseSugerido[]>(() => {
    if (!paseSlug) return [];
    const candidatos = recorridos.pases
      .map((r) => infoPorSlug.get(r.paseSlug))
      .filter((p): p is PaseListItem => p != null && p.slug !== paseSlug)
      .sort(
        (a, b) =>
          Number(b.provincia === provinciaSlug) -
          Number(a.provincia === provinciaSlug),
      );
    return candidatos.slice(0, 2).map((p) => ({
      slug: p.slug,
      nombre: p.nombre,
      meta: [fechaCorta(p, locale), p.ciudad].filter(Boolean).join(" · "),
    }));
  }, [paseSlug, provinciaSlug, recorridos.pases, infoPorSlug, locale]);

  // Ventana fija: mientras no se esté recorriendo un pase, la página no se
  // desplaza. `data-lenis-prevent` en la ventana evita que Lenis mueva el
  // scroll por su cuenta con la rueda.
  useEffect(() => {
    window.scrollTo(0, 0);
    if (enPase) return;
    const html = document.documentElement;
    const body = document.body;
    const previo = [html.style.overflow, body.style.overflow] as const;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previo[0];
      body.style.overflow = previo[1];
    };
  }, [enPase]);

  // Red de seguridad: si el mapa del recorrido tarda, no dejar la vista en blanco.
  useEffect(() => {
    if (!enPase || recorridoListo) return;
    const id = setTimeout(() => setRecorridoListo(true), MS_ESPERA_MAPA);
    return () => clearTimeout(id);
  }, [enPase, recorridoListo]);

  useEffect(
    () => () => {
      if (entradaTimer.current) clearTimeout(entradaTimer.current);
    },
    [],
  );

  function elegirProvincia(slug: string | null) {
    setSentido(slug ? 1 : -1);
    setRutaDestacada(null);
    setProvinciaSlug(slug);
  }

  function entrarAPase(slug: string) {
    if (entrando) return;
    setSentido(1);
    setRutaDestacada(null);
    setEntrando(slug);
    entradaTimer.current = setTimeout(
      () => {
        setRecorridoListo(false);
        setPaseSlug(slug);
        setEntrando(null);
      },
      reduced ? 0 : MS_ENTRADA,
    );
  }

  // Volver es la entrada al revés: el recorrido se desvanece sobre la ventana
  // (que reaparece debajo con el mapa aún sobre la ruta) y, ya sin él, el mapa
  // se abre a todas las rutas mientras la lista de pases entra por la izquierda.
  function salirDePase() {
    setSentido(-1);
    setVentanaOculta(false);
    // Si el recorrido aún no se había mostrado no hay nada que desvanecer (y
    // sin cambio de opacidad `onAnimationComplete` no dispararía nunca).
    if (reduced || !recorridoListo) cerrarPase();
    else setSaliendo(true);
  }

  function cerrarPase() {
    setSaliendo(false);
    setRecorridoListo(false);
    setPaseSlug(null);
    // Salto a otro pase: con el actual ya fuera, se entra al nuevo por el
    // mismo camino que desde la lista (mapa → ruta, anuncio, recorrido).
    const siguiente = siguienteRef.current;
    siguienteRef.current = null;
    if (siguiente) {
      const destino = infoPorSlug.get(siguiente)?.provincia;
      if (destino && destino !== provinciaSlug) setProvinciaSlug(destino);
      entrarAPase(siguiente);
    }
  }

  // De un pase a otro (sugeridos del cierre): no se
  // cambia en seco — sale el recorrido actual y entra el nuevo, con el mapa
  // viajando de una ruta a la otra en medio.
  function cambiarDePase(slug: string) {
    if (slug === paseSlug || saliendo || entrando) return;
    siguienteRef.current = slug;
    setSentido(1);
    setVentanaOculta(false);
    if (reduced || !recorridoListo) cerrarPase();
    else setSaliendo(true);
  }

  const regionLabel: Record<Region, string> = {
    sierra: t("region.sierra"),
    costa: t("region.costa"),
    amazonia: t("region.amazonia"),
    insular: t("region.insular"),
  };

  const totalPases = provincias.reduce((acc, p) => acc + p.pases.length, 0);
  const proximaFiesta = hoy
    ? proximoPase(
        provincias.flatMap((p) => p.pases),
        hoy,
      )
    : undefined;

  const paginacion = {
    labelAnterior: t("anterior"),
    labelSiguiente: t("siguiente"),
    labelPagina: (n: number, total: number) => t("pagina", { n, total }),
  };

  // Variantes con `custom`: el panel que SALE debe leer el sentido nuevo, y
  // `AnimatePresence custom` es la única vía de dárselo a un hijo ya desmontado.
  const variantesPanel = {
    entra: (dir: number) =>
      reduced ? { opacity: 0 } : { opacity: 0, x: 28 * dir },
    quieto: { opacity: 1, x: 0 },
    sale: (dir: number) =>
      reduced ? { opacity: 0 } : { opacity: 0, x: -28 * dir },
  };
  const transicionPanel = {
    variants: variantesPanel,
    custom: sentido,
    initial: "entra",
    animate: "quieto",
    exit: "sale",
    transition: { duration: reduced ? 0 : 0.35, ease: "easeOut" as const },
  };

  // El panel sigue anunciando el pase hasta que el recorrido lo tapa.
  const paseAnunciado = infoPorSlug.get(entrando ?? paseSlug ?? "");

  return (
    <>
      {/* ── Ventana fija (vistas 1 y 2). Bajo el recorrido queda invisible, no
          desmontada: así el mapa conserva su tamaño y su cámara. ── */}
      <section
        data-lenis-prevent
        aria-label={tPases("titulo")}
        className={`fixed inset-x-0 bottom-0 top-16 z-0 flex flex-col overflow-hidden bg-fondo-oscuro md:flex-row ${
          ventanaOculta ? "invisible" : ""
        }`}
      >
        {/* ── Mapa — arriba 40dvh (móvil) / izquierda 55% (escritorio): las
            mismas medidas que `RecorridoScrollytelling` ── */}
        <div className="relative h-[40dvh] flex-shrink-0 md:h-full md:w-[55%]">
          <MapaEcuador
            provincias={provincias}
            provinciaActiva={provinciaSlug}
            rutas={rutas}
            rutaDestacada={entrando ?? paseSlug ?? rutaDestacada}
            rutaEnfocada={entrando ?? paseSlug}
          />
        </div>

        {/* ── Panel — abajo (móvil) / derecha 45% (escritorio) ── */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t border-borde-sutil md:border-l md:border-t-0">
          <AnimatePresence mode="wait" initial={false} custom={sentido}>
            {paseAnunciado ? (
              // Mismo lugar y tipografía que la tarjeta inicial del recorrido:
              // al fundirse una vista en la otra el título no se mueve.
              <motion.div
                key="anuncio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
                className="flex min-h-0 flex-1 flex-col justify-center gap-3 px-7 py-6 md:gap-5 md:px-12"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-acento-dorado md:text-sm">
                  {paseAnunciado.tipo ?? tPases("recorrido.eyebrow")}
                </p>
                <p className="font-serif text-2xl font-bold leading-[1.1] text-texto-claro md:text-5xl">
                  {paseAnunciado.nombre}
                </p>
              </motion.div>
            ) : provincia ? (
              <motion.div
                key={provincia.slug}
                {...transicionPanel}
                className="flex min-h-0 flex-1 flex-col p-4 md:px-12 md:py-10"
              >
                <button
                  type="button"
                  onClick={() => elegirProvincia(null)}
                  className="-ml-2 -mt-2 inline-flex min-h-[44px] w-fit items-center gap-1.5 rounded-md px-2 text-sm text-stone-400 md:text-lg transition-colors hover:text-acento-dorado focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 md:mt-0"
                >
                  <span aria-hidden="true">‹</span>
                  {t("ecuador")}
                </button>
                <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado md:mt-4 md:text-sm">
                  {regionLabel[provincia.region]} ·{" "}
                  {t("pases_count", { count: provincia.pases.length })}
                </p>
                <h1 className="mt-1 font-serif text-2xl font-bold text-texto-claro md:mt-2 md:text-5xl">
                  {t("pases_en", { provincia: provincia.nombre })}
                </h1>

                <div className="mt-3 flex min-h-0 flex-1 flex-col md:mt-6">
                  <ListaPaginada
                    items={pasesOrdenados}
                    getKey={(p) => p.slug}
                    itemHeight={esEscritorio ? 82 : 60}
                    maxItemHeight={esEscritorio ? 230 : 130}
                    gap={esEscritorio ? 12 : 8}
                    {...paginacion}
                    renderItem={(pase, alto) => {
                      // Con pocos pases las filas crecen: la tarjeta amplia
                      // suma la descripción del calendario.
                      const amplia = alto >= 150;
                      const sello = partesFecha(pase, locale);
                      const color = colorPorPase.get(pase.slug);
                      const meta = [
                        fechaCorta(pase, locale),
                        pase.ciudad,
                        pase.tipo,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      const cuerpo = (
                        <>
                          <span
                            className="relative flex aspect-square h-[calc(100%-1.25rem)] max-h-36 flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border-2 bg-stone-900"
                            style={{ borderColor: color ?? "#2A2724" }}
                          >
                            {pase.imagenPortada ? (
                              <Image
                                src={pase.imagenPortada}
                                alt=""
                                fill
                                sizes="144px"
                                className="object-cover"
                              />
                            ) : (
                              // Sin afiche: el sello de la fecha hace de imagen.
                              sello && (
                                <>
                                  <span
                                    className={`font-serif font-bold leading-none text-texto-claro ${amplia ? "text-5xl" : "text-xl md:text-3xl"}`}
                                  >
                                    {sello.dia}
                                  </span>
                                  <span
                                    className={`uppercase tracking-[0.18em] text-acento-dorado ${amplia ? "mt-1.5 text-sm" : "text-[9px] md:text-xs"}`}
                                  >
                                    {sello.mes}
                                  </span>
                                </>
                              )
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`text-texto-claro ${amplia ? "line-clamp-2 font-serif text-2xl font-bold leading-tight md:text-3xl" : "block truncate text-base font-medium md:text-xl"}`}
                            >
                              {pase.nombre}
                            </span>
                            <span
                              className={`block truncate text-stone-400 ${amplia ? "mt-1.5 text-base" : "text-xs md:text-base"}`}
                            >
                              {meta}
                            </span>
                            {amplia && (
                              <span className="mt-2 line-clamp-2 text-base leading-snug text-stone-500">
                                {pase.fechaDescripcion}
                              </span>
                            )}
                          </span>
                        </>
                      );
                      const base =
                        "flex h-full w-full items-center gap-3 rounded-xl border border-borde-sutil bg-fondo-oscuro/70 px-2.5 text-left md:gap-5 md:px-4";

                      if (!color) {
                        return (
                          <div
                            aria-disabled="true"
                            className={`${base} opacity-50`}
                          >
                            {cuerpo}
                            <span className="flex-shrink-0 rounded-full border border-borde-sutil px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-stone-400 md:px-3 md:py-1 md:text-xs">
                              {t("proximamente")}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => entrarAPase(pase.slug)}
                          onPointerEnter={() => setRutaDestacada(pase.slug)}
                          onPointerLeave={() => setRutaDestacada(null)}
                          onFocus={() => setRutaDestacada(pase.slug)}
                          onBlur={() => setRutaDestacada(null)}
                          aria-label={`${pase.nombre} — ${t("ver_recorrido")}`}
                          className={`${base} transition-colors hover:border-acento-dorado hover:bg-acento-dorado/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70`}
                        >
                          {cuerpo}
                          <span
                            aria-hidden="true"
                            className="flex-shrink-0 pr-1.5 text-xl text-acento-dorado md:text-2xl"
                          >
                            →
                          </span>
                        </button>
                      );
                    }}
                  />
                </div>

                {provincia.slug === "chimborazo" && (
                  <p className="mt-2 line-clamp-1 flex-shrink-0 text-[11px] leading-snug text-stone-500 md:line-clamp-2 md:text-xs">
                    {tPases("nota")}
                  </p>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* ── Vista 1: el índice de provincias, a ventana completa. Tapa el mapa
            (que sigue montado debajo, encuadrado en el país): al elegir una
            provincia esta capa se disuelve y lo que aparece es el mapa ya
            volando hacia ella. ── */}
        <AnimatePresence initial={false}>
          {!provincia && (
            <motion.div
              key="pais"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
              className="absolute inset-0 z-10 flex flex-col bg-fondo-oscuro"
            >
              <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-4 md:px-8 md:py-10">
                <p className="hidden text-sm uppercase tracking-[0.25em] text-acento-dorado md:block">
                  {t("eyebrow")}
                </p>
                <h1 className="font-serif text-3xl font-bold text-texto-claro md:mt-1 md:text-6xl">
                  {t("titulo")}
                </h1>
                <p className="mt-3 hidden text-lg text-stone-400 md:block">
                  {t("intro")}
                </p>

                {/* Resumen: cuánto hay y qué viene. */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-400 md:mt-5 md:gap-x-4 md:text-lg">
                  <span>
                    <strong className="font-semibold text-texto-claro">
                      {provincias.length}
                    </strong>{" "}
                    {t("resumen_provincias", { count: provincias.length })}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-stone-600"
                  />
                  <span>
                    <strong className="font-semibold text-texto-claro">
                      {totalPases}
                    </strong>{" "}
                    {t("resumen_pases", { count: totalPases })}
                  </span>
                  {proximaFiesta && (
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-acento-dorado/30 bg-acento-dorado/10 px-3 py-0.5 text-acento-dorado md:px-4 md:py-1 [@media(max-height:700px)]:hidden">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-acento-dorado motion-safe:animate-pulse"
                      />
                      <span className="truncate">
                        {t("proxima_fiesta", {
                          nombre: proximaFiesta.nombre,
                          fecha: fechaCorta(proximaFiesta, locale) ?? "",
                        })}
                      </span>
                    </span>
                  )}
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col md:mt-6">
                  <ListaPaginada
                    items={provincias}
                    getKey={(p) => p.slug}
                    itemHeight={esEscritorio ? 170 : 104}
                    maxItemHeight={esEscritorio ? 250 : 200}
                    columnas={esEscritorio ? 3 : 2}
                    gap={esEscritorio ? 16 : 8}
                    {...paginacion}
                    renderItem={(p) => {
                      const proximo = hoy
                        ? proximoPase(p.pases, hoy)
                        : undefined;
                      const fecha = proximo
                        ? fechaCorta(proximo, locale)
                        : null;
                      return (
                        <ProvinciaCard
                          slug={p.slug}
                          nombre={p.nombre}
                          region={p.region}
                          regionLabel={regionLabel[p.region]}
                          conteo={t("pases_count", { count: p.pases.length })}
                          {...(fecha
                            ? { proxima: t("proxima", { fecha }) }
                            : {})}
                          {...(fotosProvincia[p.slug]
                            ? { foto: fotosProvincia[p.slug] }
                            : {})}
                          onSelect={() => elegirProvincia(p.slug)}
                        />
                      );
                    }}
                  />
                </div>

                <p className="mt-3 flex-shrink-0 text-[11px] text-stone-600 md:text-xs">
                  {t("atribucion")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Vista 3: el recorrido, encima de la ventana. Aparece solo cuando su
          mapa ya pintó, para que el relevo no pase por una pantalla vacía.
          Solo opacidad: un `transform` en un ancestro rompería su `sticky`. ── */}
      {enPase && provincia && (
        <motion.div
          className="relative z-10"
          style={{
            pointerEvents: recorridoListo && !saliendo ? "auto" : "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: recorridoListo && !saliendo ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.45 }}
          onAnimationComplete={() => {
            if (saliendo) cerrarPase();
            else if (recorridoListo) setVentanaOculta(true);
          }}
        >
          <RecorridoScrollytelling
            key={paseSlug}
            recorridos={recorridosProvincia}
            pasesInfo={pasesInfo}
            paseSlug={paseSlug}
            onVolver={salirDePase}
            volverLabel={t("pases_en", { provincia: provincia.nombre })}
            sugeridos={sugeridos}
            onSugerido={cambiarDePase}
            onMapaListo={() => setRecorridoListo(true)}
          />
        </motion.div>
      )}
    </>
  );
}
