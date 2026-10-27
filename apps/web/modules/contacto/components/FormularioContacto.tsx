"use client";

import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { IconoWhatsApp } from "@/components/ui/IconoWhatsApp";
import { TARJETA } from "@/modules/personajes/components/TarjetaNunna";
import {
  WHATSAPP_CONTACTO,
  armarMensajeEnvio,
  armarMensajePedido,
  urlWhatsApp,
} from "@/lib/contacto/whatsapp";
import { EntregaContacto } from "./EntregaContacto";
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

/** Personajes → resumen con precio → botón de WhatsApp con el pedido → entrega. */
export function FormularioContacto({
  personajes,
}: {
  personajes: PersonajeContacto[];
}) {
  const t = useTranslations("contacto");
  const locale = useLocale();
  const [elegidos, setElegidos] = useState<string[]>([]);

  // ?personaje=<slug> llega desde "Escríbenos" (ficha, /personajes, Mis personajes).
  // Se lee con window.location para que la página siga siendo estática.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("personaje");
    if (slug && personajes.some((p) => p.slug === slug)) setElegidos([slug]);
  }, [personajes]);

  // En el orden de la tarjeta, no en el orden en que se tocaron.
  const nombres = personajes
    .filter((p) => elegidos.includes(p.slug))
    .map((p) => p.nombre);
  const todos = elegidos.length === personajes.length;
  const elegirTodos = () => setElegidos(personajes.map((p) => p.slug));

  const pedidoHref = WHATSAPP_CONTACTO
    ? urlWhatsApp(
        WHATSAPP_CONTACTO,
        armarMensajePedido({ personajes: nombres, locale }),
      )
    : null;
  const envioHref = WHATSAPP_CONTACTO
    ? urlWhatsApp(
        WHATSAPP_CONTACTO,
        armarMensajeEnvio({ personajes: nombres, locale }),
      )
    : null;

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
      </AnimatePresence>

      <div className="rounded-2xl border border-borde-sutil bg-stone-900/40 p-5 text-center sm:p-6">
        {pedidoHref ? (
          <>
            <a
              href={pedidoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#1FA855] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#1FA855]/20 transition hover:bg-[#1B964C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento-dorado sm:w-auto"
            >
              <IconoWhatsApp className="h-5 w-5" />
              {t("boton")}
            </a>
            <p className="mt-3 text-sm text-stone-500">{t("boton_ayuda")}</p>
          </>
        ) : (
          <p className="text-stone-400">{t("pronto")}</p>
        )}
      </div>

      <div className="pt-6">
        <EntregaContacto envioHref={envioHref} />
      </div>
    </div>
  );
}
