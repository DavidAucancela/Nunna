# Plan de escalado — de Riobamba a todo el Ecuador

> Borrador estratégico (2026-07-03). Escala el catálogo de personajes de los pases
> **riobambeños** a los personajes de las festividades populares de **todo el Ecuador**.

---

## Suposiciones (pendientes de confirmar por el autor)

Escritas porque marcan la arquitectura. Si alguna cambia, cambian secciones enteras del plan.

1. **Ancla del catálogo = personajes de festividades**, ahora a escala nacional (Mama Negra,
   Diablada de Píllaro, Corpus Christi, Inti Raymi, Rodeo montubio, etc.), no un "atlas cultural amplio"
   (que también incluiría gastronomía, artesanías, lugares). Esto **preserva intacto el modelo de
   producto** (imán del personaje), el contrato QR y la estructura de la ficha.
   → Si el autor quiere el atlas amplio, la sección "Modelo de datos" se rehace con un tipo `Entrada`
   polimórfico en vez de `Personaje`.
2. **Riobamba = región/festividad piloto.** El contenido actual se migra al nuevo modelo como "la
   primera festividad", y se agregan otras incrementalmente. El sitio sigue desplegable en cada paso.
3. Se mantiene **SSG + JSON en repo + Supabase solo para auth/colección** mientras el volumen lo permita
   (ver "Riesgo: fuente de datos" abajo — este es el supuesto más frágil a escala).

---

## El cambio conceptual en una frase

Hoy el sistema asume **un solo lugar (Riobamba) y una sola tradición (el Pase del Niño)**: todo
personaje pertenece implícitamente a ese contexto. Escalar significa volver **explícita y jerárquica**
esa pertenencia —`Ecuador → Región → Provincia/Ciudad → Festividad → Personaje`— y que toda la UI
(navegación, mapa, filtros, copy) deje de dar por sentado "Riobamba".

---

## Lo que NO cambia (invariantes de diseño)

- **Contrato de URL del QR** (`/[locale]/personajes/<slug>`): sigue siendo permanente. Los imanes de
  Riobamba ya impresos deben seguir funcionando. **Ningún slug existente se renombra.** Ver "Slugs a
  escala" abajo.
- **Modelo de producto**: imán físico + tarjeta + QR → ficha. El código de 6 caracteres y el desbloqueo
  de colección generalizan sin cambios (un código sigue mapeando a un `personaje_slug`).
- **Marca "Nunna"**: es neutra, no dice "Riobamba". Sobrevive tal cual.
- **Taxonomía `origen`** (`prehispanico`/`colonial`/`mestizo`/`mixto`): ya es genérica al mestizaje
  ecuatoriano, no riobambeña. Se conserva; quizá se amplíe (ver abajo).
- **SSG puro** + `generateStaticParams` + i18n es/qu/en.

---

## Modelo de datos nuevo

### Jerarquía geográfica (nueva)
El tipo `Ubicacion` ya existe (`provincia`/`canton`/`ciudad`/`pais`/`lat`/`lon`) pero está **infrautilizado**.
Se formaliza una taxonomía de lugar de primera clase:

```
region:    "sierra" | "costa" | "amazonia" | "insular"   (nuevo enum)
provincia: catálogo cerrado de las 24 provincias           (nuevo lib/data/provincias.json)
ciudad/canton: texto libre con lat/lon
```

### `Festividad` (generaliza el actual `Pase`)
El concepto **"pase"** es riobambeño (Pase del Niño). Se generaliza a **`Festividad`**:

```jsonc
{
  "slug": "pase-del-nino-riobamba",   // ← el "pase" actual pasa a ser UNA festividad
  "nombre": "Pase del Niño",
  "region": "sierra",
  "provincia": "chimborazo",
  "ciudad": "Riobamba",
  "fecha": { "tipo": "fija|movil", "mes": 12, "dia": 20, "descripcion": "..." },
  "centro": [-78.65, -1.66], "zoom": 14.6,   // para el mapa (ya soportado)
  "descripcion": "...",                       // editorial, pendiente por festividad
  "personajeSlugs": ["aya-uma", "payaso", ...]  // relación festividad↔personajes
}
```

- `pases.json` → se renombra conceptualmente a `festividades.json` (el archivo actual queda como los
  registros de la festividad "Pase del Niño Riobamba"; los `recorrido.json` waypoints se anidan por
  festividad, cosa que ya soporta la estructura `{ pases: [...] }`).
