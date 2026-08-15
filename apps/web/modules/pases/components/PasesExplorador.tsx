"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PaseListItem } from "@seres-del-pase/types";
import type { Recorridos } from "@/lib/data";
import { acotarRecorridos } from "@/lib/services/recorrido.service";
import type { ProvinciaConPases } from "@/lib/services/provincias.service";
import { MapaEcuador } from "./MapaEcuador";
import { ProvinciaDetalle } from "./ProvinciaDetalle";

interface Props {
  provincias: ProvinciaConPases[];
  pasesInfo: PaseListItem[];
  recorridos: Recorridos;
}

/**
 * Explorador de /pases (fusiona lo que antes eran /pases y /calendario):
 * el mapa de Ecuador queda siempre montado — al elegir una provincia hace
 * zoom real sobre ella (ver `MapaEcuador`) — y sus 4 secciones (recorrido,
 * galería, calendario, información) aparecen debajo.
 */
export function PasesExplorador({ provincias, pasesInfo, recorridos }: Props) {
  const t = useTranslations("pases.mapa");
  const reduced = useReducedMotion();
  const anclaRef = useRef<HTMLDivElement>(null);

  const [provinciaSlug, setProvinciaSlug] = useState<string | null>(null);
  const provincia = provincias.find((p) => p.slug === provinciaSlug) ?? null;

  const conRecorrido = useMemo(
    () => new Set(recorridos.pases.map((r) => r.paseSlug)),
    [recorridos.pases]
  );

  const recorridosProvincia = useMemo(() => {
    if (!provincia) return { defaultPaseSlug: "", pases: [] };
    const slugs = provincia.pases.filter((p) => conRecorrido.has(p.slug)).map((p) => p.slug);
    return acotarRecorridos(recorridos, slugs, slugs[0] ?? "");
  }, [provincia, recorridos, conRecorrido]);

  /**
   * Antes de cambiar de provincia hay que volver al inicio de la sección: si
   * hay un recorrido montado (300vh) y se colapsa de golpe al deseleccionar,
   * el navegador recorta el scroll y el usuario aterriza en cualquier parte.
   */
  function seleccionar(slug: string | null) {
    anclaRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    setProvinciaSlug(slug);
  }

  return (
    <section ref={anclaRef} className="scroll-mt-16">
      {provinciaSlug && (
        <nav
          aria-label={t("ecuador")}
          className="mx-auto mb-8 flex max-w-7xl flex-wrap items-center gap-2 px-6 text-sm"
        >
          <button
            type="button"
            onClick={() => seleccionar(null)}
            className="rounded-md px-1 text-stone-400 transition-colors hover:text-texto-claro focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
          >
            {t("ecuador")}
          </button>
          {provincia && (
            <>
              <span aria-hidden="true" className="text-stone-700">
                ›
              </span>
              <span aria-current="page" className="px-1 text-texto-claro">
                {provincia.nombre}
              </span>
            </>
          )}
        </nav>
      )}

      {/* El mapa queda siempre montado; solo cambia su prop de zoom. */}
      <div className="mx-auto max-w-7xl px-6">
        {!provinciaSlug && (
          <>
            <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">{t("eyebrow")}</p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
              {t("titulo")}
            </h2>
            <p className="mt-3 max-w-xl text-stone-400">{t("intro")}</p>
          </>
        )}

        <div className={provinciaSlug ? "mt-2" : "mt-10"}>
          <MapaEcuador provincias={provincias} provinciaActiva={provinciaSlug} onSelect={seleccionar} />
        </div>
      </div>

      {/* `initial={false}`: en SSG esta parte no existe al cargar (provinciaSlug
          arranca en null), así que no hay riesgo de flash — solo anima la
          aparición/salida real al navegar. */}
      <AnimatePresence mode="wait">
        {provincia && (
          <motion.div
            key={provincia.slug}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
            className="mt-10"
          >
            <ProvinciaDetalle provincia={provincia} recorridos={recorridosProvincia} pasesInfo={pasesInfo} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
