"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { getOrigenStyle, type Origen } from "@/lib/origen-styles";

export interface CertificadoLogro {
  tipo: "origen" | "coleccion";
  origen?: Origen;
  titulo: string;
  descripcion: string;
  personajes: { nombre: string; imagenPortada: string | null }[];
}

interface CertificadoColeccionProps {
  logro: CertificadoLogro;
  onClose: () => void;
}

const W = 1080;
const H = 1080;

// Paleta especial para "colección completa" — no es un origen real, usa el dorado de marca.
const ESTILO_COLECCION_COMPLETA = {
  bgFrom: "#5C4400",
  bgVia: "#2A1E00",
  accentColor: "#F0D98A",
  patternId: "chakana",
  label: "",
};

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawPatternChakana(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const tile = 90;
  const s = tile / 60;
  ctx.lineWidth = 1.5 * s;
  for (let y = -tile; y < h + tile; y += tile) {
    for (let x = -tile; x < w + tile; x += tile) {
      ctx.fillRect(x + 20 * s, y, 20 * s, 20 * s);
      ctx.fillRect(x, y + 20 * s, 60 * s, 20 * s);
      ctx.fillRect(x + 20 * s, y + 40 * s, 20 * s, 20 * s);
      ctx.strokeRect(x + 22 * s, y + 2 * s, 16 * s, 16 * s);
      ctx.strokeRect(x + 2 * s, y + 22 * s, 16 * s, 16 * s);
      ctx.strokeRect(x + 42 * s, y + 22 * s, 16 * s, 16 * s);
      ctx.strokeRect(x + 22 * s, y + 42 * s, 16 * s, 16 * s);
    }
  }
  ctx.restore();
}

function drawPatternEspiral(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, opacity: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const tile = 120;
  const s = tile / 80;
  for (let y = -tile; y < h + tile; y += tile) {
    for (let x = -tile; x < w + tile; x += tile) {
      const cx = x + 40 * s;
      const cy = y + 40 * s;
      ctx.globalAlpha = opacity;
      for (const r of [32, 22, 12]) {
        ctx.lineWidth = 1.3 * s;
        ctx.beginPath();
        ctx.arc(cx, cy, r * s, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = opacity * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 4 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPatternRombo(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, opacity: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const tile = 60;
  const s = tile / 40;
  for (let y = -tile; y < h + tile; y += tile) {
    for (let x = -tile; x < w + tile; x += tile) {
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(x + 20 * s, y + 2 * s);
      ctx.lineTo(x + 38 * s, y + 20 * s);
      ctx.lineTo(x + 20 * s, y + 38 * s);
      ctx.lineTo(x + 2 * s, y + 20 * s);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = opacity * 0.45;
      ctx.beginPath();
      ctx.moveTo(x + 20 * s, y + 10 * s);
      ctx.lineTo(x + 30 * s, y + 20 * s);
      ctx.lineTo(x + 20 * s, y + 30 * s);
      ctx.lineTo(x + 10 * s, y + 20 * s);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPattern(ctx: CanvasRenderingContext2D, patternId: string, w: number, h: number, color: string) {
  const opacity = 0.16;
  if (patternId === "chakana") drawPatternChakana(ctx, w, h, color, opacity);
  else if (patternId === "espiral") drawPatternEspiral(ctx, w, h, color, opacity);
  else drawPatternRombo(ctx, w, h, color, opacity);
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  r: number,
  ringColor: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    const scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
    const iw = img.width * scale;
    const ih = img.height * scale;
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
  } else {
    ctx.fillStyle = "#2A2724";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = ringColor;
  ctx.stroke();
}

export function CertificadoColeccion({ logro, onClose }: CertificadoColeccionProps) {
  const t = useTranslations("coleccion");
  const locale = useLocale();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function generar() {
      try {
        const style =
          logro.tipo === "coleccion" ? ESTILO_COLECCION_COMPLETA : getOrigenStyle(logro.origen);

        const familyRaw =
          typeof window !== "undefined"
            ? getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces")
            : "";
        const family = familyRaw.trim() || "serif";
        if (typeof document !== "undefined" && "fonts" in document) {
          await document.fonts.ready.catch(() => undefined);
        }

        const portraits = await Promise.all(
          logro.personajes.slice(0, 6).map((p) => loadImage(p.imagenPortada)),
        );
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-2d-context");

        // Fondo: gradiente radial, mismos stops que OrigenPlaceholder.
        const grad = ctx.createRadialGradient(W * 0.4, H * 0.32, 0, W * 0.4, H * 0.32, W * 0.9);
        grad.addColorStop(0, style.bgFrom);
        grad.addColorStop(0.55, style.bgVia);
        grad.addColorStop(1, "#080705");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        drawPattern(ctx, style.patternId, W, H, style.accentColor);

        // Marco sutil
        ctx.strokeStyle = `${style.accentColor}55`;
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 24, W - 48, H - 48);

        // Eyebrow
        ctx.textAlign = "center";
        ctx.fillStyle = style.accentColor;
        ctx.font = `600 26px ${family}, serif`;
        ctx.fillText("N U N N A   ·   C O L E C C I Ó N", W / 2, 130);

        // Retratos
        const count = portraits.length || 1;
        const r = count <= 3 ? 130 : count <= 4 ? 105 : 85;
        const gap = r * 2 + 32;
        const totalWidth = gap * count - 32;
        const startX = W / 2 - totalWidth / 2 + r;
        const cy = 300;
        portraits.forEach((img, i) => {
          drawPortrait(ctx, img, startX + i * gap, cy, r, style.accentColor);
        });

        // Título del logro
        ctx.fillStyle = "#F5F1EA";
        ctx.font = `700 76px ${family}, serif`;
        const tituloY = cy + r + 110;
        ctx.fillText(logro.titulo, W / 2, tituloY);

        // Descripción (wrap)
        ctx.fillStyle = "#C7BFB2";
        ctx.font = `400 32px ${family}, serif`;
        const lines = wrapText(ctx, logro.descripcion, W - 240);
        lines.forEach((line, i) => {
          ctx.fillText(line, W / 2, tituloY + 60 + i * 42);
        });

        // Fecha
        const fecha = new Date().toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        ctx.fillStyle = style.accentColor;
        ctx.font = `500 26px ${family}, serif`;
        ctx.fillText(fecha, W / 2, tituloY + 60 + lines.length * 42 + 50);

        // Pie de marca
        ctx.fillStyle = "#8C8471";
        ctx.font = `500 24px ${family}, serif`;
        ctx.fillText(t("certificado_pie"), W / 2, H - 55);

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
    const file = new File([blobRef.current], "nunna-certificado.png", { type: "image/png" });
    try {
      if (navigator.canShare && !navigator.canShare({ files: [file] })) return;
      await navigator.share({
        files: [file],
        title: t("certificado_titulo"),
        text: logro.titulo,
      });
    } catch {
      // El usuario canceló el share sheet — no es un error a mostrar.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
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

        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-borde-sutil bg-stone-950">
          {status === "loading" && (
            <p className="px-6 text-center text-sm text-stone-500">{t("certificado_generando")}</p>
          )}
          {status === "error" && (
            <p className="px-6 text-center text-sm text-acento-rojo">{t("certificado_error")}</p>
          )}
          {status === "ready" && imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt={logro.titulo} className="h-full w-full object-cover" />
          )}
        </div>

        {status === "ready" && imgUrl && (
          <div className="mt-4 flex gap-2">
            <a
              href={imgUrl}
              download="nunna-certificado.png"
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