- El `recorrido` (mapa "un pase, un camino") pasa a ser un atributo **opcional** de una festividad:
  no toda festividad tiene una ruta procesional trazada.

### `Personaje` (retoques, no reescritura)
- Nuevo campo `festividades: string[]` (slugs) — un personaje puede aparecer en varias (ej. el Aya Uma
  aparece en muchas fiestas andinas, no solo en el Pase del Niño).
- Nuevo campo `ubicacion`/`region` derivable de sus festividades (o explícito para casos multi-región).
- `origen` se conserva; evaluar añadir valores costeños/amazónicos si el mestizaje andino no basta
  (ej. `afroecuatoriano`, `montubio`, `amazonico`). **Aditivo, nunca renombrar los existentes.**

### Slugs a escala (el punto más delicado ⚠)
Con cientos de personajes de todo el país, sube el riesgo de colisión de slugs (dos "Diablo", dos
"Curiquingue" regionales). Reglas:
- Los **slugs actuales de Riobamba se congelan tal cual** (contrato QR). No se re-namespacean.
- Los **nuevos** slugs adoptan convención con desambiguador cuando haga falta:
  `diablo-pillaro`, `mama-negra-latacunga`. La decisión se toma **antes de imprimir** cada lote.
- `slug-aliases.ts` y `not-found.tsx` ya cubren el caso de slug muerto/renombrado — se mantienen.
- `scripts/validate-data.mjs` se extiende para **fallar si hay slugs duplicados** entre personajes
  (hoy ya valida referencias huérfanas; añadir unicidad global).

---

## Cambios de UI / navegación

A escala nacional, un grid plano de personajes deja de servir. Se necesita **navegación por
descubrimiento**:

1. **Filtros/exploración** en `/personajes`: por región, provincia, festividad, origen. (Hoy el grid es
   plano con gating; se le añade una capa de filtro cliente — los datos ya son estáticos.)
2. **Buscador** — ⚠ ojo: se descartó la "búsqueda semántica" (pgvector). Esto NO es eso; es un filtro
   textual simple client-side sobre nombre/festividad/provincia. No reintroducir backend de búsqueda.
3. **Página de festividad** `/festividades/[slug]` (evoluciona la actual `/pases/[slug]`): personajes
   que participan, fechas, ubicación, mapa/recorrido si existe.
4. **Landing por región** (`/region/[slug]` o secciones): Sierra / Costa / Amazonía / Insular como
   puertas de entrada — valiosas para SEO ("personajes de la Costa", "Mama Negra Latacunga").
5. **Mapa nacional**: hoy el mapa es de un recorrido intra-ciudad. Se añade un **mapa de Ecuador** con
   marcadores por festividad/ciudad que hace zoom a la región; el recorrido intra-ciudad se conserva
   como vista de detalle. El `centro`/`zoom` ya viene de datos, así que el motor sirve; es UI nueva.
6. **Calendario**: ya lee `mes`/`dia` de datos genéricamente (hoy: ene, abr, nov, dic). Solo hay que
   quitar el copy hardcodeado "20 de diciembre · Riobamba" y agrupar por región/festividad.

---

## Copy, i18n y ética

- **Purga de "Riobamba/Chimborazo/riobambeño" hardcodeado** en ~15 archivos (hero, footer, about,
  stats, producto, calendario, ficha, manifest, es/qu/en.json). Reemplazar por copy nacional; lo
  específico de un lugar pasa a ser dato (de la festividad), no texto fijo.
- **"Kichwa primero" → "lengua originaria primero" según región.** El ethos actual es serrano. La
  Amazonía y la Costa tienen otras lenguas (Shuar, Achuar, Kichwa amazónico) y contexto afro/montubio.
  El `glosario.json` (hoy 16 entradas solo kichwa) gana un campo `lengua` y deja de ser
  implícitamente kichwa. `altText` obligatorio y citar fuentes siguen igual.
- **hreflang/sitemap** ya están (v3); solo crecen con las rutas nuevas.

---

## Plan por fases

### Fase 1 — Modelo de datos + migración de Riobamba (sin contenido nuevo)
1. Introducir `Region`/`provincias.json`, formalizar `Ubicacion`, tipo `Festividad`.
2. Migrar el contenido actual: `pases.json` → `festividades.json` con la festividad
   "Pase del Niño Riobamba"; añadir `festividades[]`/`region`/`ubicacion` a los 4 personajes.
