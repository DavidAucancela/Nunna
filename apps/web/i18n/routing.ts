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
    "/mis-personajes": {
      es: "/mis-personajes",
      qu: "/nuka-runakuna",
      en: "/my-characters",
    },
  },
});
