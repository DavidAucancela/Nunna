import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// ── Mocks: aislamos el componente del provider real, de next-intl y de las piezas pesadas ──

const guardarPersonaje = vi.fn();
const coleccion = new Set<string>();

vi.mock("@/components/auth/ColeccionProvider", () => ({
  useColeccion: () => ({
    authActiva: true,
    ready: true,
    session: { user: { id: "u1" } },
    coleccion,
    guardarPersonaje,
  }),
  useEnColeccion: () => false,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("./DespertarAnimation", () => ({ DespertarAnimation: () => <div data-testid="despertar" /> }));
vi.mock("./CertificadoColeccion", () => ({ CertificadoColeccion: () => null }));
vi.mock("./EscanerQr", () => ({ EscanerQr: () => null }));
vi.mock("@/modules/auth/components/AuthOpciones", () => ({ AuthOpciones: () => null }));

import { GuardarPersonaje } from "./GuardarPersonaje";

const SLUG = "aya-uma";

function renderFicha() {
  return render(
    <GuardarPersonaje
      slug={SLUG}
      nombre="Aya Uma"
      origen="prehispanico"
      imagenPortada={null}
      accentColor="#C89B3C"
      personajes={[]}
    />,
  );
}

/** Deja correr las promesas pendientes y avanza los temporizadores de los reintentos. */
async function avanzar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("GuardarPersonaje — auto-guardado tras llegar por QR con sesión", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    guardarPersonaje.mockReset();
    coleccion.clear();
    // jsdom de este setup no expone localStorage: un Storage mínimo en memoria basta.
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
    });
    // Llegada por QR vigente (la marca que deja el escaneo / la vuelta del login).
    window.localStorage.setItem(`nunna:qr:${SLUG}`, JSON.stringify({ t: Date.now(), descartado: false }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reintenta un fallo transitorio y celebra al guardar", async () => {
    guardarPersonaje.mockResolvedValueOnce("not_authenticated").mockResolvedValueOnce("ok");
    renderFicha();

    await avanzar(0);
    expect(guardarPersonaje).toHaveBeenCalledTimes(1);

    await avanzar(1500);
    expect(guardarPersonaje).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("despertar")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("si falla tras los reintentos, avisa y permite intentar de nuevo", async () => {
    guardarPersonaje.mockResolvedValue("error");
    renderFicha();

    await avanzar(0);
    await avanzar(1500);
    await avanzar(4000);
    expect(guardarPersonaje).toHaveBeenCalledTimes(3);
    expect(screen.getByRole("alert").textContent).toContain("error_guardar");

    guardarPersonaje.mockResolvedValue("ok");
    fireEvent.click(screen.getByRole("button", { name: "reintentar" }));
    await avanzar(0);
    expect(guardarPersonaje).toHaveBeenCalledTimes(4);

    // Deja terminar la animación de salida del aviso (AnimatePresence lo mantiene mientras sale).
    await avanzar(1000);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByTestId("despertar")).toBeTruthy();
  });

  it("un estado definitivo (invalid) no se reintenta, pero se avisa", async () => {
    guardarPersonaje.mockResolvedValue("invalid");
    renderFicha();

    await avanzar(10_000);
    expect(guardarPersonaje).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("already_yours no muestra error ni celebración", async () => {
    guardarPersonaje.mockResolvedValue("already_yours");
    renderFicha();

    await avanzar(10_000);
    expect(guardarPersonaje).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByTestId("despertar")).toBeNull();
  });
});
