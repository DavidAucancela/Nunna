# Plan — Recorrido 3D en primera persona ("Opción B": low-poly estilizado)

> Estado: plan (2026-10-19). Reemplaza el orden de trabajo de `docs/RECORRIDO-3D-BRIEFS.md`, que sigue
> siendo la base de los encargos de arte pero tiene datos viejos — ver §3.3.

## 1. Qué se construye y para qué

**Premio de la colección completa.** Quien guarda los 6 personajes entra, desde `/mis-personajes`, a un
recorrido en primera persona por un pase real: la cámara camina la ruta (calle por calle, ya snapeada
en `recorrido.json`), el scroll la mueve, y personajes, props y multitud entran y salen del encuadre.
Duración objetivo: **2–3 minutos de scroll**, pensado para teléfono (el QR se escanea con el móvil).

**Qué debe sentir quien lo ve:** estar en la acera viendo pasar el pase de tarde — banda, castillo de
fuegos, cada personaje cruzando a pocos metros — y terminar con un cierre emocional (certificado).

### Estado de partida (lo que ya existe y se conserva)
- Riel de cámara + curva desde la ruta real: `lib/pase-camera/{curve,geo-to-local,riel}.ts` (con tests).
- Escena R3F: `PaseCameraScene`, `PaseCameraRig` (cámara persigue el scroll con suavizado),
  `PaseCrowdLayer` (cápsulas instanciadas), `PaseInfoCards`, `PaseBillboard` (planos con el retrato).
- Scroll de la página con pista `sticky` (`PaseCameraGated`) — **no** volver a `ScrollControls` ni a
  pausar Lenis: dejaba la página clavada.
- Montaje: se arma en el servidor (`PaseCameraSection`) y `ColeccionClient` lo muestra solo con 6/6.
- Faltante: no hay modelos `.glb`, ni `public/models/`, ni código que los cargue; entorno = suelo plano +
  niebla; los personajes son planos 2D.

## 2. Alcance de la primera versión (v1)

| Pieza | v1 | Fuera de v1 |
|---|---|---|
| Pase | **Instituto Tecnológico Riobamba** (único con elementos curados) | Los otros pases reales; los demo |
| Personajes 3D | **6** (los de la colección) | Animaciones complejas |
| Elementos del pase | 5 (chamiza, banda, castillo, prioste, vaca loca) | Más props |
| Entorno | 1 set modular de calle/plaza andina genérica | Arquitectura fiel del lugar |
| Multitud | 2 modelos base, ~40 instancias | Multitud con IA/animación |
| Sonido | Ambiente + música de banda + 1 sonido por parada | Audio espacial 3D complejo |
| Móvil | 3 niveles de calidad automáticos + fallback sin WebGL | App nativa |

**Importante:** al ser premio de "los 6", Cucurucho y Danzante deben estar en el recorrido. Hoy
`recorrido.json` solo tiene a Aya Uma, Diablo de lata, Payaso y Perro (ver §5.2).

## 3. Arte — entregables para la persona que modela

### 3.1 Dirección de arte (una sola)
Low-poly estilizado con **colores planos y saturados**, la misma familia visual que las tarjetas
(collage de papel) y los imanes pintados a mano. Sin degradados fotorrealistas, sin contorno grueso de
cómic. Referencias obligatorias, por orden de importancia:
1. Los imanes físicos: `public/personajes/<slug>/<slug>-iman-cuatro-figuras.webp` (y `-hero-figura-*`).
2. El arte de las tarjetas: `<slug>-tarjeta-ilustracion.png`.
3. Fotos reales del pase: `<slug>-pase-*.webp` (proporciones, trajes en movimiento).

### 3.2 Especificación técnica (igual para todo)
- Entrega: **`.glb` binario**, centrado en el origen, apoyado en Y=0, mirando a +Z, **1 unidad = 1 m**.
- Texturas ≤ 1024 px (personajes) / ≤ 512 px (props, entorno); PNG o JPG (se recomprimen aquí).
- Materiales: PBR simple (baseColor; roughness alto; sin emisivos salvo fuego). Máx. **2 materiales**
  por personaje, **1** por prop — es lo que más pesa en draw calls.
- Sin rig obligatorio. Si hay tiempo: ciclo corto de idle/danza (v1.1).
- Pivote en los pies; nombres de nodo en inglés sin espacios; un archivo por pieza.

### 3.3 Lista completa y presupuestos

**Personajes (altura 1,6–1,8 m; 4.000–8.000 triángulos; ≤ 350 KB c/u tras optimizar)**

