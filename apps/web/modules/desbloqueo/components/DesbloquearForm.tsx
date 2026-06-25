"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getOrigenStyle } from "@/lib/origen-styles";
import {
  useColeccion,
  setPendingCode,
  consumePendingCode,
  type RedeemResult,
} from "@/components/auth/ColeccionProvider";

export interface PersonajeLite {
  slug: string;
  nombre: string;
  origen: string | null;
  imagenPortada: string | null;
}

type Phase = "form" | "sending" | "link_sent" | "redeeming" | "success";

const CODE_LEN = 6;
const CODE_RE = /^[A-Z0-9]{6}$/;

export function DesbloquearForm({ personajes }: { personajes: PersonajeLite[] }) {
  const t = useTranslations("desbloquear");
  const tc = useTranslations("coleccion");
  const { ready, gatingActive, session, signInWithEmail, redeemCode } = useColeccion();

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [unlockedSlug, setUnlockedSlug] = useState<string | null>(null);
  const autoTriedRef = useRef(false);

  const unlocked = unlockedSlug ? personajes.find((p) => p.slug === unlockedSlug) ?? null : null;

  const handleResult = useCallback((result: RedeemResult) => {
    switch (result.status) {
      case "ok":
      case "already_yours":
        setUnlockedSlug(result.slug ?? null);
        setErrorKey(null);
        setPhase("success");
        break;
      case "invalid":
        setErrorKey("error_invalido");
        setPhase("form");
        break;
      case "already_redeemed_by_other":
        setErrorKey("error_ya_canjeado");
        setPhase("form");
        break;
      case "not_configured":
        setErrorKey("no_configurado");
        setPhase("form");
        break;
      default:
        setErrorKey("error_generico");
        setPhase("form");
    }
  }, []);

  // Tras volver del magic-link: si hay sesión y un código pendiente, canjear y mostrar resultado.
  useEffect(() => {
    if (!ready || !session || autoTriedRef.current) return;
    const pending = consumePendingCode();
    if (!pending) return;
    autoTriedRef.current = true;
    setCode(pending);
    setPhase("redeeming");
    redeemCode(pending).then(handleResult);
  }, [ready, session, redeemCode, handleResult]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    const normalized = code.trim().toUpperCase();
    if (!CODE_RE.test(normalized)) {
      setErrorKey("error_invalido");
      return;
    }
    if (!gatingActive) {
      setErrorKey("no_configurado");
      return;
    }

    // Con sesión: canje directo.
    if (session) {
      setPhase("redeeming");
      const result = await redeemCode(normalized);
      handleResult(result);
      return;
    }

    // Sin sesión: guardar el código y enviar el magic-link.
    if (!email.trim()) return;
    setPhase("sending");
    setPendingCode(normalized);
    const err = await signInWithEmail(email.trim());
    if (err) {
      setErrorKey("error_email");
      setPhase("form");
      return;
    }
    setPhase("link_sent");
  };

  const accent = getOrigenStyle(unlocked?.origen ?? undefined).accentColor;

  // ── Éxito ──────────────────────────────────────────────────────────────────
  if (phase === "success" && unlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md text-center"
      >
        <div
          className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-bold text-texto-claro">
          {t("exito_titulo", { nombre: unlocked.nombre })}
        </h2>
        <p className="mt-3 text-stone-400">{t("exito_texto")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={{ pathname: "/personajes/[slug]", params: { slug: unlocked.slug } }}
            className="rounded-full px-6 py-3 text-sm font-medium text-fondo-oscuro transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: accent }}
          >
            {t("ver_personaje", { nombre: unlocked.nombre })}
          </Link>
          <Link
            href="/mis-personajes"
            className="rounded-full border border-borde-sutil px-6 py-3 text-sm font-medium text-texto-claro transition-colors hover:bg-stone-900"
          >
            {t("ver_coleccion")}
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Enlace enviado ───────────────────────────────────────────────────────────
  if (phase === "link_sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md text-center"
      >
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-acento-dorado/15 text-acento-dorado">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-texto-claro">{t("enlace_enviado_titulo")}</h2>
        <p className="mt-3 text-stone-400">{t("enlace_enviado_texto", { email })}</p>
      </motion.div>
    );
  }

  // ── Formulario ───────────────────────────────────────────────────────────────
  const busy = phase === "sending" || phase === "redeeming";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md">
      <label htmlFor="codigo" className="block text-sm font-medium text-texto-claro">
        {t("codigo_label")}
      </label>
      <input
        id="codigo"
        name="codigo"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={CODE_LEN}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
        placeholder={t("codigo_placeholder")}
        className="mt-2 w-full rounded-xl border border-borde-sutil bg-stone-900/50 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-texto-claro placeholder:tracking-normal placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none"
        aria-describedby="codigo-ayuda"
      />
      <p id="codigo-ayuda" className="mt-2 text-xs text-stone-500">
        {t("no_camara")}
      </p>

      {!session && (
        <div className="mt-6">
          <label htmlFor="email" className="block text-sm font-medium text-texto-claro">
            {t("email_label")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email_placeholder")}
            className="mt-2 w-full rounded-xl border border-borde-sutil bg-stone-900/50 px-4 py-3 text-texto-claro placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none"
            aria-describedby="email-ayuda"
          />
          <p id="email-ayuda" className="mt-2 text-xs text-stone-500">
            {t("email_ayuda")}
          </p>
        </div>
      )}

      <AnimatePresence>
        {errorKey && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="mt-4 rounded-lg border border-acento-rojo/40 bg-acento-rojo/10 px-4 py-3 text-sm text-acento-rojo"
          >
            {errorKey === "no_configurado" ? t("no_configurado") : t(errorKey)}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={busy || code.length < CODE_LEN || (!session && !email.trim())}
        className="mt-6 w-full rounded-full bg-acento-dorado px-6 py-3.5 text-sm font-semibold text-fondo-oscuro transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {phase === "sending"
          ? t("enviando")
          : phase === "redeeming"
            ? t("canjeando")
            : session
              ? t("boton_despertar")
              : t("boton_enviar_enlace")}
      </button>

      {session?.user?.email && (
        <p className="mt-4 text-center text-xs text-stone-600">
          {tc("sesion_iniciada", { email: session.user.email })}
        </p>
      )}
    </form>
  );
}
