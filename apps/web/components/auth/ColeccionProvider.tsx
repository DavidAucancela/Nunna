"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/site-url";
import { useRouter } from "@/i18n/navigation";
import { WelcomeModal } from "./WelcomeModal";

// ── Tipos ────────────────────────────────────────────────────────────────────

export type GuardarStatus =
  | "ok"
  | "already_yours"
  | "invalid"
  | "not_authenticated"
  | "not_configured"
  | "error";

/** Resultado de `signInWithEmail`: null si ok, o el tipo de fallo. */
export type SignInErrorKind = "not_configured" | "rate_limited" | "error" | null;

interface ColeccionContextValue {
  /** El provider terminó su primera carga (sesión + colección). */
  ready: boolean;
  /** Supabase está configurado (auth + colección). Si es false, no se ofrece guardar. */
  authActiva: boolean;
  session: Session | null;
  user: User | null;
  /** Slugs de personajes guardados por el usuario. */
  coleccion: Set<string>;
  /** ¿El personaje está en la colección? */
  has: (slug: string) => boolean;
  /**
   * Envía un magic-link al email. `redirectPath` (p. ej. la ficha con `?origen=qr`) es a
   * dónde vuelve la persona al abrir el enlace — viaja en la URL, así funciona aunque el
   * correo se abra en otro navegador o dispositivo. Devuelve el tipo de error o null.
   */
  signInWithEmail: (email: string, redirectPath?: string) => Promise<SignInErrorKind>;
  /** Login con Google (OAuth). Vuelve a `redirectPath` (por defecto, la página actual). */
  signInWithGoogle: (redirectPath?: string) => Promise<SignInErrorKind>;
  signOut: () => Promise<void>;
  /** Guarda un personaje en la colección del usuario. Requiere sesión. */
  guardarPersonaje: (slug: string) => Promise<GuardarStatus>;
  /** Recarga la colección desde Supabase. */
  refrescar: () => Promise<void>;
}

const ColeccionContext = createContext<ColeccionContextValue | null>(null);

// ── Cache local (evita parpadeo del nav antes de que responda Supabase) ────────

const CACHE_KEY = "nunna:coleccion";
const LOGIN_ONLY_KEY = "nunna:pending_login_only";
const WELCOME_KEY = "nunna:bienvenida_vista";

function readCache(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeCache(slugs: string[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(slugs));
  } catch {
    /* ignore */
  }
}

/**
 * URL absoluta a la que vuelve la persona tras el login. El sitio responde en más de
 * un dominio (Railway + dominio propio): en producción siempre apunta al canónico
 * (SITE_URL); en desarrollo respeta window.location.origin (incl. la IP de LAN de
 * `next dev`). Sin `path`, vuelve a la página actual.
 */