3. Extender `validate-data.mjs`: unicidad global de slugs + integridad festividad↔personaje↔región.
4. Sin cambios de UI aún salvo los que exige el nuevo modelo. **El sitio se ve igual, la estructura ya
   es nacional por dentro.** Desplegable.

### Fase 2 — Navegación por descubrimiento
1. Filtros (región/provincia/festividad/origen) + buscador textual en `/personajes`.
2. `/festividades/[slug]` (renombre/evolución de `/pases/[slug]`, con redirects 308 por el contrato).
3. Landings por región + su SEO (sitemap, hreflang, OG por región).

### Fase 3 — Mapa nacional
1. Vista Ecuador con marcadores por festividad; zoom a región → detalle → recorrido intra-ciudad actual.
2. Reusa el motor MapLibre existente (tiles CARTO, centro/zoom desde datos).

### Fase 4 — Copy y ética nacional
1. Purga de todo el copy riobambeño hardcodeado (es/qu/en).
2. Glosario multi-lengua (`lengua` por entrada); revisar el ethos "kichwa primero" → "lengua originaria
   por región". Revisión con hablantes nativos de cada lengua (externo, arrancar temprano).

### Fase 5 — Segunda festividad real (validación del modelo)
1. Cargar **una** festividad nueva completa (ej. Mama Negra de Latacunga o Diablada de Píllaro) de punta
   a punta: personajes, fotos, narrativa, ubicación, códigos de desbloqueo, imanes. Esto **prueba** que
   el modelo escala antes de comprometerse con volumen.

### Fase 6+ — Escala de contenido (continuo)
Costa, Amazonía, Insular; más festividades por región; producción de imanes por línea regional.

---

## Mejoras de sistema que el escalado hace necesarias/oportunas

- **⚠ Fuente de datos (el riesgo mayor).** JSON en repo funciona con 9 personajes; con cientos + fotos,
  el repo y los `generateStaticParams` se vuelven pesados y editar JSON a mano es frágil. Opciones a
  evaluar **antes** de la Fase 6: (a) seguir con JSON pero **partido por región/festividad** + editor/
  validación; (b) mover el **contenido** a Supabase (ya está en producción para auth) manteniendo SSG
  con revalidación. La decisión "sin CMS" fue por costo con 9 fichas; a escala nacional el cálculo
  cambia y conviene reabrirla explícitamente, no por default.
- **Pipeline de imágenes**: cientos de fotos exigen convención de nombres estricta, `next/image`
  (ya reactivado en v3) y quizá un CDN. Presupuesto de peso por ficha.
- **Dominio propio** (ya pendiente de v3): pasa de "recomendable" a **bloqueante** — el QR nacional no
  puede depender del subdominio de Railway si se imprime a escala en varias provincias.
- **Contribución de contenido**: a escala nacional el autor no puede documentar todo solo. Pensar un
  flujo (aunque sea un formato JSON + PR guiado) para colaboradores regionales con fuentes citadas.
- **Rendimiento del grid/mapa** con cientos de nodos: paginación/virtualización del grid, clustering de
  marcadores en el mapa.
- **Analítica** por región/festividad para saber qué imanes/fichas se escanean más (guía de producción).

---

## Riesgos y decisiones a tomar

| Riesgo / decisión | Por qué importa | Cuándo decidir |
|---|---|---|
| Ancla "personajes" vs "atlas cultural amplio" | Rehace el modelo de datos entero | **Antes de Fase 1** |
| Fuente de datos JSON vs Supabase a escala | Frágil/costoso si se decide tarde | Antes de Fase 6 |
| Convención de slugs nuevos (desambiguación) | Contrato QR permanente, sin colisiones | Antes de imprimir cada lote |
| Ethos lingüístico multi-lengua | Sensibilidad cultural, no solo técnico | Fase 4, con hablantes |
| Renombrar rutas `/pases` → `/festividades` | Necesita redirects; enlaces externos | Fase 2 |
| Ampliar enum `origen` (afro/montubio/amazónico) | Aditivo, pero afecta estilos visuales | Fase 1, aditivo |

---

## Próximo paso inmediato

Confirmar las 2 suposiciones de arriba (ancla del catálogo + estrategia de migración). Con eso
cerrado, la Fase 1 es acotada y de bajo riesgo: es re-estructuración de datos + migración de Riobamba,
sin tocar la experiencia visible todavía.
