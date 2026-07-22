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

/** Formato del código impreso: 6 caracteres alfanuméricos en mayúsculas. */
export const CODE_RE = /^[A-Z0-9]{6}$/;

// ── Tipos ────────────────────────────────────────────────────────────────────

export type RedeemStatus =
  | "ok"
  | "invalid"
  | "wrong_character"
  | "already_yours"
  | "already_redeemed_by_other"
  | "not_authenticated"
  | "not_configured"
  | "error";

export interface RedeemResult {
  status: RedeemStatus;
  slug?: string | undefined;
}

/** Status detallado de check_code_status — distingue inválido de "otro personaje". */
export type CodeStatus = "valid" | "invalid" | "wrong_character" | "already_redeemed" | "not_configured" | "error";

interface ColeccionContextValue {
  /** El provider terminó su primera carga (sesión + colección). */
  ready: boolean;
  /** Supabase está configurado; si es false, el gating se desactiva (todo visible). */
  gatingActive: boolean;
  session: Session | null;
  user: User | null;
  /** Slugs de personajes desbloqueados por el usuario. */
  coleccion: Set<string>;
  /** ¿El personaje está desbloqueado? */
  has: (slug: string) => boolean;
  /**
   * Envía un magic-link al email. Si se pasa `code`, viaja en la URL del enlace
   * (query param `unlock_code`) para sobrevivir el regreso en OTRO navegador o
   * dispositivo — depender solo de localStorage falla si el correo se abre en
   * un contexto distinto al que llenó el formulario. Devuelve un mensaje de
   * error o null si ok.
   */
  signInWithEmail: (email: string, code?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  /**
   * Verifica si un código existe y está sin canjear (sin auth, paso previo al magic-link).
   * Si se pasa `expectedSlug`, además exige que el código pertenezca a ese personaje.
   */
  checkCodeValid: (code: string, expectedSlug?: string) => Promise<boolean>;
  /**
   * Verifica en tiempo real (sin auth) si un código es válido PARA ESTE personaje,
   * distinguiendo "no existe" de "es de otro personaje" de "ya fue canjeado".
   * Usado por el botón "Verificar" del formulario de desbloqueo combinado.
   */
  checkCodeStatus: (code: string, expectedSlug: string) => Promise<CodeStatus>;
  /**
   * Canjea un código de 6 caracteres. Requiere sesión. Si se pasa `expectedSlug`, el
   * código debe pertenecer a ese personaje o se devuelve status `wrong_character`.
   */
  redeemCode: (code: string, expectedSlug?: string) => Promise<RedeemResult>;
  /** Recarga la colección desde Supabase. */
  refrescar: () => Promise<void>;
}

const ColeccionContext = createContext<ColeccionContextValue | null>(null);

// ── Cache local (evita parpadeo del nav antes de que responda Supabase) ────────

const CACHE_KEY = "nunna:coleccion";
const PENDING_CODE_KEY = "nunna:pending_code";
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

  const checkCodeValid = useCallback(async (code: string, expectedSlug?: string): Promise<boolean> => {
    if (!supabase) return false;
    const normalized = code.trim().toUpperCase();
    if (!CODE_RE.test(normalized)) return false;
    try {
      const { data } = await supabase.rpc("check_code_valid", {
        p_code: normalized,
        p_expected_slug: expectedSlug ?? null,
      });
      return data === true;
    } catch {
      return false;
    }
  }, []);

  const checkCodeStatus = useCallback(async (code: string, expectedSlug: string): Promise<CodeStatus> => {
    if (!supabase) return "not_configured";
    const normalized = code.trim().toUpperCase();
    if (!CODE_RE.test(normalized)) return "invalid";
    try {
      const { data, error } = await supabase.rpc("check_code_status", {
        p_code: normalized,
        p_expected_slug: expectedSlug,
      });
      if (error) return "error";
      const row = (Array.isArray(data) ? data[0] : data) as { status?: string } | null | undefined;
      return (row?.status as CodeStatus) ?? "error";
    } catch {
      return "error";
    }
  }, []);