| # | Pieza | Archivo | Referencia | Notas de brief |
|---|---|---|---|---|
| 1 | Aya Uma | `personajes/aya-uma.glb` | `aya-uma/aya-uma-hero-figura-frontal.webp` | Máscara doble rostro, 12 cuernos con cintas, traje a franjas, fuete. Ver brief 1.1. |
| 2 | Payaso | `personajes/payaso.glb` | `payaso/payaso-hero-figura-traje-rosa.webp` | Retazos, cascabeles, nariz grande. Brief 1.2. |
| 3 | Perro | `personajes/perro.glb` | `perro/perro-hero-figura-mameluco-morado.webp` | Hocico largo, orejas caídas, mameluco, cola. Brief 1.3. |
| 4 | Diablo de lata | `personajes/diablos-de-lata.glb` | `diablos-de-lata/diablos-de-lata-hero-figura-mascara-roja.webp` | Máscara roja de hojalata, cuernos, melena, tachones, sonajeros. Brief 1.4. |
| 5 | **Cucurucho** *(nuevo)* | `personajes/cucurucho.glb` | `cucurucho/cucurucho-hero-figura-frontal.webp` | Hábito **morado** y capirote cónico que borra el rostro (solo dos huecos de ojos), cordón dorado con cruz, cinturón blanco, manos juntas al frente, pies descalzos o con sandalias. Silueta vertical, postura quieta y solemne (contraste con los demás). |
| 6 | **Danzante** *(nuevo)* | `personajes/danzante-yaruquies.glb` | `danzante-yaruquies/danzante-yaruquies-hero-figura-frontal.webp` | Máscara de rostro rosado con bigote, **sombrero de paja dorado adornado**, camisa y pantalón blancos, **pañuelo/capa triangular bordada** en colores sobre el pecho, zapatos negros con detalles dorados. Postura de baile con brazos abiertos. |

**Elementos del pase (1.000–3.000 triángulos; ≤ 200 KB):** `elementos/chamiza.glb`,
`banda-de-pueblo.glb`, `castillo-de-fuegos.glb`, `prioste-con-canasta.glb`, `vaca-loca.glb`.
Briefs 2.1–2.5 del documento original. **Paso previo obligatorio:** moodboard de 2–4 fotos reales por
elemento (sin referencia el resultado se aleja de lo ecuatoriano).

**Entorno (3.000–6.000 triángulos en total):** suelo de adoquín (textura tileable) + **3–6 módulos de
fachada** reutilizables (1–2 pisos, colonial-andino, tierra/blanco/ocre) + silueta lejana de torre de
iglesia. Se parte de un kit CC0 (Kenney / Quaternius) recoloreado.

**Multitud (400–800 triángulos c/u, se instancia ×40):** 2 siluetas de pie sin rasgos faciales (una con
poncho/sombrero, otra sin). Variación por color de instancia, no por modelo.

**Luz:** HDRI de atardecer (Poly Haven, CC0), a 1k.

### 3.4 Orden de entrega (por riesgo)
1. **Payaso + Perro** — validan todo el pipeline técnico con poco detalle simbólico.
2. **Entorno + multitud** — dan contexto visual mientras llegan los demás.
3. **Aya Uma, Diablo de lata, Cucurucho, Danzante** — más detalle cultural.
4. **5 elementos del pase** — tras el moodboard.

### 3.5 Control de calidad de cada entrega (lista de verificación)
Abre sin errores en el visor de glTF; escala correcta (persona = 1,7 m); pivote en los pies; ≤ presupuesto
de triángulos; ≤ 2 materiales; sin texturas > 1024; la silueta se reconoce **a 10 m** (si no se lee de lejos
en la escena, se simplifica detalle y se exagera forma/color).

## 4. Arquitectura técnica

### 4.1 Carga y optimización de modelos
- `public/models/instituto-tecnologico-riobamba/{personajes,elementos,entorno,multitud}/` + `hdri/`.
- Pipeline de recepción con **`gltf-transform`**: `dedup → weld → simplify → resize texturas →
  webp → meshopt` (o Draco). Script `scripts/optimize-models.mjs`; se corre al recibir cada `.glb`.
- Carga con `useGLTF` de drei + `useGLTF.preload` solo de lo cercano. **Carga progresiva por tramos**:
  el chunk de three y los primeros modelos al acercarse la sección; el resto según el progreso del riel.
- Presupuesto total descargable: **≤ 6 MB** (personajes ~1,5 MB, elementos ~0,8 MB, entorno ~0,8 MB,
  multitud ~0,1 MB, HDRI ~0,6 MB, audio aparte y diferido).

### 4.2 Escena
- **Billboards → modelos:** `PaseBillboard` pasa a `PaseParada`, que instancia el `.glb` del personaje o
  del elemento. Se conserva el billboard con el retrato como **fallback de nivel bajo** y mientras carga.
