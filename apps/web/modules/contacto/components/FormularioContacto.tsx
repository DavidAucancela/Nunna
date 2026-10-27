"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { TARJETA } from "@/modules/personajes/components/TarjetaNunna";
import {
  WHATSAPP_CONTACTO,
  armarMensajeEnvio,
  armarMensajeRetiro,
  urlWhatsApp,
} from "@/lib/contacto/whatsapp";
import { EntregaContacto, type AccesoEntrega } from "./EntregaContacto";
import { ResumenPedido } from "./ResumenPedido";

export interface PersonajeContacto {
  slug: string;
  nombre: string;
  icono?: string | undefined;
  imagen?: string | undefined;
}

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor)
    ? lista.filter((v) => v !== valor)
    : [...lista, valor];
}

/**
 * Personajes → resumen con precio → entrega (envío · pago próx. · retiro). La entrega aparece al
 * elegir el primer personaje y sus botones de WhatsApp piden sesión (si Supabase está activo).
 */
export function FormularioContacto({
  personajes,
}: {
  personajes: PersonajeContacto[];
}) {
  const t = useTranslations("contacto");
  const locale = useLocale();
  const { authActiva, ready, user } = useColeccion();
  const [elegidos, setElegidos] = useState<string[]>([]);

  // ?personaje=<slug> llega desde "Escríbenos" (ficha, /personajes, Mis personajes);
  // ?personajes=a,b vuelve del login con la selección que había. Se lee con window.location
  // para que la página siga siendo estática.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const pedidos = [q.get("personaje"), ...(q.get("personajes") ?? "").split(",")];
    const validos = personajes.map((p) => p.slug).filter((s) => pedidos.includes(s));
    if (validos.length > 0) setElegidos(validos);
  }, [personajes]);

  // En el orden de la tarjeta, no en el orden en que se tocaron.
  const nombres = personajes
    .filter((p) => elegidos.includes(p.slug))
    .map((p) => p.nombre);
  const todos = elegidos.length === personajes.length;
  const elegirTodos = () => setElegidos(personajes.map((p) => p.slug));

  // Sin Supabase (dev) no hay cuentas: los botones quedan libres, igual que el resto del sitio.
  const acceso: AccesoEntrega = !authActiva ? "listo" : !ready ? "cargando" : user ? "listo" : "login";
  const correo = user?.email ?? null;
  const href = (mensaje: string) => (WHATSAPP_CONTACTO ? urlWhatsApp(WHATSAPP_CONTACTO, mensaje) : null);
  const envioHref = href(armarMensajeEnvio({ personajes: nombres, locale, correo }));
  const retiroHref = href(armarMensajeRetiro({ personajes: nombres, locale, correo }));

  // Al volver del login (Google o enlace mágico) la selección sigue marcada.
  const seleccion = personajes.filter((p) => elegidos.includes(p.slug)).map((p) => p.slug);
  const redirectPath =
    typeof window === "undefined"
      ? undefined
      : `${window.location.pathname}?personajes=${seleccion.join(",")}#contacto-entrega`;

  return (
    <div className="space-y-10">
      <section aria-labelledby="contacto-personajes">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="contacto-personajes"
              className="font-serif text-2xl font-bold text-texto-claro"
            >
              {t("personajes_titulo")}
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              {t("personajes_ayuda")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (todos ? setElegidos([]) : elegirTodos())}
            className="rounded-full border border-borde-sutil px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
          >
            {todos
              ? t("quitar_todos")
              : t("elegir_todos", { n: personajes.length })}
          </button>
        </div>
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {personajes.map((p) => {
            const activo = elegidos.includes(p.slug);
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setElegidos((l) => alternar(l, p.slug))}
                  className="group flex w-full flex-col items-center gap-2 rounded-xl p-1 text-center"
                >
                  {/* Mismo círculo que el reverso de la tarjeta: ícono de línea sobre la placa crema. */}
                  <span className="relative block w-full">
                    <span
                      className={`relative block aspect-square w-full overflow-hidden rounded-full border-2 transition-all duration-300 ${
                        activo
                          ? "scale-[1.04] border-acento-dorado shadow-lg shadow-acento-dorado/25"
                          : "border-transparent opacity-45 group-hover:opacity-75"
                      }`}
                      style={{ background: TARJETA.placa }}
                    >
                      {(p.icono ?? p.imagen) && (
                        <Image
                          src={(p.icono ?? p.imagen)!}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 30vw, 120px"
                          className={
                            p.icono
                              ? "object-cover mix-blend-multiply"
                              : "object-cover object-top"
                          }
                        />
                      )}
                    </span>
                    {activo && (
                      <span className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-acento-dorado text-xs font-bold text-fondo-oscuro ring-2 ring-fondo-oscuro">
                        ✓
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-sm leading-tight ${activo ? "text-texto-claro" : "text-stone-400"}`}
                  >
                    {p.nombre}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <AnimatePresence initial={false}>
        {elegidos.length > 0 && (
          <ResumenPedido
            key="resumen"
            cantidad={elegidos.length}
            onCompletar={elegirTodos}
          />
        )}
        {elegidos.length > 0 && (
          <motion.div
            key="entrega"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <EntregaContacto
              envioHref={envioHref}
              retiroHref={retiroHref}
              acceso={acceso}
              correo={correo}
              redirectPath={redirectPath}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