  const redeemCode = useCallback(
    async (code: string, expectedSlug?: string): Promise<RedeemResult> => {
      if (!supabase) return { status: "not_configured" };
      const normalized = code.trim().toUpperCase();
      // Validación de formato antes de la red: evita llamadas inútiles a la RPC.
      if (!CODE_RE.test(normalized)) return { status: "invalid" };
      try {
        // getUser() verifica el JWT contra el servidor (no solo localStorage).
        // getSession() puede devolver un token expirado sin saberlo → 400 en la RPC.
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return { status: "not_authenticated" };

        const { data, error } = await supabase.rpc("redeem_code", {
          p_code: normalized,
          p_expected_slug: expectedSlug ?? null,
        });
        if (error) {
          console.error("[redeemCode] error:", error.message);
          return { status: "error" };
        }
        const row = (Array.isArray(data) ? data[0] : data) as
          | { status?: string; slug?: string }
          | null
          | undefined;
        const status = (row?.status ?? "error") as RedeemStatus;
        const slug = row?.slug ?? undefined;
        if ((status === "ok" || status === "already_yours") && slug) {
          setColeccion((prev) => {
            const next = new Set(prev).add(slug);
            writeCache([...next]);
            return next;
          });
        }
        return { status, slug };
      } catch {
        // Fallo de red/timeout: nunca lanzamos, devolvemos un estado controlado.
        return { status: "error" };
      }
    },
    [],
  );

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
        // Volvió de un login sin código (magic-link "solo iniciar sesión"): siempre
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

  const signInWithEmail = useCallback(async (email: string, code?: string): Promise<string | null> => {
    if (!supabase) return "not_configured";
    let emailRedirectTo: string | undefined;
    if (typeof window !== "undefined") {
      // El sitio responde en más de un dominio (Railway + dominio propio). Si el
      // enlace se arma con window.location.origin, la persona queda "atada" al
      // dominio que estaba usando al pedirlo — confuso si no es el canónico.
      // En producción, el enlace siempre apunta al dominio canónico (SITE_URL);
      // en local se respeta window.location.origin para poder probar el flujo.
      const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      const base = isLocal ? window.location.origin : SITE_URL;
      const url = new URL(base + window.location.pathname);
      if (code) url.searchParams.set("unlock_code", code);
      emailRedirectTo = url.toString();
    }
    const { error } = await supabase.auth.signInWithOtp(
      emailRedirectTo ? { email, options: { emailRedirectTo } } : { email },
    );
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const has = useCallback((slug: string) => coleccion.has(slug), [coleccion]);

  const value = useMemo<ColeccionContextValue>(
    () => ({
      ready,
      gatingActive: supabaseEnabled,
      session,
      user: session?.user ?? null,
      coleccion,
      has,
      signInWithEmail,
      signOut,
      checkCodeValid,
      checkCodeStatus,
      redeemCode,
      refrescar: loadColeccion,
    }),
    [
      ready,
      session,
      coleccion,
      has,
      signInWithEmail,
      signOut,
      checkCodeValid,
      checkCodeStatus,
      redeemCode,
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
 * Estado de desbloqueo de un personaje, seguro para SSR/hidratación.
 *  - `resolved`: ya sabemos con certeza si está (o no) desbloqueado. Mientras sea
 *    false, el caller debe mostrar el teaser (igual en server y primer paint cliente).
 *  - `unlocked`: el personaje está desbloqueado (o el gating está desactivado).
 *  - `gatingActive`: hay backend; si es false, todo se muestra como antes.
 *
 * Si no hay backend (gatingActive=false) se resuelve de inmediato como desbloqueado,
 * preservando el comportamiento actual y evitando cualquier parpadeo.
 */
export function useDesbloqueo(slug: string) {
  const { ready, gatingActive, has } = useColeccion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const resolved = !gatingActive ? true : mounted && ready;
  const unlocked = !gatingActive || has(slug);
  return { gatingActive, resolved, unlocked };
}

/** Guarda un código para canjearlo automáticamente tras el magic-link. */
export function setPendingCode(code: string) {
  try {
    window.localStorage.setItem(PENDING_CODE_KEY, code.trim().toUpperCase());
  } catch {
    /* ignore */
  }
}

/** Lee y borra el código pendiente (tras volver del magic-link). */
export function consumePendingCode(): string | null {
  try {
    const v = window.localStorage.getItem(PENDING_CODE_KEY);
    if (v) window.localStorage.removeItem(PENDING_CODE_KEY);
    return v;
  } catch {
    return null;
  }
}

/** Marca que el próximo magic-link es un login sin código (sin personaje que canjear). */
export function setPendingLoginOnly() {
  try {
    window.localStorage.setItem(LOGIN_ONLY_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Lee y borra la marca de login sin código (tras volver del magic-link). */
export function consumePendingLoginOnly(): boolean {
  try {
    const v = window.localStorage.getItem(LOGIN_ONLY_KEY);
    if (v) window.localStorage.removeItem(LOGIN_ONLY_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
