import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "qu", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/personajes": {
      es: "/personajes",
      qu: "/runakunamanta",
      en: "/characters",
    },
    "/personajes/[slug]": {
      es: "/personajes/[slug]",
      qu: "/runakunamanta/[slug]",
      en: "/characters/[slug]",
    },
    "/pases": {
      es: "/pases",
      qu: "/pawkarkuna",
      en: "/celebrations",
    },
    "/pases/[slug]": {
      es: "/pases/[slug]",
      qu: "/pawkarkuna/[slug]",
      en: "/celebrations/[slug]",
    },
    "/calendario": {
      es: "/calendario",
      qu: "/watapura",
      en: "/calendar",
    },
    "/glosario": {
      es: "/glosario",
      qu: "/rimasikuna",
      en: "/glossary",
    },
    "/sobre": {
      es: "/sobre",
      qu: "/imamanta",
      en: "/about",
    },
    // Desbloqueo por código de 6 caracteres (cadenas qu tentativas — revisar con hablante).
    "/desbloquear": {
      es: "/desbloquear",
      qu: "/paskay",
      en: "/unlock",
    },
    // Landing de desbloqueo por personaje — destino del QR impreso en la tarjeta.
    "/desbloquear/[slug]": {
      es: "/desbloquear/[slug]",
      qu: "/paskay/[slug]",
      en: "/unlock/[slug]",
    },
    "/mis-personajes": {
      es: "/mis-personajes",
      qu: "/nuka-runakuna",
      en: "/my-characters",
    },
  },
});
