"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { TipoOrigen } from "@seres-del-pase/types";
import { Link } from "@/i18n/navigation";
import { useDesbloqueo } from "@/components/auth/ColeccionProvider";
import { ParallaxHero } from "./ParallaxHero";
import { HeroDespertar } from "./HeroDespertar";

interface HeroGatedProps {
  slug: string;
  experiencia?: boolean | undefined;
  nombre: string;
  nombreKichwa?: string | undefined;
  nombresAlt: string[];
  origen?: TipoOrigen | undefined;
  imagen?: { url: string; altText: string } | undefined;
  imagenBanner?: { url: string; altText: string } | undefined;
  origenLabel: string;
  accentColor: string;
  audioAmbiente?: string | undefined;
}

/**
 * Decide el hero de la ficha según el estado de desbloqueo del usuario:
 *  - Sin experiencia v2 → ParallaxHero (igual que siempre).
 *  - Con experiencia v2 y desbloqueado (o backend apagado) → HeroDespertar (premio).
 *  - Con experiencia v2 y bloqueado → ParallaxHero (teaser) + CTA a /desbloquear/[slug].
 * El teaser también se muestra antes de resolver el estado, para no parpadear ni
 * romper la hidratación.
 */
export function HeroGated(props: HeroGatedProps) {
  const t = useTranslations("desbloquear");
  const { slug, experiencia, audioAmbiente, ...heroProps } = props;
  const { resolved, unlocked, gatingActive } = useDesbloqueo(slug);

  // Personajes sin experiencia v2: hero clásico, sin candado.
  if (!experiencia) return <ParallaxHero {...heroProps} />;

  // Desbloqueado (o sin backend): experiencia inmersiva completa.
  if (resolved && unlocked) {
    return <HeroDespertar {...heroProps} audioAmbiente={audioAmbiente} />;
  }

  // Bloqueado (o aún sin resolver): teaser + CTA solo cuando ya sabemos que está bloqueado.
  const showCta = resolved && gatingActive && !unlocked;
  return (
    <>
      <ParallaxHero {...heroProps} />
      {showCta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto -mt-6 max-w-3xl px-5 sm:px-6"
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left"
            style={{
              borderColor: `${props.accentColor}33`,
              backgroundColor: `${props.accentColor}0D`,
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
                style={{ backgroundColor: `${props.accentColor}22`, color: props.accentColor }}
                aria-hidden="true"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <div>
                <p className="font-serif text-lg font-semibold text-texto-claro">
                  {t("ficha_titulo", { nombre: props.nombre })}
                </p>
                <p className="text-sm text-stone-400">{t("ficha_texto")}</p>
              </div>
            </div>
            <Link
              href={{ pathname: "/desbloquear/[slug]", params: { slug } }}
              className="flex-none rounded-full px-5 py-2.5 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: props.accentColor }}
            >
              {t("ficha_boton")}
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
}
