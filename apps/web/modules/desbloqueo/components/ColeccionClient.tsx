"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getOrigenStyle } from "@/lib/origen-styles";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import type { PersonajeLite } from "./DesbloquearForm";

const ORIGEN_ORDER = ["prehispanico", "colonial", "mestizo", "mixto"] as const;

export function ColeccionClient({ personajes }: { personajes: PersonajeLite[] }) {
  const t = useTranslations("coleccion");
  const tl = useTranslations("logros");
  const tc = useTranslations("comun");
  const { ready, coleccion, has, session, signOut } = useColeccion();

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

      {/* Progreso */}
      <div className="mb-12">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm text-stone-300">{t("progreso", { n: unlockedCount, total })}</p>
          <span className="font-serif text-2xl font-bold text-acento-dorado">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-800">
          <motion.div
            className="h-full rounded-full bg-acento-dorado"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
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

      {/* Logros */}
      {!empty && (origenes.length > 0 || fullCollection) && (
        <div className="mb-12">
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.3em] text-stone-500">{t("logros_titulo")}</h2>
          <div className="flex flex-wrap gap-3">
            {origenes.map(({ origen, total: ot, got, earned }) => {
              const style = getOrigenStyle(origen);
              return (
                <div
                  key={origen}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    borderColor: earned ? `${style.accentColor}66` : "var(--borde-sutil, #2A2724)",
                    backgroundColor: earned ? `${style.accentColor}14` : "transparent",
                    opacity: earned ? 1 : 0.6,
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: earned ? style.accentColor : undefined }}
                  >
                    {earned
                      ? tl("origen_completo", { origen: tc(`origen.${origen}`) })
                      : tl("progreso_origen", { n: got, total: ot, origen: tc(`origen.${origen}`) })}
                  </p>
                  {earned && (
                    <p className="mt-0.5 text-xs text-stone-400">
                      {tl("origen_completo_desc", { origen: tc(`origen.${origen}`) })}
                    </p>
                  )}
                </div>
              );
            })}
            {fullCollection && (
              <div className="rounded-xl border border-acento-dorado/60 bg-acento-dorado/10 px-4 py-3">
                <p className="text-sm font-semibold text-acento-dorado">{tl("coleccion_completa")}</p>
                <p className="mt-0.5 text-xs text-stone-400">{tl("coleccion_completa_desc")}</p>
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
              className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-borde-sutil bg-stone-950/60 p-3 text-center"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24" className="text-stone-600" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-xs font-medium text-stone-500">{t("bloqueado")}</p>
              <p className="text-[11px] leading-tight text-stone-700">{t("bloqueado_hint")}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
