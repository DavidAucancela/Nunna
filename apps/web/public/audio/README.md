# Audio ambiente — Fase 1 "Despertar"

El hero inmersivo de cada personaje con `experiencia: true` reproduce una pista
de ambiente andina **opt-in** (nunca autoplay; el usuario la activa con el botón
de sonido del hero).

Coloca aquí los archivos con estos nombres exactos (referenciados desde
`lib/data/personajes.json` → campo `audioAmbiente`):

| Personaje            | Archivo esperado                    |
|----------------------|-------------------------------------|
| Aya Uma              | `aya-uma-ambiente.mp3`              |
| Payaso               | `payaso-ambiente.mp3`              |
| Perro                | `perro-ambiente.mp3`               |
| Diablos de lata      | `diablos-de-lata-ambiente.mp3`     |
| Cucurucho            | `cucurucho-ambiente.mp3`           |
| Danzante de Yaruquíes | `danzante-yaruquies-ambiente.mp3` |

> Cucurucho y Danzante de Yaruquíes se publicaron sin `audioAmbiente` en `personajes.json`
> (2026-09-10): al no declararse el campo, el botón de sonido no aparece. Para activarlo, añade
> el `.mp3` aquí y el campo `"audioAmbiente": "/audio/<slug>-ambiente.mp3"` a su entrada del JSON.

Recomendaciones:
- Formato `.mp3` (compatibilidad universal), loop sin corte audible, ~30–90 s.
- Mezcla suave: el volumen se fija en 0.32 al activar.
- Si falta el archivo, el botón de sonido aparece pero no reproduce nada
  (no rompe la página). Para ocultarlo, quita `audioAmbiente` del JSON.
- Licencia: usa audio propio o con licencia compatible (CC BY / CC BY-NC-SA).
