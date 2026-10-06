"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Llegada por QR — el QR impreso de cada imán codifica `/es/personajes/<slug>?origen=qr`.
 * Solo quien llegó así puede guardar al personaje en su colección (marca client-side,
 * no es una garantía server-side — ver docs/PLAN-QR-UNICO.md).
 *
 * La marca vive en localStorage (`nunna:qr:<slug>`) durante VIGENCIA_MS para sobrevivir
 * la ida y vuelta al login (Google / enlace mágico). Cada escaneo nuevo la reinicia, así
 * que una invitación descartada vuelve a ofrecerse en el siguiente escaneo.
 */

export const QR_PARAM = "origen";
export const QR_VALOR = "qr";
export const VIGENCIA_MS = 24 * 60 * 60 * 1000;

interface MarcaQr {
  t: number;
  descartado: boolean;
}

const key = (slug: string) => `nunna:qr:${slug}`;

function leer(slug: string): MarcaQr | null {
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<MarcaQr>;
    return typeof m.t === "number" ? { t: m.t, descartado: Boolean(m.descartado) } : null;
  } catch {
    return null;
  }
}

function escribir(slug: string, marca: MarcaQr) {
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(marca));
  } catch {
    /* ignore */
  }
}

export function registrarLlegadaQr(slug: string, ahora = Date.now()) {
  escribir(slug, { t: ahora, descartado: false });
}

export function llegadaQrVigente(slug: string, ahora = Date.now()): boolean {
  const m = leer(slug);
  return m !== null && ahora - m.t < VIGENCIA_MS;
}

export function invitacionDescartada(slug: string): boolean {
  return leer(slug)?.descartado ?? false;
}

export function descartarInvitacion(slug: string) {
  const m = leer(slug);
  if (m) escribir(slug, { ...m, descartado: true });
}

export function borrarLlegadaQr(slug: string) {
  try {
    window.localStorage.removeItem(key(slug));
  } catch {
    /* ignore */
  }
}

/** Ruta de la ficha con el marcador QR — destino del login para que el guardado sobreviva. */
export function conMarcaQr(pathname: string): string {
  return `${pathname}?${QR_PARAM}=${QR_VALOR}`;
}

/**
 * Lee `?origen=qr` al montar (window.location, no useSearchParams → la ficha sigue SSG),
 * registra la llegada y limpia SOLO ese query param de la barra de direcciones — el
 * `#hash` se conserva porque ahí llegan los tokens de Supabase al volver del login.
 */
export function useLlegadaPorQr(slug: string) {
  const [porQr, setPorQr] = useState(false);
  const [descartada, setDescartada] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(QR_PARAM) === QR_VALOR) {
      registrarLlegadaQr(slug);
      url.searchParams.delete(QR_PARAM);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    setPorQr(llegadaQrVigente(slug));
    setDescartada(invitacionDescartada(slug));
  }, [slug]);

  const descartar = useCallback(() => {
    descartarInvitacion(slug);
    setDescartada(true);
  }, [slug]);

  return { porQr, descartada, descartar };
}
