"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Hotspot } from "@seres-del-pase/types";
import { useParticleCanvas } from "@/modules/personajes/hooks/useParticleCanvas";

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
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arranca vacío en ambos entornos (SSR-safe) — se hidrata desde localStorage
  // en un efecto más abajo. Necesario porque este componente SÍ puede
  // server-renderizarse cuando el gating está apagado (useDesbloqueo resuelve
  // `resolved=true` de inmediato si no hay Supabase configurado), así que leer
  // localStorage en el inicializador de useState causaría mismatch de hidratación.
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  const yaCompletoAlCargar = useRef(false);
  const [selloRevelado, setSelloRevelado] = useState(false);
  const { canvasRef: selloCanvasRef, converge: selloConverge } = useParticleCanvas({
    count: 24,
    color: accentColor,
    mode: "orbit",
    enabled: !selloRevelado,
  });

  // Carga el progreso guardado (client-only) y se re-sincroniza si el usuario
  // navega de un personaje a otro sin que el componente llegue a desmontarse
  // (el `slug` cambiaría de prop pero el estado `visited` seguiría siendo el
  // del personaje anterior sin este efecto). Debe declararse ANTES del efecto
  // que marca `activeIdx` como visitado: React corre los efectos de un mismo
  // commit en orden de declaración, así que este `setVisited(loaded)`
  // (reemplazo completo) se aplica antes que el `setVisited(prev => ...)`
  // (suma funcional) del siguiente efecto — sin perder el elemento activo.
  useEffect(() => {
    const loaded = loadVisited(slug, hotspots.length);
    const completo = hotspots.length > 0 && loaded.size >= hotspots.length;
    yaCompletoAlCargar.current = completo;
    setVisited(loaded);
    setSelloRevelado(completo);
  }, [slug, hotspots.length]);

  // En el layout apilado (<lg) el visual va sticky arriba; en escritorio es de 2 columnas.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Activación secuencial: una línea del viewport decide qué bloque (y por tanto qué
  // pin) está activo. Sin transforms ligados al scroll. En móvil la línea va más abajo
  // (≈66%) para que el texto activo caiga DEBAJO del visual sticky, no oculto tras él.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        }
      },
      {
        rootMargin: isMobile ? "-66% 0px -34% 0px" : "-50% 0px -50% 0px",
        threshold: 0,
      },
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [hotspots.length, isMobile]);

  // En móvil, mantener visible el chip activo dentro del mini-nav de scroll
  // horizontal — pero no en el mount inicial: si el usuario aún no llegó a esta
  // sección (vive muy por debajo del fold), `scrollIntoView({block:"nearest"})`
  // secuestraría el scroll de toda la ventana para revelar el chip.
  const chipScrollArmado = useRef(false);
  useEffect(() => {
    if (!isMobile) return;
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

  // Celebración del sello: se dispara UNA vez, solo si el usuario completa la
  // secuencia en esta sesión (si ya venía completo del localStorage, se muestra
  // directo sin animación — ver estado inicial de `selloRevelado`).
  useEffect(() => {
    if (yaCompletoAlCargar.current) return;
    if (hotspots.length === 0 || visited.size < hotspots.length) return;
    if (selloRevelado) return;
    yaCompletoAlCargar.current = true;
    if (reduced) {
      setSelloRevelado(true);
      return;
    }
    // Red de seguridad: si el canvas nunca llega a obtener contexto 2D (entorno
    // atípico) `converge()` jamás dispararía su callback y el sello quedaría
    // bloqueado para siempre. La celebración es un extra — nunca debe impedir
    // que el premio (el sello) se revele.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    selloConverge(() => {
      if (timeoutId) clearTimeout(timeoutId);
      setSelloRevelado(true);
    });
    timeoutId = setTimeout(() => setSelloRevelado(true), 1500);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visited, hotspots.length, reduced, selloConverge, selloRevelado]);

  function goTo(i: number) {
    stepRefs.current[i]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
  }

  const activo = hotspots[activeIdx];
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "border-t border-borde-sutil py-16 sm:py-24"}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        {/* Encabezado */}
        <div className="mb-10 sm:mb-14">
          <span className="block text-[10px] uppercase tracking-[0.32em]" style={{ color: accentColor }}>
            {t("eyebrow")}
          </span>
          <h2 className="mt-2 font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
            {t("titulo")}
          </h2>
          <p className="mt-2 text-sm text-stone-400">{t("hint")}</p>
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
            <div className="relative mx-auto h-[38vh] w-full max-w-[15rem] overflow-hidden sm:h-[40vh] sm:max-w-xs lg:h-[56vh] lg:max-w-none">
              {/* Zoom hacia el elemento activo: el conjunto imagen+pines escala con
                  origen en el pin, así el pin activo queda anclado en su sitio */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  scale: reduced ? 1 : 1.22,
                  transformOrigin: `${activo?.x ?? 50}% ${activo?.y ?? 50}%`,
                }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Image
                  src={imagen.url}
                  alt={imagen.altText}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 80vw, 45vw"
                  priority
                />

                {/* Spotlight: ilumina la figura en torno al elemento activo, atenúa el resto.
                    El div está sobredimensionado y su centro (transparente) se mueve al punto
                    activo — mismas coordenadas % que anclan el pin, así queda siempre alineado. */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    width: "260%",
                    height: "260%",
                    translateX: "-50%",
                    translateY: "-50%",
                    background:
                      "radial-gradient(circle, transparent 0%, transparent 20%, rgba(15,14,12,0.6) 46%, rgba(15,14,12,0.6) 100%)",
                  }}
                  animate={{ left: `${activo?.x ?? 50}%`, top: `${activo?.y ?? 50}%` }}
                  transition={{ duration: reduced ? 0 : 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />

                {/* Pines */}
                {hotspots.map((h, i) => {
                  const isActive = i === activeIdx;
                  const isVisited = visited.has(i);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-full"
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      aria-label={h.titulo}
                      aria-current={isActive}
                    >
                      {/* Onda sonora: refuerza cuál es el pin activo (visitado o no) */}
                      {isActive && !reduced &&
                        [0, 0.55, 1.1].map((delay) => (
                          <motion.span
                            key={delay}
                            className="absolute inset-0 rounded-full"
                            style={{ border: `1.5px solid ${accentColor}` }}
                            animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay }}
                          />
                        ))}
                      {!isActive && !isVisited && !reduced && (
                        <motion.span
                          className="absolute inset-0 rounded-full"
                          style={{ border: `1.5px solid ${accentColor}` }}
                          animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 0.4 }}
                        />
                      )}
                      <motion.span
                        className="relative flex items-center justify-center rounded-full border-2 font-sans text-[10px] font-bold"
                        style={{
                          width: isActive ? 26 : 20,
                          height: isActive ? 26 : 20,
                          backgroundColor: isActive || isVisited ? accentColor : `${accentColor}CC`,
                          borderColor: isActive ? "white" : isVisited ? accentColor : `${accentColor}80`,
                          color: isActive ? "#0F0E0C" : "transparent",
                          boxShadow: isActive ? `0 0 0 4px ${accentColor}30` : "none",
                        }}
                        animate={{ scale: isActive ? 1 : 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isActive ? (
                          i + 1
                        ) : isVisited ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0F0E0C" strokeWidth={3} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </motion.span>
                    </button>
                  );
                })}
              </motion.div>

              {/* Conector pin → card, solo escritorio: el pin activo no se mueve con el
                  zoom (es el origen de la transformación), así sus % coinciden siempre
                  con la posición real en pantalla. */}
              {!isMobile && (
                <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" aria-hidden="true">
                  <motion.line
                    key={`line-${activeIdx}`}
                    x1={`${activo?.x ?? 50}%`}
                    y1={`${activo?.y ?? 50}%`}
                    x2="100%"
                    y2={`${activo?.y ?? 50}%`}
                    stroke={accentColor}
                    strokeWidth="1.5"
                    strokeDasharray="3 4"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.55 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  />
                  <motion.circle
                    key={`dot-${activeIdx}`}
                    cx="100%"
                    cy={`${activo?.y ?? 50}%`}
                    r="3"
                    fill={accentColor}
                    initial={reduced ? false : { opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  />
                </svg>
              )}

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
                      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight text-texto-claro sm:text-3xl">
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

            {/* ── Sello final — el premio de recorrer toda la anatomía ── */}
            <div className="mt-4 border-t border-borde-sutil pt-10 sm:pt-14">
              {selloRevelado ? (
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="relative rounded-2xl border p-6 text-center"
                  style={{ borderColor: `${accentColor}50`, backgroundColor: `${accentColor}0A` }}
                >
                  <SelloCirculo accentColor={accentColor} />
                  <p className="font-serif text-lg font-bold text-texto-claro">{t("sello_titulo")}</p>
                  <p className="mt-2 text-sm text-stone-400">{t("sello_texto", { nombre })}</p>
                </motion.div>
              ) : (
                <div className="relative rounded-2xl border border-borde-sutil p-6 text-center">
                  {!reduced && (
                    <canvas
                      ref={selloCanvasRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-6 z-10 h-[calc(100%+3rem)] w-[calc(100%+3rem)] mix-blend-screen"
                    />
                  )}
                  <p className="text-sm text-stone-500">
                    {hotspots.length - visited.size === 1
                      ? t("faltan_uno")
                      : t("faltan_varios", { n: hotspots.length - visited.size })}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {hotspots.map((h, i) =>
                      visited.has(i) ? null : (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => goTo(i)}
                          className="rounded-full border px-3 py-1 text-[11px] transition-colors"
                          style={{ borderColor: `${accentColor}40`, color: accentColor }}
                        >
                          {h.titulo}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
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

/** Sello circular "Anatomía completa" — mismo motivo que el sello del secreto del artesano. */
function SelloCirculo({ accentColor }: { accentColor: string }) {
  const id = useRef(`anatomia-sello-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className="mx-auto mb-3 h-14 w-14">
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <defs>
          <path id={id} d="M 32 10 a 22 22 0 1 1 -0.01 0" fill="none" />
        </defs>
        <circle cx="32" cy="32" r="30" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
        <circle cx="32" cy="32" r="15" fill={`${accentColor}14`} stroke={accentColor} strokeWidth="0.8" />
        <text fontSize="6.5" letterSpacing="1.6" fill={accentColor} fontFamily="var(--font-sans, sans-serif)">
          <textPath href={`#${id}`}>ANATOMÍA · COMPLETA ·</textPath>
        </text>
        <path d="M27 32.5l3.5 3.5 6.5-7" fill="none" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
