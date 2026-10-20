"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { EntregaTienda, Producto } from "@seres-del-pase/types";
import {
  lineasDelCarrito,
  parsearCarritoGuardado,
  reducirCarrito,
  subtotalDe,
  unidadesDe,
  type LineaCarrito,
} from "@/lib/tienda/carrito";
import { CarritoCajon } from "@/modules/tienda/components/CarritoCajon";

const CLAVE = "nunna:carrito";

interface CarritoContextValue {
  /** Ya se leyó el carrito guardado (antes de eso el contador vale 0, igual que en el SSG). */
  listo: boolean;
  catalogo: Producto[];
  entrega: EntregaTienda;
  lineas: LineaCarrito[];
  subtotal: number;
  unidades: number;
  agregar: (id: string, opciones?: { abrir?: boolean }) => void;
  fijarCantidad: (id: string, cantidad: number) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
}

const CarritoContext = createContext<CarritoContextValue | null>(null);

export function CarritoProvider({
  catalogo,
  entrega,
  children,
}: {
  catalogo: Producto[];
  entrega: EntregaTienda;
  children: React.ReactNode;
}) {
  const [items, dispatch] = useReducer(reducirCarrito, []);
  const [listo, setListo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const cargado = useRef(false);

  // Hidratar tras montar: el HTML estático siempre sale con el carrito vacío.
  useEffect(() => {
    let guardado: string | null = null;
    try {
      guardado = window.localStorage.getItem(CLAVE);
    } catch {
      /* almacenamiento bloqueado: el carrito vive solo en memoria */
    }
    dispatch({ tipo: "reemplazar", items: parsearCarritoGuardado(guardado) });
    cargado.current = true;
    setListo(true);
  }, []);

  useEffect(() => {
    if (!cargado.current) return;
    try {
      if (items.length) window.localStorage.setItem(CLAVE, JSON.stringify(items));
      else window.localStorage.removeItem(CLAVE);
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }, [items]);

  const agregar = useCallback((id: string, opciones?: { abrir?: boolean }) => {
    dispatch({ tipo: "agregar", id });
    if (opciones?.abrir !== false) setAbierto(true);
  }, []);
  const fijarCantidad = useCallback((id: string, cantidad: number) => dispatch({ tipo: "fijar", id, cantidad }), []);
  const quitar = useCallback((id: string) => dispatch({ tipo: "quitar", id }), []);
  const vaciar = useCallback(() => dispatch({ tipo: "vaciar" }), []);
  const abrir = useCallback(() => setAbierto(true), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const value = useMemo<CarritoContextValue>(() => {
    const lineas = lineasDelCarrito(items, catalogo);
    return {
      listo,
      catalogo,
      entrega,
      lineas,
      subtotal: subtotalDe(lineas),
      unidades: unidadesDe(lineas),
      agregar,
      fijarCantidad,
      quitar,
      vaciar,
      abierto,
      abrir,
      cerrar,
    };
  }, [items, catalogo, entrega, listo, abierto, agregar, fijarCantidad, quitar, vaciar, abrir, cerrar]);

  return (
    <CarritoContext.Provider value={value}>
      {children}
      <AnimatePresence>{abierto && <CarritoCajon onClose={cerrar} />}</AnimatePresence>
    </CarritoContext.Provider>
  );
}

export function useCarrito(): CarritoContextValue {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
