"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Hotspot } from "@seres-del-pase/types";

interface AnatomiaSectionProps {
  slug: string;
  imagen: { url: string; altText: string };
  hotspots: Hotspot[];
  accentColor: string;
  nombre: string;
  /** Modo compuesto: sin el <section>/borde propio (se inserta dentro de otra sección). */
  embedded?: boolean;
}

/** Lee el progreso de descubrimiento guardado del localStorage (client-only). */
function loadVisited(slug: string, total: number): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(`nunna:anatomia:${slug}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(arr.filter((n) => Number.isInteger(n) && n >= 0 && n < total));
  } catch {
    return new Set();
  }
}

const EASE = [0.22, 1, 0.36, 1] as const;
/** Distancia mínima (px) del gesto horizontal para pasar de elemento. */
const UMBRAL_SWIPE = 50;

/**
 * "Anatomía": diagrama del personaje por pasos. Un elemento a la vez — sin scroll
 * vertical: se pasa con las flechas ‹ ›, deslizando la tarjeta (móvil), con los
 * pines de la foto o con los chips. Paso -1 = el personaje completo (al entrar y al
 * terminar). La "cámara" hace zoom hacia el elemento activo y un spotlight lo
 * ilumina; la tarjeta trae un close-up (recorte ampliado de la misma foto). Las
 * tarjetas se apilan en la misma celda de grid → la sección mide lo que la más
 * alta y no salta al cambiar. Progreso en localStorage. Respeta reduced-motion.
 */
export function AnatomiaSection({ slug, imagen, hotspots, accentColor, nombre, embedded = false }: AnatomiaSectionProps) {
  const reduced = useReducedMotion();
  const t = useTranslations("anatomia");
  const total = hotspots.length;
  // -1 = ningún elemento: se ve el personaje completo.
  const [activeIdx, setActiveIdx] = useState(-1);
  // Sentido del último cambio (1 avanza, -1 retrocede) para la dirección de la transición.
  const [sentido, setSentido] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [aspecto, setAspecto] = useState(0.62);
  const chipsRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arranca vacío (SSR-safe) y se hidrata desde localStorage; se re-sincroniza si
  // cambia el personaje sin desmontar. Va ANTES del efecto que marca visitados.
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    setVisited(loadVisited(slug, total));
    setActiveIdx(-1);
  }, [slug, total]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const irA = useCallback(
    (i: number) => {
      const destino = Math.max(-1, Math.min(total - 1, i));
      setActiveIdx((actual) => {
        if (destino !== actual) setSentido(destino > actual ? 1 : -1);
        return destino;
      });
    },
    [total],
  );
  const siguiente = () => (activeIdx >= total - 1 ? irA(-1) : irA(activeIdx + 1));
  const anterior = () => irA(activeIdx - 1);

  // Chip activo visible dentro de su fila (scroll horizontal del contenedor, nunca
  // de la ventana — scrollIntoView movería la página).
  useEffect(() => {
    const fila = chipsRef.current;
    const chip = chipRefs.current[activeIdx];
    if (!fila || !chip || fila.scrollWidth <= fila.clientWidth) return;
    fila.scrollTo({
      left: chip.offsetLeft - (fila.clientWidth - chip.clientWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeIdx, reduced]);

  // Descubrimiento: marca el elemento activo como visitado y persiste el progreso.
  useEffect(() => {
    if (activeIdx < 0) return;
    setVisited((prev) => {
      if (prev.has(activeIdx)) return prev;
      const next = new Set(prev).add(activeIdx);
      try {
        window.localStorage.setItem(`nunna:anatomia:${slug}`, JSON.stringify([...next]));
      } catch {
        // localStorage puede fallar en modo privado — el progreso simplemente no persiste
      }
      return next;
    });
  }, [activeIdx, slug]);

  const onSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x <= -UMBRAL_SWIPE) siguiente();
    else if (info.offset.x >= UMBRAL_SWIPE && activeIdx > -1) anterior();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      siguiente();
    } else if (e.key === "ArrowLeft" && activeIdx > -1) {
      e.preventDefault();
      anterior();
    }
  };

  const activo = hotspots[activeIdx];
  // Cámara: zoom hacia el elemento activo, que queda al centro del escenario.
  const zoom = reduced || !activo ? 1 : isMobile ? 1.7 : 1.8;
  // Desplazamiento (en % del escenario) para centrar el elemento, limitado para
  // que la foto siga cubriendo el marco y no aparezcan bordes vacíos.
  const limite = (zoom - 1) * 50;
  const mover = (p: number) => Math.max(-limite, Math.min(limite, (50 - p) * zoom));
  const tx = reduced ? 0 : mover(activo?.x ?? 50);
  const ty = reduced ? 0 : mover(activo?.y ?? 50);
  /** Posición en pantalla de un punto de la foto, con la cámara aplicada. */
  const enPantalla = (p: number, d: number) => 50 + zoom * (p - 50) + d;
  const Wrapper = embedded ? "div" : "section";
  const enUltimo = activeIdx === total - 1;

  /** Contenido de una tarjeta: -1 = el personaje completo, i = elemento i. */
  const contenido = (i: number) => {
    const h = hotspots[i];
    if (!h) {
      return (
        <>
          <span className="font-sans text-xs font-medium tracking-wide" style={{ color: accentColor }}>
            {t("inicio_kicker")}
          </span>
          <h3 className="mt-1 font-display text-[clamp(1.5rem,4.5vw,2.5rem)] leading-[1.05] text-texto-claro">
            {nombre}
          </h3>
          <div className="mt-4 h-px w-10 sm:mt-5" style={{ backgroundColor: accentColor }} />
          <p className="mt-4 text-base leading-relaxed text-stone-300 sm:mt-5 sm:text-lg">
            {t("inicio_texto", { nombre, total })}
          </p>
        </>
      );
    }
    return (
      <>
        <div className="flex items-center gap-4 sm:items-start sm:gap-5">
          {/* Lupa: recorte ampliado de la misma foto, centrado en el elemento */}
          <div
            aria-hidden="true"
            className="h-[60px] w-[60px] flex-none overflow-hidden rounded-full border-2 bg-stone-900 sm:h-[88px] sm:w-[88px]"
            style={{
              borderColor: `${accentColor}70`,
              backgroundImage: `url(${imagen.url})`,
              backgroundSize: "420%",
              backgroundPosition: `${h.x}% ${h.y}%`,
              boxShadow: `0 0 0 4px ${accentColor}15`,
            }}
          />
          <div className="min-w-0">
            <span className="font-sans text-xs font-medium tracking-wide" style={{ color: accentColor }}>
              {t("contador", { n: i + 1, total })}
            </span>
            <h3 className="mt-1 font-display text-[clamp(1.5rem,4.5vw,2.5rem)] leading-[1.05] text-texto-claro">
              {h.titulo}
            </h3>
          </div>
        </div>
        <div className="mt-4 h-px w-10 sm:mt-5" style={{ backgroundColor: accentColor }} />
        <p className="mt-4 text-base leading-relaxed text-stone-300 sm:mt-5 sm:text-lg">{h.cuerpo}</p>
        {(h.material || h.artesano) && (
          <dl className="mt-5 space-y-3 border-t border-borde-sutil pt-4 sm:mt-6 sm:space-y-4 sm:pt-5">
            {h.material && (
              <div>
                <dt className="text-[10px] uppercase tracking-[0.22em] text-stone-500">{t("material")}</dt>
                <dd className="mt-1 text-sm text-stone-300">{h.material}</dd>
              </div>
            )}
            {h.artesano && (
              <div>
                <dt className="text-[10px] uppercase tracking-[0.22em] text-stone-500">{t("artesano")}</dt>
                <dd className="mt-1 text-sm italic text-stone-400">{h.artesano}</dd>
              </div>
            )}
          </dl>
        )}
      </>
    );
  };

  const puntos = (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {hotspots.map((h, i) => (
        <span
          key={h.id}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === activeIdx ? 20 : 6,
            backgroundColor: i === activeIdx || visited.has(i) ? accentColor : "rgb(var(--borde-sutil))",
            opacity: i === activeIdx ? 1 : visited.has(i) ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );

  const etiquetaSiguiente = activeIdx === -1 ? t("empezar") : enUltimo ? t("ver_completo") : t("siguiente");

  return (
    <Wrapper className={embedded ? "" : "border-t border-borde-sutil py-16 sm:py-24"}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        {/* Encabezado */}
        <div className="mb-8 sm:mb-12">
          <span className="block text-[11px] uppercase tracking-[0.32em]" style={{ color: accentColor }}>
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] text-texto-claro">
            {t("titulo")}
          </h2>
          <p className="mt-3 text-base text-stone-400">{t("hint")}</p>
          <div className="mt-3 flex items-center gap-2.5">
            <ProgressRing value={visited.size} total={total} accentColor={accentColor} />
            <p className="text-sm text-stone-400">{t("descubiertos", { n: visited.size, total })}</p>
          </div>
        </div>

        <div
          className="lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12"
          role="group"
          aria-roledescription="carrusel"
          aria-label={t("eyebrow")}
          onKeyDown={onKeyDown}
        >
          {/* ── Visual con pines ── */}
          <div>
            <div className="relative mx-auto flex h-[36vh] w-full items-center justify-center sm:h-[42vh] lg:h-[60vh]">
              {/* Móvil: flechas a los lados de la foto — siempre a mano mientras se mira la figura */}
              <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2 lg:hidden">
                <BotonPaso onClick={anterior} disabled={activeIdx === -1} etiqueta={t("anterior")} accentColor={accentColor}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                </BotonPaso>
              </div>
              <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2 lg:hidden">
                <BotonPaso onClick={siguiente} etiqueta={etiquetaSiguiente} accentColor={accentColor} lleno pulso={activeIdx === -1}>
                  {enUltimo ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                  )}
                </BotonPaso>
              </div>
              {/* Escenario con la proporción exacta de la foto: así los % de los pines
                  caen sobre la figura (con object-contain en otra caja no cuadraban). */}
              <div
                className="relative h-full max-w-full overflow-hidden rounded-2xl"
                style={{ aspectRatio: `${aspecto}` }}
              >
                {/* Cámara: acerca y centra el elemento activo */}
                <motion.div
                  className="absolute inset-0"
                  style={{ transformOrigin: "50% 50%" }}
                  animate={{ scale: zoom, x: `${tx}%`, y: `${ty}%` }}
                  transition={{ duration: reduced ? 0 : 0.9, ease: EASE }}
                >
                  <Image
                    src={imagen.url}
                    alt={imagen.altText}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 80vw, 45vw"
                    priority
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) setAspecto(img.naturalWidth / img.naturalHeight);
                    }}
                  />
                </motion.div>

                {/* Spotlight: sigue al elemento activo en pantalla */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  animate={{
                    opacity: activo ? 1 : 0,
                    background: `radial-gradient(circle at ${enPantalla(activo?.x ?? 50, tx)}% ${enPantalla(activo?.y ?? 50, ty)}%, rgba(15,14,12,0) 0%, rgba(15,14,12,0) 26%, rgba(15,14,12,0.55) 70%)`,
                  }}
                  transition={{ duration: reduced ? 0 : 0.9, ease: EASE }}
                />

                {/* Pines: fuera de la cámara para que no crezcan con el zoom. */}
                {hotspots.map((h, i) => {
                  const isActive = i === activeIdx;
                  const isVisited = visited.has(i);
                  return (
                    <motion.button
                      key={h.id}
                      type="button"
                      onClick={() => irA(i)}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      initial={false}
                      animate={{ left: `${enPantalla(h.x, tx)}%`, top: `${enPantalla(h.y, ty)}%` }}
                      transition={{ duration: reduced ? 0 : 0.9, ease: EASE }}
                      aria-label={h.titulo}
                      aria-current={isActive}
                    >
                      {isActive &&
                        !reduced &&
                        [0, 0.6].map((delay) => (
                          <motion.span
                            key={delay}
                            className="absolute inset-2 rounded-full"
                            style={{ border: `2px solid ${accentColor}` }}
                            animate={{ scale: [1, 2.4], opacity: [0.9, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay }}
                          />
                        ))}
                      <span
                        className="relative flex items-center justify-center rounded-full border-2 border-white font-sans font-bold shadow-[0_0_0_3px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.6)] transition-all duration-300"
                        style={{
                          width: isActive ? 32 : 24,
                          height: isActive ? 32 : 24,
                          fontSize: isActive ? 13 : 11,
                          backgroundColor: isActive || isVisited ? accentColor : "rgba(15,14,12,0.85)",
                          color: isActive || isVisited ? "#0F0E0C" : "white",
                          opacity: isActive ? 1 : 0.85,
                        }}
                      >
                        {isVisited && !isActive ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F0E0C" strokeWidth={3} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex justify-center lg:hidden">{puntos}</div>

            {/* Chips de elementos — fila con scroll horizontal en móvil */}
            <div
              ref={chipsRef}
              className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-5 lg:flex-wrap lg:justify-center lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
            >
              {hotspots.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  onClick={() => irA(i)}
                  aria-current={i === activeIdx}
                  className="flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] transition-colors"
                  style={{
                    borderColor: i === activeIdx ? `${accentColor}60` : "rgb(var(--borde-sutil))",
                    color: i === activeIdx ? accentColor : "rgb(var(--stone-500))",
                    backgroundColor: i === activeIdx ? `${accentColor}12` : "transparent",
                  }}
                >
                  {visited.has(i) && i !== activeIdx && <span aria-hidden="true">✓ </span>}
                  {h.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tarjeta del elemento + navegación ── */}
          <div className="mt-4 lg:mt-0">
            <motion.div
              drag={reduced ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              dragSnapToOrigin
              onDragEnd={onSwipe}
              className="relative grid touch-pan-y overflow-hidden rounded-2xl border border-borde-sutil bg-fondo-oscuro/60"
              aria-live="polite"
            >
              {/* Molde invisible: todas las tarjetas en la misma celda → alto de la más alta, sin saltos */}
              {[-1, ...hotspots.map((_, i) => i)].map((i) => (
                <div key={`molde-${i}`} aria-hidden="true" className="invisible col-start-1 row-start-1 p-5 sm:p-7">
                  {contenido(i)}
                </div>
              ))}
              <AnimatePresence initial={false} custom={sentido}>
                <motion.div
                  key={activeIdx}
                  custom={sentido}
                  variants={{
                    entra: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * 40 }),
                    centro: { opacity: 1, x: 0 },
                    sale: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * -40 }),
                  }}
                  initial="entra"
                  animate="centro"
                  exit="sale"
                  transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
                  className="col-start-1 row-start-1 p-5 sm:p-7"
                >
                  {contenido(activeIdx)}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Escritorio: ‹ · puntos · › bajo la tarjeta */}
            <div className="mt-4 hidden items-center justify-between gap-3 lg:flex">
              <BotonPaso onClick={anterior} disabled={activeIdx === -1} etiqueta={t("anterior")} accentColor={accentColor}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
              </BotonPaso>
              {puntos}
              {activeIdx === -1 || enUltimo ? (
                <button
                  type="button"
                  onClick={siguiente}
                  className="flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.03]"
                  style={{ backgroundColor: accentColor }}
                >
                  {etiquetaSiguiente}
                  {activeIdx === -1 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              ) : (
                <BotonPaso onClick={siguiente} etiqueta={etiquetaSiguiente} accentColor={accentColor} lleno>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </BotonPaso>
              )}
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

function BotonPaso({
  onClick,
  disabled = false,
  etiqueta,
  accentColor,
  lleno = false,
  pulso = false,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  etiqueta: string;
  accentColor: string;
  lleno?: boolean;
  /** Halo que late para invitar a empezar. */
  pulso?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border bg-fondo-oscuro/70 backdrop-blur-sm transition-all hover:scale-[1.05] disabled:pointer-events-none disabled:opacity-30 ${pulso ? "motion-safe:animate-pulse" : ""}`}
      style={
        lleno
          ? { backgroundColor: accentColor, borderColor: accentColor, color: "#0F0E0C" }
          : { borderColor: "rgb(var(--borde-sutil))", color: "rgb(var(--stone-300))" }
      }
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

/** Anillo de progreso — n de total elementos descubiertos. */
function ProgressRing({ value, total, accentColor }: { value: number; total: number; accentColor: string }) {
  const reduced = useReducedMotion();
  const r = 9;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? value / total : 0;

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r={r} fill="none" stroke="#2A2724" strokeWidth="2.5" />
      <motion.circle
        cx="11"
        cy="11"
        r={r}
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        transform="rotate(-90 11 11)"
        initial={false}
        animate={{ strokeDashoffset: c * (1 - frac) }}
        transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}
