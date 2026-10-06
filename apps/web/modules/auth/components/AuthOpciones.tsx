"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useColeccion } from "@/components/auth/ColeccionProvider";

type Phase = "form" | "sending" | "link_sent";

const SOPORTE_EMAIL = "soporte@nunna-ecu.com";

/** El botón de Google solo aparece cuando el proveedor ya está configurado en Supabase. */
const GOOGLE_ACTIVO = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

interface AuthOpcionesProps {
  /** A dónde vuelve la persona tras el login (p. ej. la ficha con `?origen=qr`). */
  redirectPath?: string | undefined;
  /** Se llama justo antes de salir al login (Google) o de enviar el enlace. */
  onBeforeAuth?: (() => void) | undefined;
  /** Error inicial (p. ej. enlace expirado detectado en el hash). */
  initialErrorKey?: string | null;
  autoFocus?: boolean;
  idPrefix?: string;
}

/**
 * Formulario de acceso compartido por /login y el modal "Guarda a {nombre}":
 * "Continuar con Google" + enlace mágico por correo. Las cadenas viven en el
 * namespace `login`.
 */
export function AuthOpciones({
  redirectPath,
  onBeforeAuth,
  initialErrorKey = null,
  autoFocus = false,
  idPrefix = "auth",
}: AuthOpcionesProps) {
  const t = useTranslations("login");
  const { authActiva, signInWithEmail, signInWithGoogle } = useColeccion();

  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [errorKey, setErrorKey] = useState<string | null>(initialErrorKey);

  const handleGoogle = async () => {
    setErrorKey(null);
    if (!authActiva) {
      setErrorKey("no_configurado");
      return;
    }
    onBeforeAuth?.();
    const err = await signInWithGoogle(redirectPath);
    if (err) setErrorKey("error_google");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    if (!email.trim()) {
      setErrorKey("email_requerido");
      return;
    }
    if (!authActiva) {
      setErrorKey("no_configurado");
      return;
    }

    setPhase("sending");
    onBeforeAuth?.();
    const err = await signInWithEmail(email.trim(), redirectPath);
    if (err) {
      setErrorKey(err === "rate_limited" ? "error_rate_limited" : "error_email");
      setPhase("form");
      return;
    }
    setPhase("link_sent");
  };

  const soporteLink = (
    <a
      href={`mailto:${SOPORTE_EMAIL}`}
      className="inline-block text-center text-sm text-stone-500 underline underline-offset-2 transition-colors hover:text-acento-dorado"
    >
      {t("contactar_soporte")}
    </a>
  );

  if (phase === "link_sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-2xl border border-borde-sutil bg-stone-900/30 px-6 py-10 text-center sm:px-10"
      >
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-acento-dorado/15 text-acento-dorado">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-texto-claro">{t("enlace_enviado_titulo")}</h2>
        <p className="mt-3 text-stone-400">{t("enlace_enviado_texto", { email })}</p>

        <button
          type="button"
          onClick={() => {
            setPhase("form");
            setErrorKey(null);
          }}
          className="mt-8 w-full rounded-full border border-borde-sutil px-6 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado sm:w-auto sm:px-8"
        >
          {t("volver")}
        </button>

        <div className="mt-6 border-t border-borde-sutil pt-4">{soporteLink}</div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      {GOOGLE_ACTIVO && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-stone-900 transition-transform hover:scale-[1.01]"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
            </svg>
            {t("boton_google")}
          </button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-stone-600">
            <span className="h-px flex-1 bg-borde-sutil" />
            {t("separador_o")}
            <span className="h-px flex-1 bg-borde-sutil" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor={`${idPrefix}-email`} className="block text-sm font-medium text-texto-claro">
          {t("email_label")}
        </label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          autoFocus={autoFocus}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          className="mt-2 w-full rounded-xl border border-borde-sutil bg-stone-900/50 px-4 py-3 text-texto-claro placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none"
        />

        {errorKey && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            role="alert"
            className="mt-4 rounded-lg border border-acento-rojo/40 bg-acento-rojo/10 px-4 py-3 text-sm text-acento-rojo"
          >
            {t(errorKey as Parameters<typeof t>[0])}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={phase === "sending" || !email.trim()}
          className="mt-6 w-full rounded-full bg-acento-dorado px-6 py-3.5 text-sm font-semibold text-fondo-oscuro transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {phase === "sending" ? t("enviando") : t("boton_enviar")}
        </button>
      </form>

      <div className="mt-6 border-t border-borde-sutil pt-4 text-center">{soporteLink}</div>
    </div>
  );
}
