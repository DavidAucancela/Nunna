# Briefs de encargo — modelos 3D del recorrido inmersivo (instituto-tecnologico-riobamba)

> ⚠ **Actualización 2026-10-19:** ver `docs/PLAN-RECORRIDO-3D.md`. Cambios que afectan a estos briefs:
> son **6 personajes** (se suman **Cucurucho** y **Danzante**, con brief en §3.3 del plan); las imágenes de
> referencia ya no están en `public/personajes/{slug}.webp` sino en `public/personajes/<slug>/<slug>-hero-figura-*.webp`
> (y los imanes en `<slug>-iman-cuatro-figuras.webp`); y el orden de encargo/fases está en el plan.


Texto listo para copiar/pegar en Meshy, Tripo, Luma Genie, o en un encargo a un modelador
freelance (Fiverr/Upwork/comunidad local). Cubre las 4 piezas de la Fase 3 (plan de referencia:
`.claude/plans/retomemos-una-rama-del-hidden-clover.md`) y el resto del set completo de la Fase 4.

Todo lo generado va a `apps/web/public/models/instituto-tecnologico-riobamba/` — ver la
convención de carpetas en ese plan. No tocar `personajes.json` para referenciar estos archivos:
el pipeline de datos (`elementos-riobamba.json` + un mapeo hermano para personajes) se conecta
después, cuando haya `.glb` reales que cargar.

---

## Estilo global (pegar como contexto antes de cada encargo)

> Low-poly estilizado, colores planos y saturados, bordes suaves — no cartoon con outline grueso
> de cómic, no semi-realista/fotorrealista. Referencia: arte de imanes artesanales ecuatorianos,
> colores primarios vivos, siluetas limpias y legibles a distancia. Todas las piezas de este
> encargo (personajes, props del pase, entorno, figuras de multitud) deben verse como parte de la
> misma familia visual — mismo nivel de detalle, misma paleta de saturación, mismo tratamiento de
> sombras (planas, sin degradados fotorrealistas).

Spec técnico compartido, a incluir siempre en el encargo:
- Formato de entrega: **`.glb` binario** (no `.gltf` + `.bin` + texturas sueltas).
- Texturas: hasta 1024×1024 px (props/entorno hasta 512-1024 px), formato PNG o JPG — se
  recomprimen a WebP en el pipeline de recepción (`gltf-transform`), no hace falta que el
  proveedor entregue WebP.
- Orientación: modelo centrado en el origen, de pie/apoyado sobre el plano Y=0, mirando hacia
  +Z ("adelante").
- Sin rig obligatorio. Si el proveedor puede animar un ciclo de "idle" o "caminar" simple, mejor
  — pero no es requisito de esta primera entrega.

---

## 1. Personajes (4 — prioridad alta, IP propia del proyecto)

Todos parten de un retrato real ya publicado (`apps/web/public/personajes/{slug}.webp`) que
sirve de imagen de referencia directa para el modelador o la herramienta IA (imagen-a-3D).
Altura de referencia en escena: **1.6–1.8 m**. Presupuesto: **4.000–8.000 triángulos, 150–350 KB
por modelo** (post-optimización, no hace falta que el proveedor entregue ya optimizado).

### 1.1 Aya Uma
- **Referencia:** `public/personajes/aya-uma.webp`
- **Ruta de entrega:** `public/models/instituto-tecnologico-riobamba/personajes/aya-uma.glb`
- **Brief:**
  > Personaje ritual andino "Aya Uma" (cabeza del espíritu), el más icónico del pase. Máscara de
  > **doble rostro** (una cara al frente, otra atrás de la cabeza) con **12 cuernos dorados**
  > saliendo en corona, cada uno con una cinta de color distinto (rojo, amarillo, verde
  > predominan). Traje corporal completo cubierto de tela bordada en colores primarios, a franjas
  > — no un uniforme liso. Sostiene en una mano un **fuete** (látigo corto) a media altura, como
  > listo para golpear el suelo. Postura de danza dinámica, no estática — piernas
  > semiflexionadas, torso ligeramente girado.
  > Recomendación de ruta: por el detalle simbólico (cuernos numerados, doble rostro), preferir
  > modelador freelance sobre generación IA pura, o usar IA solo como boceto de partida y pedir
  > limpieza/ajuste manual de cuernos y máscara.

