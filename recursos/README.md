# recursos/ — material del autor que NO se publica

Todo lo que está en `apps/web/public/` se sirve en nunna-ecu.com. Lo que el sitio no usa vive aquí.

| Carpeta | Qué guarda |
|---|---|
| `qr-imprenta/` | QR reales de las tarjetas (`?origen=qr`), uno por personaje. Los genera `node scripts/generate-qr.mjs`. **No moverlos a `public/`**: escanearlos desde la pantalla permitiría guardar el personaje sin tener el imán. |
| `arte-tarjetas/` | Arte V2 de las tarjetas impresas (ilustraciones en collage). |
| `fotos-sin-usar/` | Afiches, fotos de baja resolución y referencias. Si una pasa a la web: copiarla a `public/personajes/<slug>/` con el nombre `<slug>-<seccion>-<descripcion>.<ext>` y referenciarla en `personajes.json`. |

## Estado de `fotos-sin-usar/` (2026-11-16)

Ya se usaron y salieron de aquí: las máscaras de lata (galería del Diablo de lata) y el estante de máscaras (`/sobre`).
Se borraron la comparsa (ya estaba en la galería) y la otra versión del imán del Danzante.

Siguen guardadas:
- `afiche-*`: afiches con texto encima; no sirven de foto.
- `diablo-de-lata-pase-entre-el-publico.png`: lleva un logo de Coca-Cola.
- `referencia-imanes-souvenir.jpg`: referencia de producto.
- `pintura-grupal-sacharuna-diablo-payaso-perro.jpg`: **no publicarla sin saber quién la pintó y tener su permiso**
  (mide 736 px de ancho, el tamaño típico de Pinterest: probablemente no es nuestra).
