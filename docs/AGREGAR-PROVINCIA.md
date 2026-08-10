# Agregar una provincia al mapa nacional

El mapa de `/pases` marca **las provincias que tienen al menos un pase con fecha en el
calendario** (`mes` presente en `pases.json`) — el mismo criterio que ya agrupaba `CalendarioGrid`.
Las provincias sin ningún pase fechado se dibujan como fondo mudo: sin etiqueta, sin estado, no
clicables.

Marcada **no** significa "con recorrido trazado". Al hacer zoom en una provincia se ven sus 4
secciones (Recorrido, Galería, Calendario, Información); si ninguno de sus pases tiene ruta en
`recorrido.json`, la sección Recorrido muestra un estado "próximamente" — el resto de las
secciones igual funcionan con solo `pases.json`. Trazar la ruta (paso 2 y 3 abajo) es lo que
completa esa sección, no lo que decide si la provincia aparece.

> ⚠️ **Verifica el contenido antes de cargarlo.** Fechas, horarios, rutas y personajes de una
> festividad son datos culturales: deben venir de una fuente real (la organización que la
> convoca, el municipio, trabajo de campo propio), no de memoria ni de una estimación.
>
> `docs/fiestas_y_manifestaciones_ecuatorianas.pdf` es el ejemplo de referencia: nueve
> festividades con fuentes institucionales citadas (Instituto Nacional de Patrimonio Cultural,
> Ministerio de Turismo, gobiernos locales, repositorios universitarios). Con ese documento se
> sembraron 9 pases en `pases.json` (2026-08-10) — **ninguno tiene recorrido todavía**: el PDF
> da contexto cultural, no coordenadas de calle. Ya son visibles en `/pases/[slug]`, en la sección
> Calendario de su provincia, y marcan esa provincia en el mapa — solo les falta el paso 2/3 de
> esta guía para que su sección Recorrido deje de decir "próximamente".

---

## Los tres archivos

| Archivo | Qué aporta |
|---|---|
| `apps/web/lib/data/provincias.json` | Catálogo cerrado de las 24 provincias. **Ya está completo — no se toca.** |
| `apps/web/lib/data/pases.json` | La festividad: nombre, fecha, provincia, ciudad, logística |
| `apps/web/lib/data/recorrido.json` | El recorrido: coordenadas, waypoints, fotos |

---

## Paso 1 — La festividad en `pases.json`

```jsonc
{
  "id": "mama-negra-latacunga",
  "slug": "mama-negra-latacunga",        // ⚠ contrato permanente si se imprime en un QR
  "nombre": "La Mama Negra",
  "fechaTipo": "fija",                    // "fija" | "movil"
  "fechaDescripcion": "Texto libre que se muestra bajo el nombre",
  "mes": 11,
  "dia": 11,
  "imagenPortada": "/informacion_pases/mama-negra.jpg",  // o null
  "totalPersonajes": 1,

  "provincia": "cotopaxi",                // ← slug EXACTO de provincias.json
  "ciudad": "Latacunga",

  // Bloque opcional del "recorrido oficial" — se muestra en la tarjeta y en el
  // panel narrador. Si hay "ruta" debe haber "horario" (lo verifica un test).
  "tipo": "Fiesta popular",
  "horario": "10:00 – 16:00",
  "ruta": "Calle Quito → Parque Vicente León → Plaza de El Salto",
  "inicio": "Calle Quito",
  "fin": "Plaza de El Salto",
  "personaje": "Mama Negra",              // solo display
  "personajeSlug": "mama-negra",          // ← debe existir en personajes.json
  "color": "#C89B3C"
}
```

`personajeSlug` es opcional: si la ficha del personaje todavía no existe, deja solo `personaje`
y `validate-data` avisará (advertencia, no bloquea).

## Paso 2 — El recorrido en `recorrido.json`

Opcional para que la provincia *aparezca* (ya aparece con solo el paso 1, si el pase tiene `mes`).
Sin esto, su sección Recorrido queda en "próximamente".

```jsonc
{
  "paseSlug": "mama-negra-latacunga",     // ← debe existir en pases.json
  "paseNombre": "La Mama Negra",
  "centro": [-78.6155, -0.9345],          // [longitud, latitud] — ojo al orden
  "zoom": 14.6,
  "ruta": [],                             // se llena sola en el paso 3
  "waypoints": [
    {
      "progress": 0.08,                   // 0–1: dónde se activa en el scroll
      "coord": [-78.6155, -0.9345],       // ancla del personaje en el mapa
      "personajeSlug": "mama-negra",      // ← debe existir en personajes.json
      "calle": "Calle Quito",
      "dato": "Una frase sobre qué hace el personaje en este punto.",
      "imagen": "/personajes/mama-negra-en-pase-1.webp",
      "imagenesExtra": [],
      "label": "Mama Negra"
    }
  ]
}
```

Deja `"ruta": []` — la geometría real la hornea el script del paso 3.

## Paso 3 — Trazar la ruta sobre calles reales

```bash
node scripts/build-route.mjs
```

Toma los `coord` de los waypoints, le pide a OSRM la ruta que los une, y escribe la geometría
densa en `ruta` alineando los pines a la calle. Necesita red; producción queda estática.

## Paso 4 — Validar

```bash
pnpm validate-data
pnpm --filter @seres-del-pase/web test
```

`validate-data` falla si `provincia` no existe en el catálogo, si `paseSlug` no existe en
`pases.json`, o si un `personajeSlug` no existe en `personajes.json`.

---

## La geometría del mapa (normalmente no hace falta tocarla)

`apps/web/lib/data/provincias-geo.json` tiene las 24 figuras ya proyectadas y está commiteado.
Solo se regenera si cambian los límites o el diseño del lienzo:

```bash
node scripts/build-provincias-svg.mjs
```

Descarga los límites de geoBoundaries (CC BY 4.0), simplifica con Douglas–Peucker, proyecta a un
viewBox fijo y escribe el archivo. Notas:

- **Galápagos va en un recuadro aparte** (`insetRect`): en su posición real dejaría el continente
  diminuto. El recuadro está medido para no pisar la costa de Esmeraldas — agrandarlo la pisa.
- Si sube el peso del archivo, ajusta `TOLERANCIA` en el script (hoy 1.1 → ~28 KB).
- Si geoBoundaries renombra una provincia, el script **falla a propósito** en vez de inventar un
  slug: hay que agregar el nombre nuevo a `NOMBRE_A_SLUG`.
