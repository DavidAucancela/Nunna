import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: [], error: null }) })),
  },
  supabaseEnabled: true,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import { supabase } from "@/lib/supabase/client";
import { ColeccionProvider, useColeccion, type GuardarStatus } from "./ColeccionProvider";

const mockedSupabase = supabase as unknown as {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    signInWithOtp: ReturnType<typeof vi.fn>;
    signInWithOAuth: ReturnType<typeof vi.fn>;
  };
  rpc: ReturnType<typeof vi.fn>;
};

function wrapper({ children }: { children: ReactNode }) {
  return <ColeccionProvider>{children}</ColeccionProvider>;
}

async function guardar(slug: string): Promise<GuardarStatus> {
  const { result } = renderHook(() => useColeccion(), { wrapper });
  let res!: GuardarStatus;
  await act(async () => {
    res = await result.current.guardarPersonaje(slug);
  });
  return res;
}

describe("guardarPersonaje", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve not_authenticated si getUser() no trae sesión, sin llamar a la RPC", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await guardar("aya-uma")).toBe("not_authenticated");
    expect(mockedSupabase.rpc).not.toHaveBeenCalled();
  });

  it("llama a save_personaje y agrega el slug a la colección", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({ data: [{ status: "ok", slug: "aya-uma" }], error: null });
    const { result } = renderHook(() => useColeccion(), { wrapper });
    let res!: GuardarStatus;
    await act(async () => {
      res = await result.current.guardarPersonaje("aya-uma");
    });
    expect(mockedSupabase.rpc).toHaveBeenCalledWith("save_personaje", { p_slug: "aya-uma" });
    expect(res).toBe("ok");
    expect(result.current.has("aya-uma")).toBe(true);
  });

  it("already_yours también deja el personaje en la colección", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({ data: [{ status: "already_yours", slug: "payaso" }], error: null });
    expect(await guardar("payaso")).toBe("already_yours");
  });

  it("un error de la RPC se degrada a status error, nunca lanza", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await guardar("aya-uma")).toBe("error");
  });

  it("un fallo de red (rpc rejects) también se degrada a status error", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockRejectedValue(new Error("network down"));
    expect(await guardar("aya-uma")).toBe("error");
  });
});

describe("login con retorno a la ficha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/es/personajes/aya-uma");
  });

  it("signInWithEmail vuelve a la ficha con ?origen=qr (sobrevive en otro dispositivo)", async () => {
    const { result } = renderHook(() => useColeccion(), { wrapper });
    await act(async () => {
      await result.current.signInWithEmail("a@b.co", "/es/personajes/aya-uma?origen=qr");
    });
    const opts = mockedSupabase.auth.signInWithOtp.mock.calls[0]![0];
    const url = new URL(opts.options.emailRedirectTo);
    expect(url.pathname).toBe("/es/personajes/aya-uma");
    expect(url.searchParams.get("origen")).toBe("qr");
  });

  it("signInWithEmail sin redirectPath vuelve a la página actual", async () => {
    const { result } = renderHook(() => useColeccion(), { wrapper });
    await act(async () => {
      await result.current.signInWithEmail("a@b.co");
    });
    const opts = mockedSupabase.auth.signInWithOtp.mock.calls[0]![0];
    expect(new URL(opts.options.emailRedirectTo).pathname).toBe("/es/personajes/aya-uma");
  });

  it("signInWithGoogle usa OAuth con el mismo redirect", async () => {
    const { result } = renderHook(() => useColeccion(), { wrapper });
    await act(async () => {
      await result.current.signInWithGoogle("/es/personajes/aya-uma?origen=qr");
    });
    const opts = mockedSupabase.auth.signInWithOAuth.mock.calls[0]![0];
    expect(opts.provider).toBe("google");
    expect(new URL(opts.options.redirectTo).search).toBe("?origen=qr");
  });
});
