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
    "/calendario": {
      es: "/calendario",
      en: "/calendar",
    },
    "/sobre": {
      es: "/sobre",
      en: "/about",
    },
    // Landing de desbloqueo por personaje — única ruta de desbloqueo (sin genérico).
    "/desbloquear/[slug]": {
      es: "/desbloquear/[slug]",
      en: "/unlock/[slug]",
    },
    "/mis-personajes": {
      es: "/mis-personajes",
      en: "/my-characters",
    },
  },
});
