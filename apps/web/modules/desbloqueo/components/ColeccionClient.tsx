"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getOrigenStyle } from "@/lib/origen-styles";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { CertificadoColeccion, type CertificadoLogro } from "./CertificadoColeccion";
import type { PersonajeLite } from "./DesbloquearForm";

const ORIGEN_ORDER = ["prehispanico", "colonial", "mestizo", "mixto"] as const;

export function ColeccionClient({ personajes }: { personajes: PersonajeLite[] }) {
  const t = useTranslations("coleccion");
  const tl = useTranslations("logros");
  const tc = useTranslations("comun");
  const { ready, coleccion, has, session, signOut } = useColeccion();
  const [certificado, setCertificado] = useState<CertificadoLogro | null>(null);

  const total = personajes.length;
  const unlockedCount = personajes.filter((p) => has(p.slug)).length;

  // Logros derivados: completar cada origen presente + colección completa.
  const origenes = ORIGEN_ORDER.filter((o) => personajes.some((p) => p.origen === o)).map((o) => {
    const grupo = personajes.filter((p) => p.origen === o);
    const got = grupo.filter((p) => has(p.slug)).length;
    return { origen: o, total: grupo.length, got, earned: got === grupo.length };
  });
  const fullCollection = unlockedCount === total && total > 0;

  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  // Evita parpadeo: hasta resolver, no afirmamos "vacío".
  const empty = ready && unlockedCount === 0;

  function abrirCertificadoOrigen(origen: (typeof origenes)[number]) {
    const style = getOrigenStyle(origen.origen);
    const grupo = personajes.filter((p) => p.origen === origen.origen && has(p.slug));
    setCertificado({
      tipo: "origen",
      origen: origen.origen,
      titulo: tl("origen_completo", { origen: style.label }),
      descripcion: tl("origen_completo_desc", { origen: style.label }),
      personajes: grupo.map((p) => ({ nombre: p.nombre, imagenPortada: p.imagenPortada })),
    });
  }

  function abrirCertificadoColeccion() {
    setCertificado({
      tipo: "coleccion",
      titulo: tl("coleccion_completa"),
      descripcion: tl("coleccion_completa_desc", { total }),
      personajes: personajes.map((p) => ({ nombre: p.nombre, imagenPortada: p.imagenPortada })),
    });
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{t("titulo")}</h1>
          <p className="mt-2 text-stone-400">{t("subtitulo")}</p>
        </div>
        {session?.user?.email && (
          <div className="text-right">
            <p className="text-xs text-stone-600">{t("sesion_iniciada", { email: session.user.email })}</p>
            <button
              onClick={() => signOut()}
              className="mt-1 text-xs font-medium text-stone-400 underline-offset-2 hover:text-texto-claro hover:underline"
            >
              {t("cerrar_sesion")}
            </button>
          </div>
        )}
      </div>

      {/* Progreso global */}
      <div className="mb-12">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm text-stone-300">
            {fullCollection ? t("progreso_completo") : t("progreso", { n: unlockedCount, total })}
          </p>
          <span
            className={`font-serif text-2xl font-bold ${fullCollection ? "" : "text-acento-dorado"}`}
            style={fullCollection ? { color: "#F0D98A" } : undefined}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-800">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: fullCollection
                ? "linear-gradient(90deg,#C89B3C,#F0D98A,#C89B3C)"
                : "#C89B3C",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {fullCollection && (
          <button
            type="button"
            onClick={abrirCertificadoColeccion}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-acento-dorado/50 bg-acento-dorado/10 px-4 py-2 text-xs font-semibold text-acento-dorado transition-colors hover:bg-acento-dorado/20"
          >
            {t("ver_certificado")}
          </button>
        )}
      </div>

      {/* Estado vacío */}
      {empty && (
        <div className="mb-12 rounded-2xl border border-borde-sutil bg-stone-900/40 px-6 py-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-texto-claro">{t("vacio_titulo")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-stone-400">{t("vacio_texto")}</p>
          <Link
            href="/personajes"
            className="mt-6 inline-block rounded-full bg-acento-dorado px-6 py-3 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.02]"
          >
            {t("desbloquear_cta")}
          </Link>
        </div>
      )}

      {/* Progreso por origen — siempre visible, muestra todas las metas disponibles */}
      {!empty && origenes.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.3em] text-stone-500">
            {t("progreso_origen_titulo")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {origenes.map(({ origen, total: ot, got, earned }) => {
              const style = getOrigenStyle(origen);
              const originPct = ot > 0 ? Math.round((got / ot) * 100) : 0;
              return (
                <div
                  key={origen}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    borderColor: earned ? `${style.accentColor}66` : "var(--borde-sutil, #2A2724)",
                    backgroundColor: earned ? `${style.accentColor}14` : "transparent",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: earned ? style.accentColor : undefined }}
                    >
                      {tc(`origen.${origen}`)}
                    </span>
                    {earned ? (
                      <span className="text-xs font-medium" style={{ color: style.accentColor }}>
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs text-stone-500">
                        {got}/{ot}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-800">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: style.accentColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${originPct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logros — vitrina de lo ya ganado, con acceso al certificado */}
      {!empty && (origenes.some((o) => o.earned) || fullCollection) && (
        <div className="mb-12">
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.3em] text-stone-500">{t("logros_titulo")}</h2>
          <div className="flex flex-wrap gap-3">
            {origenes
              .filter((o) => o.earned)
              .map((o) => {
                const style = getOrigenStyle(o.origen);
                return (
                  <div
                    key={o.origen}
                    className="rounded-xl border px-4 py-3"
                    style={{
                      borderColor: `${style.accentColor}66`,
                      backgroundColor: `${style.accentColor}14`,
                      boxShadow: `0 0 24px -8px ${style.accentColor}55`,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: style.accentColor }}>
                      {tl("origen_completo", { origen: tc(`origen.${o.origen}`) })}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {tl("origen_completo_desc", { origen: tc(`origen.${o.origen}`) })}
                    </p>
                    <button
                      type="button"
                      onClick={() => abrirCertificadoOrigen(o)}
                      className="mt-2 text-xs font-medium underline underline-offset-2"
                      style={{ color: style.accentColor }}
                    >
                      {t("ver_certificado")}
                    </button>
                  </div>
                );
              })}
            {fullCollection && (
              <div
                className="rounded-xl border border-acento-dorado/60 bg-acento-dorado/10 px-4 py-3"
                style={{ boxShadow: "0 0 24px -8px #C89B3C55" }}
              >
                <p className="text-sm font-semibold text-acento-dorado">{tl("coleccion_completa")}</p>
                <p className="mt-0.5 text-xs text-stone-400">{tl("coleccion_completa_desc", { total })}</p>
                <button
                  type="button"
                  onClick={abrirCertificadoColeccion}
                  className="mt-2 text-xs font-medium text-acento-dorado underline underline-offset-2"
                >
                  {t("ver_certificado")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid de personajes */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {personajes.map((p) => {
          const unlocked = has(p.slug);
          const style = getOrigenStyle(p.origen ?? undefined);
          if (unlocked) {
            return (
              <Link
                key={p.slug}
                href={{ pathname: "/personajes/[slug]", params: { slug: p.slug } }}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-borde-sutil"
              >
                {p.imagenPortada ? (
                  <Image
                    src={p.imagenPortada}
                    alt={p.nombre}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: style.bgVia }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-serif text-base font-bold text-white">{p.nombre}</h3>
                </div>
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: style.accentColor }}
                />
              </Link>
            );
          }
          return (
            <div
              key={p.slug}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
              style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}
            >
              <OrigenPlaceholder
                origen={p.origen ?? undefined}
                nombre={p.nombre}
                variant="card"
                uid={p.slug}
                className="absolute inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/10 to-transparent" />

              <span
                className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-stone-950/70 px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                style={{ color: style.accentColor }}
              >
                {style.label}
              </span>

              <span className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-stone-950/70 backdrop-blur-sm">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-stone-400" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>

              <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                {p.nombreKichwa && (
                  <p className="font-serif text-xs italic" style={{ color: `${style.accentColor}bb` }}>
                    {p.nombreKichwa}
                  </p>
                )}
                <h3 className="mt-0.5 font-serif text-base font-bold text-white">{p.nombre}</h3>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-stone-500">{t("bloqueado")}</p>
                <Link
                  href={{ pathname: "/desbloquear/[slug]", params: { slug: p.slug } }}
                  className="mt-2 inline-block rounded-full border border-acento-dorado/60 bg-stone-950/80 px-3 py-1 text-[11px] font-medium text-acento-dorado backdrop-blur-sm transition-colors hover:bg-acento-dorado hover:text-fondo-oscuro"
                >
                  {t("desbloquear_cta")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {certificado && (
          <CertificadoColeccion logro={certificado} onClose={() => setCertificado(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
