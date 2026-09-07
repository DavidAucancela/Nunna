"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useColeccion, setPendingLoginOnly } from "@/components/auth/ColeccionProvider";

type Phase = "form" | "sending" | "link_sent";

const SOPORTE_EMAIL = "soporte@nunna-ecu.com";

/**
 * Módulo de ingreso — pantalla dedicada a iniciar sesión con una cuenta ya
 * existente (magic-link, sin código). El redirect tras el login lo resuelve
 * ColeccionProvider (`setPendingLoginOnly` → `/mis-personajes`), igual que el
 * flujo "solo login" que antes vivía embebido en DesbloquearForm.
 */
export function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const { ready, gatingActive, session, signInWithEmail } = useColeccion();

  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Ya hay sesión activa: no tiene sentido loguearse de nuevo.
  useEffect(() => {
    if (ready && session) router.replace("/mis-personajes");
  }, [ready, session, router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    if (!email.trim()) {
      setErrorKey("email_requerido");
      return;
    }
    if (!gatingActive) {
      setErrorKey("no_configurado");
      return;
    }

    setPhase("sending");
    setPendingLoginOnly();
    const err = await signInWithEmail(email.trim());
    if (err) {
      setErrorKey(err === "rate_limited" ? "error_rate_limited" : "error_email");
      setPhase("form");
      return;
    }
    setPhase("link_sent");
  };

  const volver = () => {
    setPhase("form");
    setErrorKey(null);
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
          onClick={volver}
          className="mt-8 w-full rounded-full border border-borde-sutil px-6 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado sm:w-auto sm:px-8"
        >
          {t("volver")}
        </button>

        <div className="mt-6 border-t border-borde-sutil pt-4">{soporteLink}</div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <label htmlFor="login-email" className="block text-sm font-medium text-texto-claro">
        {t("email_label")}
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
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

      <div className="mt-6 border-t border-borde-sutil pt-4 text-center">{soporteLink}</div>
    </form>
  );
}
