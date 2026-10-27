import { describe, expect, it } from "vitest";
import { cotizar, siguientePromo } from "./precios";
import {
  armarMensajeEnvio,
  armarMensajeRetiro,
  hrefContacto,
  lineaPrecio,
  normalizarNumero,
  urlWhatsApp,
} from "./whatsapp";

describe("normalizarNumero", () => {
  it("deja solo dígitos", () => {
    expect(normalizarNumero("+593 99-123 4567")).toBe("593991234567");
  });
  it("rechaza vacío o demasiado corto", () => {
    expect(normalizarNumero(undefined)).toBeNull();
    expect(normalizarNumero("")).toBeNull();
    expect(normalizarNumero("12345")).toBeNull();
  });
});

describe("urlWhatsApp", () => {
  it("codifica el mensaje", () => {
    expect(urlWhatsApp("593991234567", "¡Hola Nunna!\nImán")).toBe(
      "https://wa.me/593991234567?text=%C2%A1Hola%20Nunna!%0AIm%C3%A1n",
    );
  });
});

describe("cotizar", () => {
  it.each([
    [0, 0, "ninguna"],
    [1, 4, "ninguna"],
    [2, 8, "ninguna"],
    [3, 10, "trio"],
    [4, 14, "trio"],
    [5, 18, "trio"],
    [6, 20, "coleccion"],
  ] as const)("%i imanes → $%i (%s)", (n, total, promo) => {
    const c = cotizar(n);
    expect(c.total).toBe(total);
    expect(c.promo).toBe(promo);
    expect(c.ahorro).toBe(n * 4 - total);
  });
});

describe("siguientePromo", () => {
  it("empuja al 3 × $10 y luego a la colección", () => {
    expect(siguientePromo(0)).toBeNull();
    expect(siguientePromo(1)).toEqual({ promo: "trio", faltan: 2 });
    expect(siguientePromo(3)).toEqual({ promo: "coleccion", faltan: 3 });
    expect(siguientePromo(5)).toEqual({ promo: "coleccion", faltan: 1 });
    expect(siguientePromo(6)).toBeNull();
  });
});

describe("lineaPrecio", () => {
  it("desglosa promos y sueltos", () => {
    expect(lineaPrecio(1, "es")).toBe("1 imán (1 × $4): total $4, sin envío.");
    expect(lineaPrecio(4, "es")).toBe("4 imanes (promo 3 × $10 + 1 × $4): total $14, sin envío.");
    expect(lineaPrecio(6, "es")).toBe("6 imanes (colección completa 6 × $20): total $20, sin envío.");
    expect(lineaPrecio(3, "en")).toBe("3 magnets (3 × $10 deal): total $10, shipping not included.");
  });
});

describe("lineaPrecio sin envío", () => {
  it("el retiro no menciona el envío", () => {
    expect(lineaPrecio(3, "es", { envio: false })).toBe("3 imanes (promo 3 × $10): total $10.");
  });
});

describe("armarMensajeRetiro", () => {
  it("con personajes: lista, total y cuenta", () => {
    expect(
      armarMensajeRetiro({ personajes: ["Diablo Huma", "Payaso", "Perro"], locale: "es", correo: "ana@correo.ec" }),
    ).toBe(
      "¡Hola Nunna! Quiero retirar estos imanes en el Mercado Artesanal La Mariscal (Quito):\n" +
        "• Diablo Huma\n• Payaso\n• Perro\n3 imanes (promo 3 × $10): total $10.\n" +
        "Mi cuenta Nunna: ana@correo.ec\n\n¿Cuándo puedo pasar a retirarlos y cómo pago?",
    );
  });

  it("sin correo no agrega la línea de la cuenta", () => {
    expect(armarMensajeRetiro({ personajes: ["Perro"], locale: "en" })).not.toContain("account");
  });
});

describe("armarMensajeEnvio", () => {
  it("con pedido: plantilla de datos de envío", () => {
    const m = armarMensajeEnvio({ personajes: ["Payaso"], locale: "es" });
    expect(m).toContain("Quiero que me envíen mi pedido:\n• Payaso\n1 imán");
    expect(armarMensajeEnvio({ personajes: ["Payaso"], locale: "es", correo: "a@b.ec" })).toContain(
      "sin envío.\nMi cuenta Nunna: a@b.ec\n",
    );
    expect(m).toContain("Mis datos para el envío:\nNombre:\nCiudad y provincia:\nDirección:\nTeléfono:");
    expect(m.endsWith("¿Cuánto cuesta el envío a mi ciudad?")).toBe(true);
  });

  it("sin pedido: pregunta por el envío", () => {
    expect(armarMensajeEnvio({ personajes: [], locale: "en" })).toBe(
      "Hi Nunna! I'd like to know how much shipping to my city costs.\nCity and province:",
    );
  });
});

describe("hrefContacto", () => {
  it("lleva el personaje en la query", () => {
    expect(hrefContacto("payaso")).toEqual({ pathname: "/contacto", query: { personaje: "payaso" } });
    expect(hrefContacto()).toEqual({ pathname: "/contacto" });
  });
});
