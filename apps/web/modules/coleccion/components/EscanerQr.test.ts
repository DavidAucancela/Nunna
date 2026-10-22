import { describe, expect, it } from "vitest";
import { leerQrPersonaje } from "./EscanerQr";

describe("leerQrPersonaje", () => {
  it("lee el QR impreso de la tarjeta", () => {
    expect(leerQrPersonaje("https://nunna-ecu.com/es/personajes/aya-uma?origen=qr")).toEqual({
      slug: "aya-uma",
      pathname: "/es/personajes/aya-uma",
    });
  });

  it("acepta tarjetas viejas sin marcador, sin esquema y en inglés", () => {
    expect(leerQrPersonaje("https://nunna-ecu.com/es/personajes/payaso")?.slug).toBe("payaso");
    expect(leerQrPersonaje("nunna-ecu.com/es/personajes/perro/")?.pathname).toBe("/es/personajes/perro");
    expect(leerQrPersonaje("/en/characters/cucurucho")?.slug).toBe("cucurucho");
  });

  it("rechaza lo que no es una ficha de personaje", () => {
    expect(leerQrPersonaje("https://nunna-ecu.com/es/personajes")).toBeNull();
    expect(leerQrPersonaje("https://ejemplo.com/tienda")).toBeNull();
    expect(leerQrPersonaje("hola")).toBeNull();
  });
});
