"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { getOrigenStyle } from "@/lib/origen-styles";
import {
  useColeccion,
  setPendingCode,
  consumePendingCode,
  CODE_RE,
  type RedeemResult,
} from "@/components/auth/ColeccionProvider";

export interface PersonajeLite {
  slug: string;
  nombre: string;
  origen: string | null;
  imagenPortada: string | null;
}

/**
 * Fases del flujo:
 *  code      → el usuario escribe el código (paso 1)
 *  checking  → verificando el código contra la DB (sin auth)
 *  email     → código OK; el usuario escribe su correo (paso 2)
 *  sending   → enviando el magic-link
 *  link_sent → magic-link enviado, esperando clic
 *  redeeming → volvió del enlace, canjeando el código
 *  success   → desbloqueado ✓
 */
type Phase = "code" | "checking" | "email" | "sending" | "link_sent" | "redeeming" | "success" | "already_yours";

const CODE_LEN = 6;

export function DesbloquearForm({
  personajes,
  personajeActivo,
}: {
  personajes: PersonajeLite[];
  personajeActivo?: PersonajeLite;
}) {
  const t = useTranslations("desbloquear");
  const tc = useTranslations("coleccion");
  const router = useRouter();
  const { ready, gatingActive, session, signInWithEmail, checkCodeValid, redeemCode } = useColeccion();

  // Slug esperado: en /desbloquear/[slug] el código DEBE pertenecer a este personaje.
  // En /desbloquear genérico (sin personajeActivo) va undefined → sin validación.
  const expectedSlug = personajeActivo?.slug;

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("code");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [unlockedSlug, setUnlockedSlug] = useState<string | null>(null);
  const autoTriedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Detectar error en el hash de la URL (ej. otp_expired al volver del magic-link).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const errorCode = params.get("error_code");
    const error = params.get("error");
    if (errorCode === "otp_expired" || error === "access_denied") {
      setPhase("code");
      setErrorKey("enlace_expirado");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Si la sesión se cierra, permitir que un futuro login vuelva a auto-canjear.
  useEffect(() => {
    if (!session) autoTriedRef.current = false;
  }, [session]);

  // Personaje desbloqueado: el que devolvió el canje, con fallback al activo de contexto.
  const unlocked =
    (unlockedSlug ? (personajes.find((p) => p.slug === unlockedSlug) ?? null) : null) ??
    (phase === "success" ? (personajeActivo ?? null) : null);

  // `attemptedCode` se pasa explícitamente (no se cierra sobre `code`) para evitar
  // el stale-closure: en el auto-canje `code` aún es "" cuando corre este callback.
  const handleResult = useCallback(
    (result: RedeemResult, attemptedCode: string) => {
      if (!mountedRef.current) return;
      switch (result.status) {
        case "ok":
        case "already_yours": {
          // Éxito → directo a la ficha del personaje (redeemCode ya lo añadió a la
          // colección local, así que GatedPageRedirect no rebota). El slug lo manda
          // el canje; fallback al personaje de contexto.
          const slug = result.slug ?? personajeActivo?.slug;
          if (slug) {
            setErrorKey(null);
            setPhase("redeeming"); // mantiene el estado de carga hasta navegar
            router.replace({ pathname: "/personajes/[slug]", params: { slug } });
          } else {
            // Sin slug (no debería ocurrir): cae a la pantalla estática de respaldo.
            setUnlockedSlug(result.slug ?? null);
            setErrorKey(null);
            setPhase(result.status === "ok" ? "success" : "already_yours");
          }
          break;
        }
        case "invalid":
          setErrorKey("error_invalido");
          setPhase("code");
          break;
        case "wrong_character":
          // El código es válido pero de OTRO personaje: no se canjea.
          setErrorKey("error_otro_personaje");
          setPhase("code");
          break;
        case "already_redeemed_by_other":
          setErrorKey("error_ya_canjeado");
          setPhase("code");
          break;
        case "not_configured":
          setErrorKey("no_configurado");
          setPhase("code");
          break;
        case "not_authenticated":
          // Sesión expirada: limpiar error, guardar código y pedir re-autenticación por email.
          setErrorKey(null);
          setPendingCode(attemptedCode);
          setPhase("email");
          break;
        default:
          setErrorKey("error_generico");
          setPhase("code");
      }
    },
    [router, personajeActivo],
  );

  // Tras volver del magic-link: sesión disponible + código pendiente → canjear.
  // El código puede venir de la URL (?unlock_code=, sobrevive aunque el enlace se
  // abra en otro navegador/dispositivo) o, si no está, de localStorage (mismo
  // dispositivo). Depender solo de localStorage dejaba a la persona varada en el
  // paso 1 cuando abría el correo en un contexto distinto al del formulario.
  useEffect(() => {
    if (!ready || !session || autoTriedRef.current) return;

    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("unlock_code");
    const pending = fromUrl && CODE_RE.test(fromUrl) ? fromUrl : consumePendingCode();
    if (!pending) return;

    autoTriedRef.current = true;
    if (fromUrl) {
      url.searchParams.delete("unlock_code");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    setCode(pending);
    setPhase("redeeming");

    // Justo tras volver del magic-link hay una ventana breve donde la sesión existe
    // pero getUser() aún no valida el JWT nuevo → not_authenticated transitorio.
    // Reintentamos unas veces (con `pending` en memoria) antes de darnos por vencidos,
    // para no caer a la fase "email" mostrando el código de nuevo.
    (async () => {
      let result = await redeemCode(pending, expectedSlug);
      for (let i = 0; i < 3 && result.status === "not_authenticated"; i++) {
        await new Promise((r) => setTimeout(r, 400));
        result = await redeemCode(pending, expectedSlug);
      }
      handleResult(result, pending);
    })();
  }, [ready, session, redeemCode, handleResult, expectedSlug]);

  // ── Paso 1: verificar el código ─────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);
    const normalized = code.trim().toUpperCase();

    if (!CODE_RE.test(normalized)) {
      setErrorKey("error_invalido");
      return;
    }

    // Sin Supabase configurado: saltar validación remota.
    if (!gatingActive) {
      setErrorKey("no_configurado");
      return;
    }

    // Con sesión: saltar el paso de email, canjear directamente.
    if (session) {
      setPhase("redeeming");
      const result = await redeemCode(normalized, expectedSlug);
      handleResult(result, normalized);
      return;
    }

    // Sin sesión: verificar que el código exista y esté sin canjear antes de pedir
    // el correo. La pre-validación NO pasa el slug esperado a propósito: el booleano
    // no distingue "inexistente" de "de otro personaje", así el mensaje aquí es
    // exacto ("código inválido"). La pertenencia al personaje se valida de forma
    // autoritativa en el canje (redeem_code → wrong_character), con mensaje preciso.
    setPhase("checking");
    const valid = await checkCodeValid(normalized);
    if (!mountedRef.current) return;
    if (!valid) {
      setErrorKey("error_invalido");
      setPhase("code");
      return;
    }
    setErrorKey(null);
    setPhase("email");
  };

  // ── Paso 2: enviar el magic-link ─────────────────────────────────────────────
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    if (!email.trim()) {
      setErrorKey("email_requerido");
      return;
    }

    const normalized = code.trim().toUpperCase();
    setPhase("sending");
    setPendingCode(normalized);
    const err = await signInWithEmail(email.trim(), normalized);
    if (!mountedRef.current) return;
    if (err) {
      consumePendingCode();
      setErrorKey("error_email");
      setPhase("email");
      return;
    }
    setPhase("link_sent");
  };

  const volver = () => {
    setPhase("code");
    setErrorKey(null);
  };

  const accent = getOrigenStyle(unlocked?.origen ?? undefined).accentColor;

  // ── Ya lo tienes ────────────────────────────────────────────────────────────
  if (phase === "already_yours" && unlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md text-center"
      >
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-stone-800 text-stone-400">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-bold text-texto-claro">
          Ya tienes a {unlocked.nombre}
        </h2>
        <p className="mt-3 text-stone-400">
          Este personaje ya está en tu colección. El código no puede usarse de nuevo.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={{ pathname: "/personajes/[slug]", params: { slug: unlocked.slug } }}
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            className="rounded-full bg-stone-800 px-6 py-3 text-sm font-medium text-texto-claro transition-colors hover:bg-stone-700"
          >
            Ver a {unlocked.nombre}
          </Link>
          <button
            type="button"
            onClick={() => { setPhase("code"); setCode(""); setErrorKey(null); }}
            className="rounded-full border border-borde-sutil px-6 py-3 text-sm font-medium text-stone-400 transition-colors hover:text-texto-claro"
          >
            Ingresar otro código
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Éxito ───────────────────────────────────────────────────────────────────
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
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            className="rounded-full px-6 py-3 text-sm font-medium text-fondo-oscuro transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: accent }}
          >
            {t("ver_personaje", { nombre: unlocked.nombre })}
          </Link>
          <Link
            href="/personajes"
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            className="rounded-full border border-borde-sutil px-6 py-3 text-sm font-medium text-texto-claro transition-colors hover:bg-stone-900"
          >
            {t("ver_coleccion")}
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Enlace enviado ──────────────────────────────────────────────────────────
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
        <button
          onClick={volver}
          className="mt-6 text-xs text-stone-500 underline underline-offset-2 hover:text-stone-400"
        >
          {t("volver_codigo")}
        </button>
      </motion.div>
    );
  }

  const busy = phase === "checking" || phase === "sending" || phase === "redeeming";

  // ── Paso 2: correo ──────────────────────────────────────────────────────────
  if (phase === "email" || phase === "sending") {
    return (
      <form onSubmit={handleSendLink} className="mx-auto max-w-md">
        {/* Código confirmado */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-acento-dorado/30 bg-acento-dorado/5 px-4 py-3">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0 text-acento-dorado" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="font-mono text-sm font-semibold tracking-widest text-acento-dorado">{code}</span>
          <button
            type="button"
            onClick={volver}
            className="ml-auto text-xs text-stone-500 hover:text-stone-400"
          >
            {t("cambiar")}
          </button>
        </div>

        <label htmlFor="email" className="block text-sm font-medium text-texto-claro">
          {t("email_label")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          className="mt-2 w-full rounded-xl border border-borde-sutil bg-stone-900/50 px-4 py-3 text-texto-claro placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none"
          aria-describedby="email-ayuda"
        />
        <p id="email-ayuda" className="mt-2 text-xs text-stone-500">
          {t("email_ayuda")}
        </p>

        <AnimatePresence>
          {errorKey && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="mt-4 rounded-lg border border-acento-rojo/40 bg-acento-rojo/10 px-4 py-3 text-sm text-acento-rojo"
            >
              {t(errorKey as Parameters<typeof t>[0])}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="mt-6 w-full rounded-full bg-acento-dorado px-6 py-3.5 text-sm font-semibold text-fondo-oscuro transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {phase === "sending" ? t("enviando") : t("boton_enviar_enlace")}
        </button>

        {session?.user?.email && (
          <p className="mt-4 text-center text-xs text-stone-600">
            {tc("sesion_iniciada", { email: session.user.email })}
          </p>
        )}
      </form>
    );
  }

  // ── Paso 1: código (+ estados de carga/canje) ────────────────────────────────
  return (
    <form onSubmit={handleVerifyCode} className="mx-auto max-w-md">
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
        onChange={(e) => {
          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
          if (errorKey) setErrorKey(null);
        }}
        placeholder={t("codigo_placeholder")}
        className="mt-2 w-full rounded-xl border border-borde-sutil bg-stone-900/50 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-texto-claro placeholder:tracking-normal placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none"
        aria-describedby="codigo-ayuda"
      />
      <p id="codigo-ayuda" className="mt-2 text-xs text-stone-500">
        {t("no_camara")}
      </p>

      <AnimatePresence>
        {errorKey && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="mt-4 rounded-lg border border-acento-rojo/40 bg-acento-rojo/10 px-4 py-3 text-sm text-acento-rojo"
          >
            {t(errorKey as Parameters<typeof t>[0])}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={busy || code.length < CODE_LEN}
        className="mt-6 w-full rounded-full bg-acento-dorado px-6 py-3.5 text-sm font-semibold text-fondo-oscuro transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {phase === "checking"
          ? t("verificando")
          : phase === "redeeming"
            ? t("canjeando")
            : session
              ? t("boton_despertar")
              : t("verificar")}
      </button>

      {session?.user?.email && (
        <p className="mt-4 text-center text-xs text-stone-600">
          {tc("sesion_iniciada", { email: session.user.email })}
        </p>
      )}
    </form>
  );
}
