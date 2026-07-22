import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
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
import { ColeccionProvider, useColeccion, type RedeemResult } from "./ColeccionProvider";

const mockedSupabase = supabase as unknown as {
  auth: { getUser: ReturnType<typeof vi.fn>; signInWithOtp: ReturnType<typeof vi.fn> };
  rpc: ReturnType<typeof vi.fn>;
};

function wrapper({ children }: { children: ReactNode }) {
  return <ColeccionProvider>{children}</ColeccionProvider>;
}

async function redeem(code: string, expectedSlug?: string): Promise<RedeemResult> {
  const { result } = renderHook(() => useColeccion(), { wrapper });
  let res!: RedeemResult;
  await act(async () => {
    res = await result.current.redeemCode(code, expectedSlug);
  });
  return res;
}

describe("redeemCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza formato inválido sin llegar a la red", async () => {
    const res = await redeem("abc");
    expect(res.status).toBe("invalid");
    expect(mockedSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("devuelve not_authenticated si getUser() no trae sesión", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await redeem("ABC123");
    expect(res.status).toBe("not_authenticated");
  });

  it("normaliza el código a mayúsculas y llama a la RPC redeem_code (sin slug esperado)", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({ data: [{ status: "ok", slug: "aya-uma" }], error: null });
    const res = await redeem("abc123");
    expect(mockedSupabase.rpc).toHaveBeenCalledWith("redeem_code", {
      p_code: "ABC123",
      p_expected_slug: null,
    });
    expect(res).toEqual({ status: "ok", slug: "aya-uma" });
  });

  it("pasa el slug esperado a la RPC cuando se provee", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({ data: [{ status: "ok", slug: "payaso" }], error: null });
    await redeem("abc123", "payaso");
    expect(mockedSupabase.rpc).toHaveBeenCalledWith("redeem_code", {
      p_code: "ABC123",
      p_expected_slug: "payaso",
    });
  });

  it("propaga el status wrong_character (código de otro personaje)", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({
      data: [{ status: "wrong_character", slug: "payaso" }],
      error: null,
    });
    const res = await redeem("ABC123", "aya-uma");
    expect(res.status).toBe("wrong_character");
    expect(res.slug).toBe("payaso");
  });

  it("un error de la RPC se degrada a status error, nunca lanza", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await redeem("ABC123");
    expect(res.status).toBe("error");
  });

  it("un fallo de red (rpc rejects) también se degrada a status error", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockRejectedValue(new Error("network down"));
    const res = await redeem("ABC123");
    expect(res.status).toBe("error");
  });

  it("already_redeemed_by_other no trae slug", async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockedSupabase.rpc.mockResolvedValue({
      data: [{ status: "already_redeemed_by_other" }],
      error: null,
    });
    const res = await redeem("ABC123");
    expect(res.status).toBe("already_redeemed_by_other");
    expect(res.slug).toBeUndefined();
  });
});

describe("checkCodeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza formato inválido sin llegar a la red", async () => {
    const { result } = renderHook(() => useColeccion(), { wrapper });
    let status!: string;
    await act(async () => {
      status = await result.current.checkCodeStatus("abc", "aya-uma");
    });
    expect(status).toBe("invalid");
    expect(mockedSupabase.rpc).not.toHaveBeenCalled();
  });

  it("llama a check_code_status con el código normalizado y el slug esperado", async () => {
    mockedSupabase.rpc.mockResolvedValue({ data: [{ status: "valid" }], error: null });
    const { result } = renderHook(() => useColeccion(), { wrapper });
    let status!: string;
    await act(async () => {
      status = await result.current.checkCodeStatus("abc123", "aya-uma");
    });
    expect(mockedSupabase.rpc).toHaveBeenCalledWith("check_code_status", {
      p_code: "ABC123",
      p_expected_slug: "aya-uma",
    });
    expect(status).toBe("valid");
  });

  it("distingue wrong_character de invalid", async () => {
    mockedSupabase.rpc.mockResolvedValue({ data: [{ status: "wrong_character" }], error: null });
    const { result } = renderHook(() => useColeccion(), { wrapper });
    let status!: string;
    await act(async () => {
      status = await result.current.checkCodeStatus("ABC123", "aya-uma");
    });
    expect(status).toBe("wrong_character");
  });

  it("un error de RPC se degrada a status error, nunca lanza", async () => {
    mockedSupabase.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { result } = renderHook(() => useColeccion(), { wrapper });
    let status!: string;
    await act(async () => {
      status = await result.current.checkCodeStatus("ABC123", "aya-uma");
    });
    expect(status).toBe("error");
  });
});

describe("signInWithEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/es/desbloquear/aya-uma");
  });

  it("incrusta el código en emailRedirectTo (?unlock_code=) para que sobreviva en otro dispositivo/navegador", async () => {
    const { result } = renderHook(() => useColeccion(), { wrapper });
    await act(async () => {
      await result.current.signInWithEmail("persona@example.com", "abc123");
    });
    expect(mockedSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "persona@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000/es/desbloquear/aya-uma?unlock_code=abc123",
      },
    });
  });

  it("sin código, no agrega el query param", async () => {
    const { result } = renderHook(() => useColeccion(), { wrapper });
    await act(async () => {
      await result.current.signInWithEmail("persona@example.com");
    });
    expect(mockedSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "persona@example.com",
      options: { emailRedirectTo: "http://localhost:3000/es/desbloquear/aya-uma" },
    });
  });
});
