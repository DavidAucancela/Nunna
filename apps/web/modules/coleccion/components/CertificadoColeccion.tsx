"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { getOrigenStyle, type Origen } from "@/lib/origen-styles";

export interface CertificadoPersonaje {
  nombre: string;
  imagenPortada: string | null;
  /** Imán recortado con fondo transparente (si `imagenPortada` trae fondo). */
  imagenIman?: string | null;
  /** Color del nombre en la placa de la tarjeta (`tarjeta.color`). */
  color?: string | null;
}

export interface CertificadoLogro {
  tipo: "origen" | "coleccion" | "personaje";
  origen?: Origen;
  titulo: string;
  descripcion: string;
  personajes: CertificadoPersonaje[];
  /** Cuándo se ganó (fecha real de guardado); si falta, hoy. */
  fecha?: Date | null;
  /** "Nº 3 de 6" — solo el de personaje. */
  numero?: string | null;
  /** Leyenda del personaje — solo el de personaje. */
  leyenda?: string | null;
}

interface CertificadoColeccionProps {
  logro: CertificadoLogro;
  onClose: () => void;
}

// 4:5 vertical: el formato que mejor se comparte desde el teléfono.
const W = 1080;
const H = 1350;

const ORO = "#E0B919";
const ORO_CLARO = "#F4CB1B";
const CREMA = "#FFF9E6";
const CAFE = "#37220A";

type Ctx = CanvasRenderingContext2D;

function cargar(src: string | null | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function partir(ctx: Ctx, texto: string, ancho: number): string[] {
  const lineas: string[] = [];
  let linea = "";
  for (const palabra of texto.split(" ")) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > ancho && linea) {
      lineas.push(linea);
      linea = palabra;
    } else linea = prueba;
  }
  if (linea) lineas.push(linea);
  return lineas;
}

/** Texto centrado con espaciado entre letras (dibujado letra por letra: funciona en todos los navegadores). */
function espaciado(ctx: Ctx, texto: string, cx: number, y: number, espacio: number) {
  const letras = [...texto];
  const anchos = letras.map((l) => ctx.measureText(l).width);
  const total = anchos.reduce((a, b) => a + b, 0) + espacio * (letras.length - 1);
  let x = cx - total / 2;
  const alineo = ctx.textAlign;
  ctx.textAlign = "left";
  letras.forEach((l, i) => {
    ctx.fillText(l, x, y);
    x += anchos[i]! + espacio;
  });
  ctx.textAlign = alineo;
}

