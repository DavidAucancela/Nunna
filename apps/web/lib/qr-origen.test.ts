import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  VIGENCIA_MS,
  conMarcaQr,
  descartarInvitacion,
  invitacionDescartada,
  llegadaQrVigente,
  registrarLlegadaQr,
} from "./qr-origen";

describe("qr-origen", () => {
  // jsdom de este setup no expone localStorage: un Storage mínimo en memoria basta.
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear(),
    });
  });

  it("sin escaneo no hay llegada vigente", () => {
    expect(llegadaQrVigente("aya-uma")).toBe(false);
  });

  it("registra la llegada y vence a las 24 h", () => {
    registrarLlegadaQr("aya-uma", 1000);
    expect(llegadaQrVigente("aya-uma", 1000 + VIGENCIA_MS - 1)).toBe(true);
    expect(llegadaQrVigente("aya-uma", 1000 + VIGENCIA_MS)).toBe(false);
    expect(llegadaQrVigente("payaso", 1000)).toBe(false);
  });

  it("descartar marca la invitación y un nuevo escaneo la reinicia", () => {
    registrarLlegadaQr("aya-uma");
    descartarInvitacion("aya-uma");
    expect(invitacionDescartada("aya-uma")).toBe(true);
    expect(llegadaQrVigente("aya-uma")).toBe(true);
    registrarLlegadaQr("aya-uma");
    expect(invitacionDescartada("aya-uma")).toBe(false);
  });

  it("descartar sin escaneo no crea marca", () => {
    descartarInvitacion("aya-uma");
    expect(llegadaQrVigente("aya-uma")).toBe(false);
  });

  it("conMarcaQr agrega el marcador", () => {
    expect(conMarcaQr("/es/personajes/aya-uma")).toBe("/es/personajes/aya-uma?origen=qr");
  });
});