### 1.2 Payaso (Pukllakuk)
- **Referencia:** `public/personajes/payaso.webp`
- **Ruta de entrega:** `public/models/instituto-tecnologico-riobamba/personajes/payaso.glb`
- **Brief:**
  > Personaje "Payaso" del pase andino (no payaso de circo occidental). Máscara de rasgos
  > caricaturizados: nariz grande, mejillas rojizas, sonrisa fija pintada. Sombrero adornado con
  > colores. Traje de **retazos de tela cosidos** en colores contrastantes (rojo, amarillo,
  > verde, naranja) sin patrón geométrico — como un mosaico de parches, no franjas regulares.
  > Cascabeles pequeños cosidos en los bordes de mangas y dobladillo. Postura juguetona/teatral,
  > un brazo extendido como en gesto de broma.
  > Recomendación: buen candidato para primera prueba con IA texto/imagen-a-3D (Meshy/Tripo) —
  > menos detalle simbólico específico que Aya Uma o Diablos de lata.

### 1.3 Perro (Allku)
- **Referencia:** `public/personajes/perro.webp`
- **Ruta de entrega:** `public/models/instituto-tecnologico-riobamba/personajes/perro.glb`
- **Brief:**
  > Personaje "Perro" (Allku), figura entrañable y doméstica del pase. Máscara con **hocico
  > alargado y orejas flácidas caídas** (no orejas paradas). Cuerpo cubierto por un **mameluco
  > acolchado** pintado o bordado con manchas irregulares que imitan pelaje de perro callejero
  > ("chusco") — tonos marrón/beige/blanco en parches, no un patrón uniforme. Cola larga visible
  > en la parte trasera. Postura en cuatro patas o semi-agachada, como si estuviera a punto de
  > correr o ladrar — más baja/horizontal que los demás personajes, no erguida.
  > Recomendación: buen candidato para primera prueba con IA — silueta simple, sin simbolismo
  > numerado que requiera precisión artesanal.

### 1.4 Diablos de lata (Supay)
- **Referencia:** `public/personajes/diablos-de-lata.webp`
- **Ruta de entrega:** `public/models/instituto-tecnologico-riobamba/personajes/diablos-de-lata.glb`
- **Brief:**
  > Personaje "Diablos de lata" (Supay), líder de comparsa. Máscara roja de **hojalata
  > martillada** (superficie metálica trabajada a golpes, no lisa) con **cuernos retorcidos**,
  > ojos tipo botón/vidrio y dientes tallados visibles en una expresión fiera, no cómica.
  > **Melena larga** que enmarca la máscara y cae sobre los hombros, ocultando el cuello.
  > Chaqueta y pechera bordadas con **tachones metálicos** brillantes (puntos/remaches, no lisos).
  > **Sonajeros de lata** visibles en muñecas, tobillos y cintura (pequeños cilindros o discos
  > metálicos colgantes). Postura de mando, al frente de una comparsa — pecho erguido, un brazo
  > en alto.
  > Recomendación de ruta: por el detalle de la hojalata martillada y los tachones, preferir
  > modelador freelance o usar IA solo como boceto de partida con limpieza manual posterior.

---

## 2. Elementos del pase (5 — sin referencia visual propia todavía)

**Importante:** a diferencia de los personajes, hoy `elementos-riobamba.json` solo tiene texto —
no hay ninguna foto/ilustración de referencia para estos 5 elementos. Antes de encargar cualquiera
de estos, arma un moodboard corto (2-4 fotos reales de Google Images / Pinterest por elemento) y
adjúntalo al brief — es dirección de arte mínima que ningún modelador ni herramienta IA puede
inventar de la nada de forma confiable. Presupuesto: **1.000–3.000 triángulos, 80–200 KB por
pieza** (más simples que los personajes, son props/objetos, no figuras articuladas).

### 2.1 Chamiza
- **Ruta:** `public/models/instituto-tecnologico-riobamba/elementos/chamiza.glb`
- **Brief:** Fogata ritual de ramas secas apiladas en forma cónica, prendida (con llamas
  estilizadas de baja poligonización, no partículas realistas). Marca el arranque simbólico del
  recorrido — debe leerse como una hoguera de vísperas, no una fogata de campamento genérica.
  Buen candidato para base CC0 de un pack low-poly de "campfire" (Kenney.nl / Quaternius),
  recoloreada a la paleta del proyecto si hace falta.

### 2.2 Banda de pueblo
- **Ruta:** `public/models/instituto-tecnologico-riobamba/elementos/banda-de-pueblo.glb`
- **Brief:** Grupo compacto de 2-3 músicos populares andinos con instrumentos de viento/percusión
  (bombo, trompeta o similar), en postura de estar tocando en movimiento (no sentados/formales).
  Vestimenta sencilla, sin máscara — son acompañantes del pase, no personajes rituales. Más
  específico culturalmente que la chamiza — mejor encargo puntual o IA con moodboard de bandas de
  pueblo ecuatorianas reales, no un pack genérico de "marching band" occidental.

