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
  it("frase natural con promo, sueltos y envío", () => {
    expect(lineaPrecio(1, "es")).toBe("Sería 1 imán a $4: $4 más el envío.");
    expect(lineaPrecio(2, "es")).toBe("Serían 2 imanes a $4 cada uno: $8 más el envío.");
    expect(lineaPrecio(3, "es")).toBe("Serían 3 imanes con la promo 3 × $10: $10 más el envío.");
    expect(lineaPrecio(4, "es")).toBe("Serían 4 imanes (promo 3 × $10 + 1 × $4): $14 más el envío.");
    expect(lineaPrecio(6, "es")).toBe("Serían 6 imanes con la colección completa 6 × $20: $20 más el envío.");
    expect(lineaPrecio(3, "en")).toBe("That's 3 magnets with the 3 × $10 deal: $10 plus shipping.");
  });
  it("el retiro no menciona el envío", () => {
    expect(lineaPrecio(3, "es", { envio: false })).toBe("Serían 3 imanes con la promo 3 × $10: $10 en total.");
  });
});

describe("armarMensajeRetiro", () => {
  it("saluda con el nombre de la cuenta", () => {
    expect(
      armarMensajeRetiro({ personajes: ["Diablo Huma", "Payaso", "Perro"], locale: "es", nombre: "Ana Pérez", correo: "ana@correo.ec" }),
    ).toBe(
      "¡Hola Nunna! Soy Ana Pérez.\n" +
        "Me gustaría llevarme estos imanes y pasar a retirarlos al Mercado Artesanal La Mariscal, en Quito:\n" +
        "• Diablo Huma\n• Payaso\n• Perro\nSerían 3 imanes con la promo 3 × $10: $10 en total.\n\n" +
        "¿Qué día puedo pasar por ellos y cómo les pago? ¡Gracias!",
    );
  });

  it("sin nombre usa el correo; sin cuenta, solo el saludo", () => {
    expect(armarMensajeRetiro({ personajes: ["Perro"], locale: "es", correo: "ana@correo.ec" })).toMatch(
      /^¡Hola Nunna! Te escribo desde mi cuenta ana@correo\.ec\.\n/,
    );
    expect(armarMensajeRetiro({ personajes: ["Perro"], locale: "en" })).toMatch(/^Hi Nunna!\n/);
  });
});

describe("armarMensajeEnvio", () => {
  it("con pedido: plantilla de datos de envío", () => {
    const m = armarMensajeEnvio({ personajes: ["Payaso"], locale: "es" });
    expect(m).toContain("Me gustaría pedir estos imanes con envío:\n• Payaso\nSería 1 imán");
    expect(m).toContain("Les dejo mis datos para el envío:\nNombre:\nCiudad y provincia:\nDirección:\nTeléfono:");
    expect(m.endsWith("¿Cuánto me costaría el envío? ¡Gracias!")).toBe(true);
  });

  it("con el nombre de la cuenta no vuelve a pedirlo", () => {
    const m = armarMensajeEnvio({ personajes: ["Payaso"], locale: "es", nombre: "Ana Pérez" });
    expect(m.startsWith("¡Hola Nunna! Soy Ana Pérez.\n")).toBe(true);
    expect(m).not.toContain("Nombre:");
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
