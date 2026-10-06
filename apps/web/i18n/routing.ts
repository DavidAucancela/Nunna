import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/personajes": {
      es: "/personajes",
      en: "/characters",
    },
    "/personajes/[slug]": {
      es: "/personajes/[slug]",
      en: "/characters/[slug]",
    },
    "/pases": {
      es: "/pases",
      en: "/celebrations",
    },
    "/pases/[slug]": {
      es: "/pases/[slug]",
      en: "/celebrations/[slug]",
    },
    "/sobre": {
      es: "/sobre",
      en: "/about",
    },
    "/mis-personajes": {
      es: "/mis-personajes",
      en: "/my-characters",
    },
    "/login": {
      es: "/login",
      en: "/login",
    },
  },
});
