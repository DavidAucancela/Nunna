"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
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

/**
 * "Anatomía": diagrama interactivo del personaje — el corazón del premio de
 * desbloquear el imán. Visual sticky con pines numerados; al desplazarse, cada
 * elemento se activa en secuencia (IntersectionObserver, robusto en iOS). En
 * escritorio los pines son clicables (saltan a su bloque); en móvil la
 * secuencia avanza con el scroll. Cada card trae un close-up del elemento
 * (recorte ampliado de la misma foto) y un spotlight ilumina la figura en el
 * punto activo. El progreso de descubrimiento se guarda en localStorage y al
 * completar todos los elementos se revela un sello final. Respeta reduced-motion.
 */
export function AnatomiaSection({ slug, imagen, hotspots, accentColor, nombre, embedded = false }: AnatomiaSectionProps) {
  const reduced = useReducedMotion();
  const t = useTranslations("anatomia");
  // -1 = ningún elemento: se ve el personaje completo (al entrar y al terminar).
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [aspecto, setAspecto] = useState(0.62);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arranca vacío en ambos entornos (SSR-safe) — se hidrata desde localStorage
  // en un efecto más abajo. Necesario porque este componente SÍ puede
  // server-renderizarse cuando el gating está apagado (useDesbloqueo resuelve
  // `resolved=true` de inmediato si no hay Supabase configurado), así que leer
  // localStorage en el inicializador de useState causaría mismatch de hidratación.
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  // Carga el progreso guardado (client-only) y se re-sincroniza si el usuario
  // navega de un personaje a otro sin que el componente llegue a desmontarse
  // (el `slug` cambiaría de prop pero el estado `visited` seguiría siendo el
  // del personaje anterior sin este efecto). Debe declararse ANTES del efecto
  // que marca `activeIdx` como visitado: React corre los efectos de un mismo
  // commit en orden de declaración, así que este `setVisited(loaded)`
  // (reemplazo completo) se aplica antes que el `setVisited(prev => ...)`
  // (suma funcional) del siguiente efecto — sin perder el elemento activo.
  useEffect(() => {
    setVisited(loadVisited(slug, hotspots.length));
  }, [slug, hotspots.length]);

  // En el layout apilado (<lg) el visual va sticky arriba; en escritorio es de 2 columnas.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Activación secuencial: una línea del viewport decide qué bloque está activo.
  // Antes del primero o después del último no hay ninguno → personaje completo.
  // En móvil la línea va más abajo (≈66%) para que el texto activo caiga DEBAJO
  // del visual sticky.
  useEffect(() => {
    const onScroll = () => {
      const linea = window.innerHeight * (isMobile ? 0.66 : 0.5);
      let idx = -1;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= linea && r.bottom > linea) idx = i;
      });
      setActiveIdx(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [hotspots.length, isMobile]);

  // En móvil, mantener visible el chip activo dentro del mini-nav de scroll
  // horizontal — pero no en el mount inicial: si el usuario aún no llegó a esta
  // sección (vive muy por debajo del fold), `scrollIntoView({block:"nearest"})`
  // secuestraría el scroll de toda la ventana para revelar el chip.
  const chipScrollArmado = useRef(false);
  useEffect(() => {
    if (!isMobile || activeIdx < 0) return;
    if (!chipScrollArmado.current) {
      chipScrollArmado.current = true;
      return;
    }
    chipRefs.current[activeIdx]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIdx, isMobile, reduced]);

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

  function goTo(i: number) {
    stepRefs.current[i]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
  }

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
  const enPantalla = (p: number, t: number) => 50 + zoom * (p - 50) + t;
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "border-t border-borde-sutil py-16 sm:py-24"}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        {/* Encabezado */}
        <div className="mb-10 sm:mb-14">
          <span className="block text-[11px] uppercase tracking-[0.32em]" style={{ color: accentColor }}>
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] text-texto-claro">
            {t("titulo")}
          </h2>
          <p className="mt-3 text-base text-stone-400">{t("hint")}</p>
          <div className="mt-3 flex items-center gap-2.5">
            <ProgressRing value={visited.size} total={hotspots.length} accentColor={accentColor} />
            <p className="text-sm text-stone-400">
              {t("descubiertos", { n: visited.size, total: hotspots.length })}
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          {/* ── Visual sticky con pines ── */}
          <div className="sticky top-16 z-10 -mx-5 mb-2 self-start bg-fondo-oscuro px-5 pb-4 pt-2 sm:mx-0 sm:px-0 lg:top-24 lg:bg-transparent lg:pb-0">
            <div className="relative mx-auto flex h-[38vh] w-full justify-center sm:h-[40vh] lg:h-[56vh]">
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
                  animate={{
                    scale: zoom,
                    x: `${tx}%`,
                    y: `${ty}%`,
                  }}
                  transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
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
                  transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Pines: fuera de la cámara para que no crezcan con el zoom; su posición
                    en pantalla = 50 + zoom·(p − activo). */}
                {hotspots.map((h, i) => {
                  const isActive = i === activeIdx;
                  const isVisited = visited.has(i);
                  return (
                    <motion.button
                      key={h.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      initial={false}
                      animate={{
                        left: `${enPantalla(h.x, tx)}%`,
                        top: `${enPantalla(h.y, ty)}%`,
                      }}
                      transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                      aria-label={h.titulo}
                      aria-current={isActive}
                    >
                      {isActive && !reduced &&
                        [0, 0.6].map((delay) => (
                          <motion.span
                            key={delay}
                            className="absolute inset-0 rounded-full"
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
                          backgroundColor: isActive ? accentColor : isVisited ? `${accentColor}` : "rgba(15,14,12,0.85)",
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

              {/* Degradado inferior — evita que el texto se transluzca bajo el sticky en móvil */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -bottom-4 h-8 bg-gradient-to-b from-transparent to-fondo-oscuro lg:hidden"
              />
            </div>

            {/* Mini-nav de elementos (debajo del visual) — fila con scroll en móvil */}
            <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-5 lg:flex-wrap lg:justify-center lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {hotspots.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  onClick={() => goTo(i)}
                  className="flex-none snap-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] transition-colors"
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

          {/* ── Bloques de texto (uno por elemento) ── */}
          <div>
            {hotspots.map((h, i) => (
              <div
                key={h.id}
                data-idx={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex min-h-[42vh] flex-col justify-center py-5 sm:py-6 lg:min-h-[56vh]"
              >
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  animate={{ opacity: i === activeIdx ? 1 : 0.4 }}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Lupa: recorte ampliado de la misma foto, centrado en el elemento */}
                    <motion.div
                      aria-hidden="true"
                      initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="h-[68px] w-[68px] flex-none overflow-hidden rounded-full border-2 bg-stone-900 sm:h-[92px] sm:w-[92px]"
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
                        {t("contador", { n: i + 1, total: hotspots.length })}
                      </span>
                      <h3 className="mt-1 font-display text-[clamp(1.6rem,4.5vw,2.5rem)] leading-[1.05] text-texto-claro">
                        {h.titulo}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 h-px w-10" style={{ backgroundColor: accentColor }} />
                  <p className="mt-5 text-base leading-relaxed text-stone-300 sm:text-lg">{h.cuerpo}</p>

                  {(h.material || h.artesano) && (
                    <dl className="mt-7 space-y-4 border-t border-borde-sutil pt-6">
                      {h.material && (
                        <div>
                          <dt
                            className="text-[10px] uppercase tracking-[0.22em] text-stone-500"
                          >
                            {t("material")}
                          </dt>
                          <dd className="mt-1 text-sm text-stone-300">{h.material}</dd>
                        </div>
                      )}
                      {h.artesano && (
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                            {t("artesano")}
                          </dt>
                          <dd className="mt-1 text-sm italic text-stone-400">{h.artesano}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </motion.div>
              </div>
            ))}

            {/* Cierre: al pasar el último elemento la cámara vuelve al personaje completo */}
            <div aria-hidden="true" className="h-[12vh] lg:h-[50vh]" />
          </div>
        </div>
      </div>
    </Wrapper>
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