### 2.3 Castillo de fuegos
- **Ruta:** `public/models/instituto-tecnologico-riobamba/elementos/castillo-de-fuegos.glb`
- **Brief:** Torre pirotécnica alta y esbelta (estructura de carrizo/madera con figuras
  pirotécnicas montadas en niveles), hito visual central de la fiesta — debe sentirse "vertical y
  llamativa" en el riel de cámara, más alta que el resto de elementos. Buen candidato para base
  CC0 de "firework tower"/"castillo" low-poly si existe, o modelado simple desde cero (estructura
  geométrica repetitiva, barata en polígonos).

### 2.4 Prioste con canasta
- **Ruta:** `public/models/instituto-tecnologico-riobamba/elementos/prioste-con-canasta.glb`
- **Brief:** Figura de una persona (sin máscara, vestimenta de gala/mestiza sencilla) cargando o
  sosteniendo una canasta grande con comida/frutas, en postura de estar repartiendo o caminando.
  Representa al organizador/patrocinador del pase. Específico culturalmente — mejor encargo
  puntual o IA con moodboard de "prioste" de fiestas populares ecuatorianas, no un pack genérico.

### 2.5 Vaca loca
- **Ruta:** `public/models/instituto-tecnologico-riobamba/elementos/vaca-loca.glb`
- **Brief:** Armazón de vaca estilizada (estructura ligera tipo "carga al hombro", no una vaca
  realista) con cuernos, decorada con colores vivos, con soportes visibles para fuegos artificiales
  en los cuernos/lomo (los fuegos en sí no hace falta modelarlos, solo los soportes/anclajes).
  Cierra el recorrido — debe leerse como una figura en movimiento/corriendo, postura dinámica no
  estática.

---

## 3. Entorno (calle/plaza) — 1 set modular

- **Ruta:** `public/models/instituto-tecnologico-riobamba/entorno/`
- **Presupuesto:** 3.000–6.000 triángulos en total (suelo + 3-6 piezas de fachada reutilizables).
- **Brief:**
  > Calle/plaza **andina genérica estilizada** — NO reconstrucción fidedigna del lugar real (el
  > costo de modelar arquitectura exacta del Instituto Tecnológico Riobamba no se justifica para
  > esta primera versión; un "casi pero no" fidedigno se nota más que una estilización honesta).
  > Piso de adoquín/empedrado (textura tileable). 3-6 módulos de fachada reutilizables: edificios
  > bajos de 1-2 pisos, estilo colonial-andino (balcones simples, colores tierra/blanco/ocre),
  > pensados para repetirse y rotarse a lo largo del riel sin que se note la repetición. Opcional:
  > una silueta lejana de torre de iglesia (insinuando la Catedral, sin reconstruirla en detalle)
  > como punto de referencia al fondo.
  > Buena opción: partir de un kit CC0 de "town"/"street" low-poly (Kenney.nl, Quaternius) y
  > adaptar colores/proporciones a la paleta del proyecto — mucho más barato que modelar desde
  > cero, y el estilo genérico es justamente lo que este brief pide.

---

## 4. Multitud / espectadores — 1-2 modelos base

- **Ruta:** `public/models/instituto-tecnologico-riobamba/multitud/`
- **Presupuesto:** 400-800 triángulos por modelo base (se reutiliza por *instancing* 20-60 veces
  en la escena — no hace falta más de 1-2 modelos distintos).
- **Brief:**
  > Figura humana de pie, muy simplificada — **silueta genérica sin rasgos faciales**, pensada
  > para verse en grupo a distancia, no de cerca. Postura neutra (de pie, viendo hacia el
  > recorrido). Si el proveedor entrega 2 variantes (ej. una con poncho/sombrero andino, otra sin
  > accesorios), mejor — permite variar color por instancia en el motor sin modelar más figuras.
  > Buena opción: pack CC0 de "people"/"crowd" low-poly (Kenney.nl), recoloreado a la paleta del
  > proyecto.

---

## 5. Iluminación (HDRI) — no es un encargo de modelado

- **Ruta:** `public/models/hdri/atardecer-festivo.hdr`
- No se encarga a un modelador — se descarga de **Poly Haven** (CC0, HDRIs gratuitos), buscando un
  HDRI de atardecer o "golden hour" cálido, y se reprocesa a resolución 1k antes de subirlo al
  repo (no usar el original de alta resolución, innecesario para este uso).

---

## Orden recomendado de encargo

1. **Payaso y Perro** primero — menor detalle simbólico, sirven para validar el pipeline técnico
   completo (`useGLTF` + `gltf-transform` + integración en la escena) con el menor riesgo.
2. **Entorno + multitud** — kits CC0, rápidos de conseguir y adaptar, dan contexto visual mientras
   se resuelve el resto.
3. **Aya Uma y Diablos de lata** — mayor detalle cultural, encargo puntual/freelance.
4. **Los 5 elementos del pase** — arma primero el moodboard de referencia por elemento (paso
   previo obligatorio, ver sección 2), luego encarga en el orden que prefieras.