export function buildRedirectUrl(path?: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const base = process.env.NODE_ENV === "production" ? SITE_URL : window.location.origin;
  return new URL(path ?? window.location.pathname, base).toString();
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function ColeccionProvider({ children }: { children: React.ReactNode }) {
  // Hidratar desde cache solo cuando el gating está activo; si no, set vacío estable.
  const [coleccion, setColeccion] = useState<Set<string>>(() =>
    supabaseEnabled ? new Set(readCache()) : new Set(),
  );
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabaseEnabled);
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();
  // Secuencia para descartar respuestas obsoletas de cargas concurrentes (latest-wins).
  const loadSeqRef = useRef(0);

  const applyColeccion = useCallback((slugs: string[]) => {
    setColeccion(new Set(slugs));
    writeCache(slugs);
  }, []);

  const loadColeccion = useCallback(async () => {
    if (!supabase) return;
    const seq = ++loadSeqRef.current;
    const { data, error } = await supabase.from("user_unlocks").select("personaje_slug");
    // Si llegó una carga más nueva mientras esperábamos, ignorar este resultado.
    if (seq !== loadSeqRef.current) return;
    if (!error && data) {
      applyColeccion(data.map((r) => r.personaje_slug as string));
    }
  }, [applyColeccion]);

  const guardarPersonaje = useCallback(async (slug: string): Promise<GuardarStatus> => {
    if (!supabase) return "not_configured";
    try {
      // getUser() verifica el JWT contra el servidor (no solo localStorage).
      // getSession() puede devolver un token expirado sin saberlo → 400 en la RPC.
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return "not_authenticated";

      const { data, error } = await supabase.rpc("save_personaje", { p_slug: slug });
      if (error) {
        console.error("[guardarPersonaje] error:", error.message);
        return "error";
      }
      const row = (Array.isArray(data) ? data[0] : data) as { status?: string } | null | undefined;
      const status = (row?.status ?? "error") as GuardarStatus;
      if (status === "ok" || status === "already_yours") {
        setColeccion((prev) => {
          const next = new Set(prev).add(slug);
          writeCache([...next]);
          return next;
        });
      }
      return status;
    } catch {
      // Fallo de red/timeout: nunca lanzamos, devolvemos un estado controlado.
      return "error";
    }
  }, []);

  // Fuente única de verdad de la sesión: onAuthStateChange emite INITIAL_SESSION al
  // suscribirse (con la sesión actual o null), así evitamos un getSession en paralelo
  // que dispararía dos cargas de colección a la vez. `active` solo apaga efectos tras
  // desmontar; el estado `ready` se resuelve en el primer evento.
  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (newSession) {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") loadColeccion();
        // Volvió de un login sin personaje que guardar (magic-link "solo iniciar sesión"): siempre
        // aterriza en su colección, con un tutorial breve la primera vez que se logea.
        if (event === "SIGNED_IN" && consumePendingLoginOnly()) {
          router.replace("/mis-personajes");
          try {
            if (!window.localStorage.getItem(WELCOME_KEY)) setShowWelcome(true);
          } catch {
            /* ignore */
          }
        }
      } else {
        applyColeccion([]);
      }
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [applyColeccion, loadColeccion, router]);

  const signInWithEmail = useCallback(
    async (email: string, redirectPath?: string): Promise<SignInErrorKind> => {
      if (!supabase) return "not_configured";
      const emailRedirectTo = buildRedirectUrl(redirectPath);
      const { error } = await supabase.auth.signInWithOtp(
        emailRedirectTo ? { email, options: { emailRedirectTo } } : { email },
      );
      if (!error) return null;
      // Supabase frena el envío de OTP/magic-link (SMTP por defecto o cuota de
      // Resend agotada): distinguirlo de un error genérico evita que la persona
      // piense que su correo está mal escrito cuando en realidad debe esperar.
      if (error.status === 429 || error.code === "over_email_send_rate_limit") return "rate_limited";
      return "error";
    },
    [],
  );

  const signInWithGoogle = useCallback(async (redirectPath?: string): Promise<SignInErrorKind> => {
    if (!supabase) return "not_configured";
    const redirectTo = buildRedirectUrl(redirectPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      ...(redirectTo ? { options: { redirectTo } } : {}),
    });
    return error ? "error" : null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const has = useCallback((slug: string) => coleccion.has(slug), [coleccion]);

  const value = useMemo<ColeccionContextValue>(
    () => ({
      ready,
      authActiva: supabaseEnabled,
      session,
      user: session?.user ?? null,
      coleccion,
      has,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      guardarPersonaje,
      refrescar: loadColeccion,
    }),
    [
      ready,
      session,
      coleccion,
      has,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      guardarPersonaje,
      loadColeccion,
    ],
  );

  return (
    <ColeccionContext.Provider value={value}>
      {children}
      {showWelcome && (
        <WelcomeModal
          onClose={() => {
            try {
              window.localStorage.setItem(WELCOME_KEY, "1");
            } catch {
              /* ignore */
            }
            setShowWelcome(false);
          }}
        />
      )}
    </ColeccionContext.Provider>
  );
}

export function useColeccion(): ColeccionContextValue {
  const ctx = useContext(ColeccionContext);
  if (!ctx) throw new Error("useColeccion debe usarse dentro de <ColeccionProvider>");
  return ctx;
}

/**
 * ¿El personaje está en la colección? SSR-safe: false hasta montar y resolver la
 * sesión, igual en server y primer paint del cliente (sin mismatch de hidratación).
 */
export function useEnColeccion(slug: string): boolean {
  const { ready, has } = useColeccion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && ready && has(slug);
}

/** Marca que el próximo magic-link es un login sin personaje que guardar (sin personaje que canjear). */
export function setPendingLoginOnly() {
  try {
    window.localStorage.setItem(LOGIN_ONLY_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Lee y borra la marca de login sin personaje que guardar (tras volver del magic-link). */
export function consumePendingLoginOnly(): boolean {
  try {
    const v = window.localStorage.getItem(LOGIN_ONLY_KEY);
    if (v) window.localStorage.removeItem(LOGIN_ONLY_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
