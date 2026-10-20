import { normalizarNumero } from "./pedido-whatsapp";

/**
 * Número de WhatsApp que recibe los pedidos de la tienda, con código de país (ej. 593991234567).
 * NEXT_PUBLIC_* se incrusta al compilar: en Railway hay que ponerla ANTES del build.
 * Si falta, el carrito muestra "Pedidos disponibles pronto" en vez del botón.
 */
export const WHATSAPP_PEDIDOS = normalizarNumero(process.env.NEXT_PUBLIC_WHATSAPP_PEDIDOS);
