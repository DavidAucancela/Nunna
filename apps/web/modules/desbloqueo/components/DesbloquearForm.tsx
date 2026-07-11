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
  type CodeStatus,
} from "@/components/auth/ColeccionProvider";

export interface PersonajeLite {
  slug: string;
  nombre: string;
  origen: string | null;
  imagenPortada: string | null;
}

/**
 * Fases del flujo:
 *  form      → pantalla única: código + correo juntos (incluye envío del magic-link)
 *  link_sent → magic-link enviado, esperando clic
 *  redeeming → volvió del enlace, canjeando el código
 *  success   → desbloqueado ✓
 */
type Phase = "form" | "sending" | "link_sent" | "redeeming" | "success" | "already_yours";

/** Estado local, no bloqueante, del botón/verificación en tiempo real del código. */
type CodeCheck = "idle" | "checking" | CodeStatus;

const CODE_LEN = 6;
const SOPORTE_EMAIL = "soporte@nunna-ecu.com";

export function DesbloquearForm({
  personajes,
  personajeActivo,
}: {
  personajes: PersonajeLite[];
  personajeActivo: PersonajeLite;
}) {
  const t = useTranslations("desbloquear");
  const tc = useTranslations("coleccion");
  const router = useRouter();
  const { ready, gatingActive, session, signInWithEmail, checkCodeStatus, redeemCode } = useColeccion();

  // Único personaje válido: en /desbloquear/[slug] el código DEBE pertenecer a este.
  const expectedSlug = personajeActivo.slug;

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [codeCheck, setCodeCheck] = useState<CodeCheck>("idle");
  const [unlockedSlug, setUnlockedSlug] = useState<string | null>(null);
  const autoTriedRef = useRef(false);
  const mountedRef = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkSeqRef = useRef(0);

  // Aviso rápido no bloqueante (toast) — no cambia de fase ni cierra la pantalla.
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashHint = useCallback((msg: string) => {
    setHint(msg);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(null), 3200);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
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
      setPhase("form");
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
    (phase === "success" ? personajeActivo : null);

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
          const slug = result.slug ?? personajeActivo.slug;
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
          setPhase("form");
          break;
        case "wrong_character":
          // El código es válido pero de OTRO personaje: no se canjea.
          setErrorKey("error_otro_personaje");
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
        case "not_authenticated":
          // Sesión expirada: limpiar error, guardar código y pedir re-autenticación por email.
          setErrorKey(null);
          setPendingCode(attemptedCode);
          setPhase("form");
          break;
        default:
          setErrorKey("error_generico");
          setPhase("form");
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
    // para no caer a la fase "form" mostrando el código de nuevo.
    (async () => {
      let result = await redeemCode(pending, expectedSlug);
      for (let i = 0; i < 3 && result.status === "not_authenticated"; i++) {
        await new Promise((r) => setTimeout(r, 400));
        result = await redeemCode(pending, expectedSlug);
      }
      handleResult(result, pending);
    })();
  }, [ready, session, redeemCode, handleResult, expectedSlug]);

  // ── Verificación en tiempo real del código (no bloqueante) ──────────────────
  const runCheck = useCallback(
    async (value: string) => {
      if (!gatingActive) return;
      const normalized = value.trim().toUpperCase();
      if (!CODE_RE.test(normalized)) {
        setCodeCheck("idle");
        return;
      }
      const seq = ++checkSeqRef.current;
      setCodeCheck("checking");
      const status = await checkCodeStatus(normalized, expectedSlug);
      if (!mountedRef.current || seq !== checkSeqRef.current) return;
      setCodeCheck(status);
      if (status === "wrong_character") flashHint(t("error_otro_personaje"));
      else if (status === "already_redeemed") flashHint(t("error_ya_canjeado"));
      else if (status === "invalid") flashHint(t("error_invalido"));
    },
    [gatingActive, checkCodeStatus, expectedSlug, flashHint, t],
  );

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(cleaned);
    if (errorKey) setErrorKey(null);
    setCodeCheck("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cleaned.length === CODE_LEN) {
      debounceRef.current = setTimeout(() => runCheck(cleaned), 500);
    }
  };

  const handleVerifyClick = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runCheck(code);
  };

  // ── Envío: canjea directo (con sesión) o manda el magic-link ────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);
    const normalized = code.trim().toUpperCase();

    if (!CODE_RE.test(normalized)) {
      setErrorKey("error_invalido");
      return;
    }
    if (!email.trim()) {
      setErrorKey("email_requerido");
      return;
    }
    if (!gatingActive) {
      setErrorKey("no_configurado");
      return;
    }

    // Con sesión: saltar el correo, canjear directamente.
    if (session) {
      setPhase("redeeming");
      const result = await redeemCode(normalized, expectedSlug);
      handleResult(result, normalized);
      return;
    }

    setPhase("sending");
    setPendingCode(normalized);
    const err = await signInWithEmail(email.trim(), normalized);
    if (!mountedRef.current) return;
    if (err) {
      consumePendingCode();
      setErrorKey("error_email");
      setPhase("form");
      return;
    }
    setPhase("link_sent");
  };

  const volver = () => {
    setPhase("form");
    setErrorKey(null);
  };

  const accent = getOrigenStyle(unlocked?.origen ?? undefined).accentColor;
  const busy = phase === "sending" || phase === "redeeming";

  const soporteLink = (
    <a
      href={`mailto:${SOPORTE_EMAIL}`}
      className="mt-4 inline-block text-center text-xs text-stone-600 underline underline-offset-2 hover:text-stone-400"
    >
      {t("contactar_soporte")}
    </a>
  );

  // ── Toast no bloqueante — vive a nivel raíz, sobrevive cualquier cambio de fase ──
  const toast = (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          role="status"
          className="fixed inset-x-5 bottom-6 z-50 mx-auto max-w-sm rounded-xl border border-borde-sutil bg-stone-950/95 px-4 py-3 text-center text-sm text-texto-claro shadow-xl backdrop-blur-sm"
        >
          {hint}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Ya lo tienes ────────────────────────────────────────────────────────────
  if (phase === "already_yours" && unlocked) {
    return (
      <>
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
              onClick={() => { setPhase("form"); setCode(""); setErrorKey(null); setCodeCheck("idle"); }}
              className="rounded-full border border-borde-sutil px-6 py-3 text-sm font-medium text-stone-400 transition-colors hover:text-texto-claro"
            >
              Ingresar otro código
            </button>
          </div>
        </motion.div>
        {toast}
      </>
    );
  }

  // ── Éxito ───────────────────────────────────────────────────────────────────
  if (phase === "success" && unlocked) {
    return (
      <>
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
        {toast}
      </>
    );
  }

  // ── Enlace enviado ──────────────────────────────────────────────────────────
  if (phase === "link_sent") {
    return (
      <>
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
          {soporteLink}
        </motion.div>
        {toast}
      </>
    );
  }

  // ── Pantalla única: código + correo ──────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md">
        <label htmlFor="codigo" className="block text-sm font-medium text-texto-claro">
          {t("codigo_label")}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="codigo"
            name="codigo"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={CODE_LEN}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={t("codigo_placeholder")}
            className="w-full rounded-xl border border-borde-sutil bg-stone-900/50 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-texto-claro placeholder:tracking-normal placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none"
            aria-describedby="codigo-ayuda codigo-estado"
          />
          <button
            type="button"
            onClick={handleVerifyClick}
            disabled={code.length < CODE_LEN || codeCheck === "checking"}
            className="shrink-0 rounded-xl border border-borde-sutil px-4 text-xs font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado disabled:cursor-not-allowed disabled:opacity-40"
          >
            {codeCheck === "checking" ? t("verificando") : t("verificar")}
          </button>
        </div>
        <p id="codigo-ayuda" className="mt-2 text-xs text-stone-500">
          {t("no_camara")}
        </p>

        {/* Indicador inline de la verificación en tiempo real — no bloquea el formulario */}
        <AnimatePresence>
          {codeCheck !== "idle" && codeCheck !== "checking" && (
            <motion.p
              id="codigo-estado"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
              className={`mt-2 text-xs ${codeCheck === "valid" ? "text-emerald-400" : "text-acento-rojo"}`}
            >
              {codeCheck === "valid" && `✓ ${t("codigo_valido")}`}
              {codeCheck === "invalid" && t("error_invalido")}
              {codeCheck === "wrong_character" && t("error_otro_personaje")}
              {codeCheck === "already_redeemed" && t("error_ya_canjeado")}
              {(codeCheck === "not_configured" || codeCheck === "error") && t("error_generico")}
            </motion.p>
          )}
        </AnimatePresence>

        <label htmlFor="email" className="mt-6 block text-sm font-medium text-texto-claro">
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
          disabled={busy || code.length < CODE_LEN || !email.trim()}
          className="mt-6 w-full rounded-full bg-acento-dorado px-6 py-3.5 text-sm font-semibold text-fondo-oscuro transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {phase === "redeeming"
            ? t("canjeando")
            : phase === "sending"
              ? t("enviando")
              : session
                ? t("boton_despertar")
                : t("boton_enviar_enlace")}
        </button>

        {session?.user?.email && (
          <p className="mt-4 text-center text-xs text-stone-600">
            {tc("sesion_iniciada", { email: session.user.email })}
          </p>
        )}

        <div className="text-center">{soporteLink}</div>
      </form>
      {toast}
    </>
  );
}
