"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useColeccion, setPendingLoginOnly } from "@/components/auth/ColeccionProvider";
import { AuthOpciones } from "./AuthOpciones";

/**
 * Módulo de ingreso — pantalla dedicada a iniciar sesión con una cuenta ya
 * existente (Google o enlace mágico). El redirect tras el login lo resuelve
 * ColeccionProvider (`setPendingLoginOnly` → `/mis-personajes`), salvo que se pase
 * `redirectPath`: entonces vuelve a esa página (p. ej. /contacto con el pedido elegido).
 */
export function LoginForm({
  autoFocus = true,
  redirectPath,
}: { autoFocus?: boolean; redirectPath?: string | undefined } = {}) {
  const router = useRouter();
  const { ready, session } = useColeccion();
  const [errorInicial, setErrorInicial] = useState<string | null>(null);

  // Ya hay sesión activa: no tiene sentido loguearse de nuevo.
  useEffect(() => {
    if (ready && session && !redirectPath) router.replace("/mis-personajes");
  }, [ready, session, router, redirectPath]);

  // Detectar error en el hash de la URL (ej. otp_expired al volver del magic-link).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    if (params.get("error_code") === "otp_expired" || params.get("error") === "access_denied") {
      setErrorInicial("enlace_expirado");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <AuthOpciones
      key={errorInicial ?? "ok"}
      initialErrorKey={errorInicial}
      onBeforeAuth={redirectPath ? undefined : setPendingLoginOnly}
      redirectPath={redirectPath}
      autoFocus={autoFocus}
      idPrefix="login"
    />
  );
}
