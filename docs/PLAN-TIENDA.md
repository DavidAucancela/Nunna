# Plan — Tienda Nunna

> Estado al 2026-10-20: **fase 1 implementada** en la rama `feat/tienda-fase-1` (sin mergear, sin PR).
> Fase 2 sin empezar. Para retomar, ver "Cómo retomar" al final.

## Contexto
El sitio no vendía nada: quien quería un imán no tenía cómo pedirlo. Se vende por fases:
- **Fase 1 (hecha):** página `/tienda` + carrito + **pedido por WhatsApp**. Sin pasarela ni backend nuevo;
  pago y costo de envío se acuerdan por chat.
- **Fase 2 (pendiente):** pago con tarjeta sobre el mismo carrito, cuando haya pasarela y RUC.

## Decisiones del autor (2026-10-19)
| Tema | Decisión |
|---|---|
| Productos | Imán suelto **$4** (×6) · Colección de 6 en **caja de regalo $20** (set y caja = mismo producto) · Figura grande en caja **$12** (×6) |
| Dónde aparece "Comprar" | `/tienda` (+ enlace en navbar y footer) · tarjetas de `/personajes` · inicio (hero y CTA final). La ficha **no** lleva botón en esta fase |
| Entrega | Envío a todo Ecuador (**costo a convenir por WhatsApp**) · Retiro en Quito: Mercado Artesanal La Mariscal, Reina Victoria y Jorge Washington, locales 114, 107 y 103, 9:00–18:00 |
| Pasarela (fase 2) | Sin decidir |
| Número de WhatsApp | Variable `NEXT_PUBLIC_WHATSAPP_PEDIDOS` (la pone el autor) |

## Fase 1 — qué se hizo
| Pieza | Archivo |
|---|---|
| Catálogo + entrega (JSON) | `apps/web/lib/data/tienda.json` |
| Tipos `Producto`, `TipoProducto`, `PuntoRetiro`, `EntregaTienda` | `packages/types/src/index.ts` |
| Servicio (`getProductos`, `getEntrega`) — nombre/imagen salen del personaje | `apps/web/lib/services/tienda.service.ts` (+ test) |
| Lógica pura del carrito (reducer, totales, precio) | `apps/web/lib/tienda/carrito.ts` (+ test) |
| Mensaje de WhatsApp + URL `wa.me` | `apps/web/lib/tienda/pedido-whatsapp.ts` |
| Número de pedidos | `apps/web/lib/tienda/config.ts` |
| Contexto del carrito (localStorage `nunna:carrito`, hidrata tras montar) | `apps/web/components/tienda/CarritoProvider.tsx` |
| Cajón: hoja inferior en móvil / panel derecho en escritorio | `apps/web/modules/tienda/components/CarritoCajon.tsx` |
| Botón agregar, tarjeta de producto, miniatura | `apps/web/modules/tienda/components/{BotonAgregar,ProductoCard,MiniaturaProducto}.tsx` |
| Página `/tienda` (`/shop` en inglés) | `apps/web/app/[locale]/tienda/page.tsx` |
| Ruta, sitemap, layout, header (carrito con contador), footer | `i18n/routing.ts`, `app/sitemap.ts`, `app/[locale]/layout.tsx`, `components/layout/{Header,Footer}.tsx` |
| "Comprar · $4" en `/personajes` (hermano del `<Link>`, no adentro) | `app/[locale]/personajes/page.tsx` |
| Botones en el inicio | `modules/home/components/{HeroSection,CtaFinal}.tsx` |
| Textos es/en (namespace `tienda` + `nav.tienda/carrito`) | `messages/{es,en}.json` |
| Validación de datos | `scripts/validate-data.mjs` (bloque `tienda.json`) |

Precios y disponibilidad: editar `tienda.json`. `disponible: false` → "Próximamente", sin botón.

### Verificado
- type-check, lint, tests (64/64) y `validate-data` (13 productos) pasan.
- Navegador (móvil emulado y escritorio): comprar desde `/personajes` no navega y abre el cajón; contador
  del header; subtotal correcto (2 imanes + set = $28); sin la variable aparece "pronto"; `/en/shop` en inglés.

### Falta verificar / hacer antes de mergear
- [ ] `pnpm build` (no se corrió para no pisar el `.next` del `next dev` abierto) — confirmar que `/tienda` sale SSG.
- [ ] Probar el botón de WhatsApp con un número real en `.env.local` (hoy solo cubierto por tests).
- [ ] Probar en un teléfono real (deslizar la hoja del carrito, scroll de la lista en iOS Safari).
- [ ] `NEXT_PUBLIC_WHATSAPP_PEDIDOS` en Railway **antes** del build (se incrusta al compilar).
- [ ] Fotos de las **figuras grandes** y de la **caja de regalo** (hoy: ilustración de la tarjeta / dibujo de caja).
      Ponerlas en `public/` y referenciarlas con `imagen` en `tienda.json`.
- [ ] Confirmar que hay figura grande de los 6; si falta alguna → `disponible: false`.
- [ ] Abrir PR a `main`.

## Fase 2 — Pago en línea (bosquejo, no implementado)
- **Decidir antes:** pasarela (Payphone — la más usada en Ecuador —, Kushki o PayPal), RUC/RISE, términos
  de venta y devoluciones, tarifa de envío (deja de ser "a convenir").
- Tabla `pedidos` en Supabase (items, total, entrega, estado; RLS), creada solo desde el servidor.
- `app/api/checkout` crea el pago; webhook de confirmación marca el pedido pagado y manda correo por Resend
  (el SMTP ya está configurado).
- El cajón suma "Pagar con tarjeta" junto a WhatsApp. Carrito y catálogo de la fase 1 no cambian.
- Actualizar `/privacidad`.

## Cómo retomar
```bash
git fetch && git checkout feat/tienda-fase-1
git rebase origin/main            # si main avanzó (Header.tsx y messages/*.json son los que más chocan)
pnpm install
pnpm --filter @seres-del-pase/web dev --port 3030   # un solo next dev a la vez
```
Luego seguir la lista "Falta verificar / hacer antes de mergear". Decisiones técnicas completas en
`CLAUDE.md` → "Tienda — fase 1: carrito + pedido por WhatsApp", y `docs/CHANGELOG.md` [0.14.0].