function rgba(hex: string | null | undefined, a: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return `rgba(200,155,60,${a})`;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Doble filete dorado, como el marco de la tarjeta impresa. */
function marco(ctx: Ctx, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  // Rombos en las esquinas.
  ctx.fillStyle = color;
  for (const [x, y] of [[46, 46], [W - 46, 46], [46, H - 46], [W - 46, H - 46]] as const) {
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 12, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** El imán de pie: contenido en una caja, apoyado abajo, con sombra. */
function iman(ctx: Ctx, img: HTMLImageElement | null, cx: number, base: number, maxW: number, maxH: number) {
  if (!img) return;
  const k = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * k;
  const h = img.height * k;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 22;
  ctx.drawImage(img, cx - w / 2, base - h, w, h);
  ctx.restore();
}

/** Halo elíptico del color del personaje detrás del imán. */
function halo(ctx: Ctx, cx: number, cy: number, r: number, color: string | null | undefined, a = 0.55) {
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Sello circular con texto alrededor y una estrella al centro. */
function sello(ctx: Ctx, cx: number, cy: number, r: number, texto: string, color: string, fondo: string, familia: string) {
  ctx.save();
  ctx.fillStyle = fondo;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  // Texto alrededor.
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(r * 0.17)}px ${familia}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const letras = [...texto];
  const paso = (Math.PI * 2) / letras.length;
  letras.forEach((l, i) => {
    const ang = -Math.PI / 2 + i * paso;
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * r * 0.8, cy + Math.sin(ang) * r * 0.8);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillText(l, 0, 0);
    ctx.restore();
  });
  // Estrella.
  const e = r * 0.36;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? e : e * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function patron(ctx: Ctx, color: string, opacidad: number) {
  ctx.save();
  ctx.globalAlpha = opacidad;
  ctx.fillStyle = color;
  const t = 96;
  const s = t / 60;
  for (let y = -t; y < H + t; y += t) {
    for (let x = -t; x < W + t; x += t) {
      ctx.fillRect(x + 20 * s, y, 20 * s, 20 * s);
      ctx.fillRect(x, y + 20 * s, 60 * s, 20 * s);
      ctx.fillRect(x + 20 * s, y + 40 * s, 20 * s, 20 * s);
    }
  }
  ctx.restore();
}

/** Bloque de cierre: "Pertenece a {titular}" + fecha. */
function titularYFecha(
  ctx: Ctx,
  y: number,
  titular: string | null,
  lineaFecha: string,
  etiqueta: string,
  serif: string,
  sans: string,
  acento: string,
) {
  ctx.textAlign = "center";
  if (titular) {
    ctx.fillStyle = acento;
    ctx.font = `600 22px ${sans}`;
    espaciado(ctx, etiqueta.toUpperCase(), W / 2, y, 5);
    ctx.fillStyle = CREMA;
    ctx.font = `italic 600 54px ${serif}`;
    ctx.fillText(titular, W / 2, y + 66);
    y += 66;
  }
  ctx.fillStyle = "#D8CDB8";
  ctx.font = `400 28px ${sans}`;
  ctx.fillText(lineaFecha, W / 2, y + 56);
}

export function CertificadoColeccion({ logro, onClose }: CertificadoColeccionProps) {
  const t = useTranslations("coleccion");
  const locale = useLocale();
  const { user } = useColeccion();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Titular: el nombre de la cuenta de Google; con enlace mágico, el correo sin dominio.
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const titular = meta?.full_name ?? meta?.name ?? (user?.email ? user.email.split("@")[0]! : null);
  const archivo = `nunna-${logro.tipo === "coleccion" ? "guardian-del-pase" : logro.titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}.png`;

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function generar() {
      try {
        const css = getComputedStyle(document.documentElement);
        const serif = `${css.getPropertyValue("--font-fraunces").trim() || "Georgia"}, Georgia, serif`;
        const sans = "Inter, system-ui, -apple-system, Segoe UI, sans-serif";
        if ("fonts" in document) await document.fonts.ready.catch(() => undefined);

        const imgs = await Promise.all(logro.personajes.slice(0, 6).map((p) => cargar(p.imagenIman ?? p.imagenPortada)));
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-2d-context");
        ctx.textBaseline = "alphabetic";

        const fecha = (logro.fecha ?? new Date()).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

        if (logro.tipo === "personaje") {
          // ── Personaje: la tarjeta impresa hecha certificado ──
          const p = logro.personajes[0];
          const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.85);
          g.addColorStop(0, "#5A3812");
          g.addColorStop(1, CAFE);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          marco(ctx, ORO);

          ctx.textAlign = "center";
          ctx.fillStyle = ORO_CLARO;
          ctx.font = `900 52px ${serif}`;
          espaciado(ctx, "NUNNA", W / 2, 140, 14);
          ctx.fillStyle = CREMA;
          ctx.font = `600 22px ${sans}`;
          espaciado(ctx, t("cert_personaje_eyebrow").toUpperCase(), W / 2, 184, 6);
          if (logro.numero) {
            ctx.fillStyle = ORO;
            ctx.font = `600 24px ${sans}`;
            ctx.fillText(logro.numero, W / 2, 226);
          }

          halo(ctx, W / 2, 560, 330, p?.color, 0.6);
          iman(ctx, imgs[0] ?? null, W / 2, 790, 520, 520);

          // Placa crema con el nombre, como en la tarjeta.
          ctx.font = `900 60px ${serif}`;
          const nombre = (p?.nombre ?? logro.titulo).toUpperCase();
          const ancho = Math.min(W - 200, ctx.measureText(nombre).width + 120);
          ctx.fillStyle = CREMA;
          ctx.beginPath();
          ctx.roundRect(W / 2 - ancho / 2, 812, ancho, 104, 18);
          ctx.fill();
          ctx.fillStyle = p?.color ?? CAFE;
          ctx.fillText(nombre, W / 2, 886);

          if (logro.leyenda) {
            ctx.fillStyle = "#E9DDC4";
            ctx.font = `italic 400 32px ${serif}`;
            partir(ctx, `“${logro.leyenda}”`, W - 260)
              .slice(0, 2)
              .forEach((l, i) => ctx.fillText(l, W / 2, 980 + i * 44));
          }
          titularYFecha(ctx, 1080, titular, t("cert_se_unio", { fecha }), t("cert_pertenece"), serif, sans, ORO);
          sello(ctx, W - 150, H - 150, 70, t("cert_sello"), ORO, CAFE, sans);
        } else if (logro.tipo === "origen") {
          // ── Maestro de un origen: los imanes de ese origen, juntos ──
          const estilo = getOrigenStyle(logro.origen);
          const g = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.95);
          g.addColorStop(0, estilo.bgFrom);
          g.addColorStop(0.6, estilo.bgVia);
          g.addColorStop(1, "#080705");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          patron(ctx, estilo.accentColor, 0.035);
          marco(ctx, estilo.accentColor);

          ctx.textAlign = "center";
          ctx.fillStyle = estilo.accentColor;
          ctx.font = `600 22px ${sans}`;
          espaciado(ctx, `NUNNA · ${t("cert_origen_eyebrow").toUpperCase()}`, W / 2, 140, 6);
          ctx.fillStyle = CREMA;
          ctx.font = `700 84px ${serif}`;
          ctx.fillText(logro.titulo, W / 2, 250);

          const n = Math.max(1, imgs.length);
          const caja = n === 1 ? 440 : n === 2 ? 360 : 280;
          const sep = n === 1 ? 0 : Math.min(400, (W - 240) / (n - 1));
          const x0 = W / 2 - (sep * (n - 1)) / 2;
          logro.personajes.forEach((p, i) => {
            const cx = x0 + i * sep;
            halo(ctx, cx, 600, caja * 0.62, p.color ?? estilo.accentColor, 0.5);
            iman(ctx, imgs[i] ?? null, cx, 800, caja, caja + 60);
            ctx.fillStyle = CREMA;
            ctx.font = `700 34px ${serif}`;
            ctx.fillText(p.nombre, cx, 856);
          });

          ctx.fillStyle = "#E9DDC4";
          ctx.font = `400 32px ${serif}`;
          partir(ctx, logro.descripcion, W - 240)
            .slice(0, 2)
            .forEach((l, i) => ctx.fillText(l, W / 2, 940 + i * 44));
          titularYFecha(ctx, 1070, titular, t("cert_completado", { fecha }), t("cert_otorgado"), serif, sans, estilo.accentColor);
          sello(ctx, W - 150, H - 150, 70, t("cert_sello"), estilo.accentColor, estilo.bgVia, sans);
        } else {
          // ── Guardián del pase: la comparsa completa ──
          const g = ctx.createRadialGradient(W / 2, H * 0.36, 0, W / 2, H * 0.36, W * 0.95);
          g.addColorStop(0, "#5C4400");
          g.addColorStop(0.55, "#241A04");
          g.addColorStop(1, "#070604");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          patron(ctx, "#F0D98A", 0.03);
          marco(ctx, "#F0D98A");
          ctx.save();
          ctx.strokeStyle = "rgba(240,217,138,0.45)";
          ctx.lineWidth = 1;
          ctx.strokeRect(58, 58, W - 116, H - 116);
          ctx.restore();

          ctx.textAlign = "center";
          ctx.fillStyle = "#F0D98A";
          ctx.font = `600 22px ${sans}`;
          espaciado(ctx, `NUNNA · ${t("cert_guardian_eyebrow").toUpperCase()}`, W / 2, 132, 6);
          sello(ctx, W / 2, 262, 92, t("cert_sello_guardian"), "#0F0E0C", "#C89B3C", sans);
          ctx.fillStyle = "#F0D98A";
          ctx.font = `800 92px ${serif}`;
          ctx.fillText(logro.titulo, W / 2, 460);

          // Los seis en desfile, en un arco suave.
          const n = imgs.length;
          const sep = (W - 200) / Math.max(1, n);
          logro.personajes.slice(0, 6).forEach((p, i) => {
            const cx = 100 + sep * (i + 0.5);
            const curva = Math.sin((Math.PI * (i + 0.5)) / n) * 46;
            const base = 812 - curva;
            halo(ctx, cx, base - 120, 120, p.color, 0.45);
            iman(ctx, imgs[i] ?? null, cx, base, sep - 14, 300);
          });
          ctx.strokeStyle = "rgba(240,217,138,0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(120, 836);
          ctx.quadraticCurveTo(W / 2, 772, W - 120, 836);
          ctx.stroke();

          ctx.fillStyle = "#E9DDC4";
          ctx.font = `500 26px ${sans}`;
          partir(ctx, logro.personajes.map((p) => p.nombre).join("  ·  "), W - 200).forEach((l, i) =>
            ctx.fillText(l, W / 2, 890 + i * 36),
          );
          ctx.fillStyle = CREMA;
          ctx.font = `400 32px ${serif}`;
          partir(ctx, logro.descripcion, W - 240)
            .slice(0, 2)
            .forEach((l, i) => ctx.fillText(l, W / 2, 976 + i * 44));
          titularYFecha(ctx, 1096, titular, t("cert_completado", { fecha }), t("cert_otorgado"), serif, sans, "#F0D98A");
        }

        // Pie de marca
        ctx.textAlign = "center";
        ctx.fillStyle = "#A8A29E";
        ctx.font = `500 22px ${sans}`;
        espaciado(ctx, t("certificado_pie").toUpperCase(), W / 2, H - 76, 4);

        canvas.toBlob((blob) => {
          if (cancelled || !blob) {
            if (!cancelled) setStatus("error");
            return;
          }
          blobRef.current = blob;
          objectUrl = URL.createObjectURL(blob);
          setImgUrl(objectUrl);
          setStatus("ready");
        }, "image/png");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    generar();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    if (!blobRef.current || !canShare) return;
    const file = new File([blobRef.current], archivo, { type: "image/png" });
    try {
      if (navigator.canShare && !navigator.canShare({ files: [file] })) return;
      await navigator.share({ files: [file], title: t("certificado_titulo"), text: logro.titulo });
    } catch {
      // El usuario canceló el share sheet — no es un error a mostrar.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("certificado_titulo")}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-borde-sutil bg-stone-900 p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-texto-claro">{t("certificado_titulo")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("certificado_cerrar")}
            className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-800 hover:text-texto-claro"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mx-auto flex aspect-[4/5] max-h-[62vh] items-center justify-center overflow-hidden rounded-xl border border-borde-sutil bg-stone-950">
          {status === "loading" && <p className="px-6 text-center text-sm text-stone-500">{t("certificado_generando")}</p>}
          {status === "error" && <p className="px-6 text-center text-sm text-acento-rojo">{t("certificado_error")}</p>}
          {status === "ready" && imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt={logro.titulo} className="h-full w-full object-contain" />
          )}
        </div>

        {status === "ready" && imgUrl && (
          <div className="mt-4 flex gap-2">
            <a
              href={imgUrl}
              download={archivo}
              className="flex-1 rounded-full bg-acento-dorado px-4 py-2.5 text-center text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.02]"
            >
              {t("certificado_descargar")}
            </a>
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 rounded-full border border-borde-sutil px-4 py-2.5 text-sm font-medium text-texto-claro transition-colors hover:bg-stone-800"
              >
                {t("certificado_compartir")}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