- **Posicionamiento:** `paradaPosition(curve, progress, lado)` ya da el punto al costado del riel; se añade
  rotación (mirar a la cámara o seguir la dirección del desfile) y escala por tipo.
- **Aparece/desaparece:** los objetos fuera de ±X metros de la cámara se ocultan (`visible=false`) y se
  desmontan los que quedan atrás para liberar memoria; fade por niebla, no por opacidad.
- **Entorno:** módulos de fachada a ambos lados del riel, colocados por **semilla fija** a lo largo de
  la curva (determinista, sin repetirse a la vista); suelo con el adoquín; silueta de torre al fondo.
- **Multitud:** `InstancedMesh` con los 2 modelos, ~40 instancias en las aceras, color por instancia.
- **Luz y atmósfera:** HDRI de atardecer + una direccional cálida con sombra suave **solo en nivel
  alto**; niebla cálida; confeti/partículas ligeras cerca de la banda (puntos instanciados).

### 4.3 Cámara y movimiento (aquí se gana la sensación de "estar ahí")
- Altura de ojos 1,6 m; **leve balanceo de pasos** (amplitud mínima, desactivable con `prefers-reduced-motion`).
- **Velocidad variable**: curva de easing por tramos — se frena junto a cada parada para mirarla y
  acelera en los tramos vacíos.
- **Mirada**: lookahead sobre la curva + giro suave hacia el personaje activo al llegar a su parada.
- Suavizado ya implementado (`FOLLOW`); ajustar por dispositivo.
- Todo lo que dependa del scroll sigue leyendo el progreso de `scroll-progress.ts` (sin estado de React por frame).

### 4.4 Narración y UI
- `PaseInfoCards` pasa a seguir el **objeto realmente más cercano a la cámara** (hoy a veces no coincide
  con la figura visible — se vio en las pruebas). Fuente única: `RielParada[]`.
- Barra de progreso del recorrido, botón de sonido, botón "saltar al final", y "ver ficha" por personaje.
- **Apertura:** transición desde `/mis-personajes` ("Has reunido a los 6") con título y cuenta atrás de 1 s.
- **Cierre:** al llegar al final, certificado de colección completa (`CertificadoColeccion`, ya existe) y
  enlace a compartir.
- Texto accesible: cada parada tiene su descripción como texto (lector de pantalla), independiente del canvas.

### 4.5 Sonido
- Ambiente de calle de fondo + **música de banda** que sube al acercarse a la banda de pueblo + un golpe/
  efecto por parada (bombo, cohetes). Volumen según distancia a la parada (`gain = f(distancia)`).
- **Opt-in** (botón de sonido, nunca autoplay), `preload="none"`, archivos ≤ 1 MB cada uno (mp3/ogg).
- Conserva el patrón del hero (`HeroDespertar`): un solo botón para todo el audio.

### 4.6 Rendimiento y niveles de calidad
Meta: **≥ 30 fps** en un Android de gama media de ~2021 y **60 fps** en iPhone reciente.

| Nivel | Cuándo | Qué incluye |
|---|---|---|
| Alto | GPU buena (escritorio, iPhone reciente) | HDRI, sombra suave, 40 instancias, DPR hasta 1,75 |
| Medio | Por defecto en móvil | Sin sombras, 24 instancias, DPR 1–1,25, texturas 512 |
| Bajo | FPS < 30 sostenido (`PerformanceMonitor` de drei) | Billboards 2D en vez de modelos, sin multitud, DPR 1 |
| Sin 3D | Sin WebGL / `prefers-reduced-motion` | Tira de tarjetas (`PaseCameraFallback`, ya existe) |

Presupuestos de escena: **≤ 250 draw calls**, **≤ 150.000 triángulos visibles**, memoria de GPU < 150 MB.
El nivel baja solo si el rendimiento cae (con histéresis para no oscilar) y se recuerda en `sessionStorage`.

### 4.7 Datos
- `recorrido.json`: sumar **Cucurucho y Danzante** como waypoints del pase (con coordenadas ancla de campo)
  y correr `node scripts/build-route.mjs`. Hoy hay 4 personajes en 4 pases reales.
- `lib/pase-camera/elementos-riobamba.json`: añadir `modelo` (ruta del `.glb`), `escala`, `lado`, `rotacion`
  por elemento; para personajes, un mapa `slug → { modelo, escala, rotacion }` (nuevo
  `personajes-modelos.json`). Si falta el `modelo`, se cae al billboard (degradación limpia).
- Tests nuevos: orden de paradas con 6 personajes; `modelo` ausente ⇒ fallback; límites del riel.

## 5. Fases y cronograma

