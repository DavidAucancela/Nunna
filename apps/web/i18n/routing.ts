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
  },
});