> Supuesto: la persona de arte entrega por tandas (§3.4). Código y arte avanzan en paralelo.

| Fase | Duración | Código (yo) | Arte | Se ve al final |
|---|---|---|---|---|
| **0. Preparación** | 3–4 días | Actualizar los briefs (§3.3); moodboards; carpeta `public/models`; script de optimización; carga con `useGLTF` + fallback billboard | Recibe briefs y referencias; confirma estilo con 1 boceto | Un `.glb` de prueba cargando en la escena |
| **1. Pipeline validado** | 1 semana | Cargar **Payaso y Perro** como `.glb`; posición, escala, rotación; luces básicas; medir FPS en móvil real | Entrega Payaso + Perro | Dos personajes 3D reales en el riel |
| **2. Mundo** | 1,5 semanas | Entorno modular, multitud instanciada, HDRI, niebla, adoquín | Entrega entorno + multitud | Se siente una calle, no un vacío |
| **3. Reparto completo** | 2 semanas | Aya Uma, Diablo de lata, Cucurucho, Danzante; waypoints nuevos + `build-route`; tarjetas sincronizadas con el objeto cercano | Entrega los 4 personajes | Los 6 personajes recorren la ruta |
| **4. Elementos y ritmo** | 1,5 semanas | 5 elementos; velocidad variable de cámara; balanceo; giro hacia el personaje | Entrega 5 elementos | El recorrido tiene ritmo y hitos |
| **5. Sonido y emoción** | 1 semana | Audio por distancia; confeti; apertura y cierre; certificado; compartir | (opcional) música de banda propia | La secuencia completa con principio y fin |
| **6. Móvil y pulido** | 1,5 semanas | Niveles de calidad, `PerformanceMonitor`, carga por tramos, accesibilidad, pruebas en 3+ dispositivos | Retoques de arte detectados en pruebas | Cumple los presupuestos de §4.6 |
| **7. Lanzamiento** | 3–4 días | `pnpm build`, Lighthouse, revisión en iOS Safari real, actualizar `CLAUDE.md` y `CHANGELOG` | — | En producción |

**Total estimado: 8–10 semanas**, limitado por el ritmo de entrega del arte, no por el código.

## 6. Criterios de aceptación (v1 está lista cuando…)
1. Con 6/6 guardados, `/mis-personajes` abre el recorrido; con menos, solo el aviso.
2. Los 6 personajes y los 5 elementos aparecen como modelos 3D, en orden y sin solaparse.
3. La tarjeta de información siempre corresponde a lo que se ve en pantalla.
4. ≥ 30 fps sostenidos en un Android de gama media; descarga inicial ≤ 6 MB; sin tirones al cargar tramos.
5. Funciona sin WebGL y con movimiento reducido (tira de tarjetas); sin sonido hasta que el usuario lo active.
6. El scroll nunca se queda clavado (entrar, salir, volver, recargar a mitad del riel).
7. Tests (`riel`, `geo-to-local`, nuevos) y `type-check`/`lint`/`build` en verde.

## 7. Riesgos y cómo se mitigan

| Riesgo | Mitigación |
|---|---|
| Entregas de arte lentas o desiguales | Orden por riesgo (§3.4); billboard como respaldo por pieza; v1 publicable aunque falten elementos |
| Modelos pesados que traban el móvil | Presupuestos por pieza; `gltf-transform` + meshopt; niveles de calidad; medir en cada fase |
| Estilo desigual entre piezas | Una sola guía y referencias; revisión de cada entrega contra §3.5 antes de integrar |
| Detalle cultural incorrecto | Referencias reales; revisar con el artesano/autor cada personaje antes de dar por cerrada la pieza |
| Incompatibilidad iOS Safari | Probar en dispositivo real desde la fase 1, no al final |
| Mezcla de "premio" y "sorpresa": el usuario no sabe que existe | Aviso visible en `/mis-personajes` desde el primer personaje (ya hecho: "Te faltan n…") |
| Derechos de kits CC0 y HDRI | Registrar fuente y licencia de cada recurso en `docs/RECORRIDO-3D-CREDITOS.md` |

## 8. Decisiones abiertas (necesito tu respuesta antes de la fase 0)
1. ¿La persona de arte entrega en tandas semanales o todo al final? Cambia el orden de las fases.
2. ¿Quién valida cada personaje culturalmente (tú o el artesano)?
3. ¿Hay música de banda propia o se usa una pista con licencia?
4. ¿El recorrido se queda solo en el pase del Instituto Tecnológico, o a futuro se quiere elegir el pase?
5. ¿Presupuesto de pruebas: qué teléfonos reales tienes disponibles (iOS y Android)?
