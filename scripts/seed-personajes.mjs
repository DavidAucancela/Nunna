#!/usr/bin/env node
/**
 * seed-personajes.mjs
 * Carga los personajes principales de los pases riobambeños en Directus.
 * Uso: node scripts/seed-personajes.mjs
 */

const BASE_URL = process.env.DIRECTUS_URL || "https://directus-production-d593.up.railway.app";
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "oWZPyUD4btoC8GoEwc2sabfD17CBWhPX";

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message ?? res.statusText;
    console.warn(`  ⚠  ${method} ${path} → ${res.status}: ${msg}`);
    return null;
  }
  return data;
}

const PUBLICADO = "2026-05-25T12:00:00";

const personajes = [
  // ── 1. Curiquingue ─────────────────────────────────────────────────────────
  {
    slug: "curiquingue",
    nombre: "Curiquingue",
    nombreKichwa: "Kuriquingui",
    nombresAlt: ["Caracara andino", "Cara-cara"],
    resumen:
      "El Curiquingue —cuyo nombre en kichwa significa «el dorado» o «el brillante»— es uno de los personajes más elegantes y simbólicos de los pases riobambeños. Representación ritual del Phalcoboenus carunculatus, el caracara andino declarado Ave Nacional del Ecuador, este personaje danza siempre en pareja evocando la dualidad complementaria (yanantin) del cosmos kichwa.\n\nEl Curiquingue es señal de buen augurio: su aparición en el pase anuncia prosperidad para la comunidad. Los danzantes imitan con precisión los movimientos del ave real —el caminar altivo, el vuelo rasante, el girar de cabeza— convirtiendo la danza en una forma de conocimiento ecológico transmitido corporalmente.",
    descripcion:
      "<h2>El ave que anuncia la prosperidad</h2><p>El Curiquingue es uno de los pocos personajes del pase que representa directamente a un animal del ecosistema andino. El caracara andino (Phalcoboenus carunculatus) es un ave rapaz de las alturas del Chimborazo —vive entre los 3.000 y 4.800 metros sobre el nivel del mar— y en la cosmovisión kichwa actúa como mensajero entre los Apus (espíritus de las montañas) y el Kay Pacha (el mundo de los humanos).</p><h2>La danza en pareja</h2><p>El Curiquingue siempre danza en pareja —un danzante macho y uno hembra— con trajes diferenciados. El macho lleva tonos oscuros (negro y gris) con pecho blanco bordado; la hembra lleva blanco predominante con franjas de color. Ambos portan tocados con plumas largas que imitan la cresta característica del ave real. La danza reproduce los movimientos del apareamiento del caracara: giros, persecuciones, pasos sincronizados.</p><h2>El traje</h2><p>El traje del Curiquingue es una obra de bordado artesanal. La capa de plumas está confeccionada con tela bordada en punto de Cruz que simula el plumaje del ave. El tocado central —la cresta— puede superar los 40 centímetros de altura. La máscara representa el rostro del caracara con el característico carúnculo rojo alrededor del ojo, elaborado en papel maché pintado.</p><h2>Significado ecológico y cultural</h2><p>Que el Ecuador haya elegido al caracara andino como Ave Nacional no es ajeno a esta tradición. El Curiquingue del pase es una forma de reverencia al ecosistema del páramo: al incluirlo en la celebración, la comunidad reconoce al ave como parte del pacto entre humanos y naturaleza que la Pachamama sostiene.</p>",
    simbolismo:
      "Representa el vínculo entre el mundo animal y el humano, y entre el mundo de los Apus y el Kay Pacha. La danza en pareja encarna el principio del yanantin (dualidad complementaria). Su aparición anuncia buen augurio y prosperidad agrícola. El caracara real, al volar sobre las chacras (parcelas de cultivo), señala dónde está la buena tierra.",
    origen:
      "Prehispánico. La reverencia al caracara andino en las culturas de altura del Chimborazo antecede a la conquista española. Representaciones del ave aparecen en cerámica y textiles de la cultura Puruhá. El traje actual incorpora técnicas de bordado que combinan tradición andina con influencias coloniales del siglo XVIII.",
    publicadoEn: PUBLICADO,
  },

  // ── 2. Sacha Runa ──────────────────────────────────────────────────────────
  {
    slug: "sacha-runa",
    nombre: "Sacha Runa",
    nombreKichwa: "Sacha Runa",
    nombresAlt: ["Hombre del monte", "Salvaje", "Montarás"],
    resumen:
      "El Sacha Runa —«persona del monte» o «ser del bosque» en kichwa— es el personaje que representa al mundo natural indómito, la frontera entre la comunidad humana y el territorio sagrado de la naturaleza. Cubierto de hojas, ramas y musgo, su presencia en el pase recuerda a los danzantes y espectadores que la civilización es frágil y que la Pachamama existía antes y después de los humanos.\n\nEl Sacha Runa actúa como el bufón del pase: interrumpe las danzas, persigue al público, imita a los otros personajes con exageración cómica. Pero detrás de la risa hay un mensaje serio: el monte no está sometido al orden humano, y olvidarlo tiene consecuencias.",
    descripcion:
      "<h2>El que viene del monte</h2><p>En la cosmovisión andina, el sacha (monte, bosque, naturaleza no domesticada) no es un espacio vacío ni peligroso en sentido negativo: es el territorio de los espíritus, de los animales con poder y de las plantas medicinales. El Sacha Runa es el guardián de ese territorio y su embajador en el espacio ritual del pase.</p><h2>El traje</h2><p>El traje del Sacha Runa es el más orgánico de todos los personajes. Se confecciona con hojas frescas de achupalla (Tillandsia), ramas de árbol, musgo, helecho y raíces tejidas sobre una base de tela. El proceso de confección puede tardar varios días y el traje vivo se deteriora durante el pase —lo cual es intencional: la naturaleza tiene su propio ritmo, no el del calendario humano.</p><p>La máscara es especialmente expresiva: rasgos exagerados, cejas pobladas de musgo, cabello de paja. En algunas variantes lleva cornamenta de venado para reforzar la conexión con el mundo animal.</p><h2>El papel del bufón sagrado</h2><p>En muchas culturas del mundo, el bufón tiene un rol sagrado: puede decir verdades que nadie más puede pronunciar, puede transgredir normas que a otros les están vedadas. El Sacha Runa cumple esa función en el pase. Sus interrupciones, persecuciones y burlas no son desorden: son una forma de recordar que el orden establecido es convencional, temporal, y que existe un orden mayor —el de la naturaleza— que lo trasciende.</p><h2>Variante: el Sacha Warmi</h2><p>En algunas comunidades aparece también la Sacha Warmi («mujer del monte»), con características similares pero con atributos femeninos que aluden a la fertilidad de la tierra. La pareja Sacha Runa / Sacha Warmi refuerza el principio del yanantin.</p>",
    simbolismo:
      "Representa la naturaleza indómita y la frontera entre el mundo humano y el mundo salvaje. Su comportamiento disruptivo en el pase recuerda que el orden humano es fragil y que la Pachamama tiene sus propias leyes. El traje orgánico que se deteriora durante la danza es en sí mismo un símbolo: la naturaleza no se preserva, fluye.",
    origen:
      "Prehispánico. Personajes similares aparecen en fiestas de múltiples culturas andinas de Ecuador, Perú y Bolivia. En el contexto de los pases chimboracenses, el Sacha Runa es mencionado en documentos de la Colonia del siglo XVII como «el hombre salvaje» que acompañaba las procesiones. La iglesia colonial intentó suprimir el personaje varias veces sin éxito.",
    publicadoEn: PUBLICADO,
  },

  // ── 3. Payaso ──────────────────────────────────────────────────────────────
  {
    slug: "payaso",
    nombre: "Payaso",
    nombreKichwa: "Pukllakuk",
    nombresAlt: ["Pukllakuk", "Bufón", "Gracioso"],
    resumen:
      "El Payaso del pase riobambeño —llamado Pukllakuk en kichwa, «el que juega»— no es el payaso de circo occidental: es un crítico social disfrazado de entretenimiento. Con su traje de colores estridentes, su máscara de rasgos exagerados y su habilidad para imitar a cualquier persona del público o de la élite local, el Payaso ejerce una función subversiva que las autoridades coloniales nunca lograron suprimir completamente.\n\nDetrás de cada chiste hay una verdad. El Payaso del pase se ríe del cura, del alcalde, del terrateniente, del médico. En el espacio ritual del pase, esa crítica está permitida —incluso celebrada— porque viene envuelta en risa.",
    descripcion:
      "<h2>El crítico con máscara</h2><p>En los pases riobambeños, el Payaso no entretiene pasivamente: actúa, improvisa, interpela. Se acerca al público, lo imita, exagera sus gestos, parodia a las figuras de autoridad que aparecen en la celebración. Esta práctica tiene raíces profundas: en las culturas andinas prehispánicas existían figuras análogas (los llamados «indios gracioso» en documentos coloniales) que cumplían una función ritual de inversión del orden social.</p><h2>El traje</h2><p>El traje del Payaso es el más heterogéneo de todos: no existe un modelo único. Cada payaso construye su traje con retazos de tela de colores contrastantes —rojo, amarillo, verde, naranja— cosidos sin aparente orden estético. Los cascabeles en los bordes del traje y el sombrero de ala ancha son los elementos más constantes. La máscara tiene rasgos caricaturizados: nariz grande, mejillas rojizas, sonrisa fija.</p><h2>La improvisación como arte</h2><p>A diferencia de otros personajes cuya danza sigue coreografías tradicionales, el Payaso improvisa. Su actuación depende del contexto: qué está pasando en el pase ese día, quién es el público, qué noticias o conflictos sociales son relevantes en ese momento. Un buen payaso de pase es un cronista de su tiempo.</p><h2>La memoria del Payaso</h2><p>Los payasos más respetados de Riobamba son reconocidos por décadas de actuación en el pase. Sus chistes y situaciones se transmiten oralmente de generación en generación. Algunos de los gags más famosos sobre autoridades locales del siglo XX siguen siendo representados décadas después de que las personas satirizadas hayan fallecido.</p>",
    simbolismo:
      "Representa la función social de la crítica mediante la risa. En el espacio ritual del pase, el Payaso tiene licencia para decir lo que nadie más puede. Es el guardián de la verdad disfrazado de entretenimiento. Su máscara fija de sonrisa contrasta con la posibilidad de decir cosas dolorosas: la risa como estrategia de supervivencia cultural.",
    origen:
      "La figura tiene raíces prehispánicas (figuras análogas en culturas andinas) pero su forma actual incorpora elementos del teatro colonial español (el gracioso de la comedia del Siglo de Oro) y del circo del siglo XIX. Es uno de los personajes que mejor ilustra la síntesis cultural de los pases riobambeños.",
    publicadoEn: PUBLICADO,
  },

  // ── 4. Rey Moro ────────────────────────────────────────────────────────────
  {
    slug: "rey-moro",
    nombre: "Rey Moro",
    nombreKichwa: "Muru Inka",
    nombresAlt: ["Moro", "Rey Sarraceno"],
    resumen:
      "El Rey Moro es uno de los personajes que mejor evidencia la complejidad histórica de los pases riobambeños: su origen está en las representaciones coloniales de la «Danza de Moros y Cristianos», llevada a América por los evangelizadores españoles del siglo XVI. Sin embargo, en Riobamba, el personaje fue resignificado por las comunidades kichwa y hoy encarna algo muy distinto al enemigo musulmán que los frailes querían representar.\n\nCon su corona elaborada, su capa real y su bastón de mando, el Rey Moro se mueve con dignidad en el pase. Las comunidades lo ven menos como un «infiel» derrotado y más como un rey poderoso: un símbolo de que el poder también existe fuera de la lógica colonial cristiana.",
    descripcion:
      "<h2>De la propaganda colonial a la resignificación kichwa</h2><p>La «Danza de Moros y Cristianos» fue uno de los instrumentos más eficaces de la evangelización colonial: representaba el triunfo del bien (cristiano) sobre el mal (musulmán) y se usaba para legitimar la conquista. Los frailes la llevaron a todas sus misiones en América. Pero algo inesperado ocurrió en las comunidades kichwa de Chimborazo: el personaje del «moro» fue vaciado de su carga negativa y rellenado con nuevos significados.</p><h2>El traje</h2><p>El traje del Rey Moro es el más elaborado y costoso de todos los personajes del pase. La corona —confeccionada en metal, cartón dorado o madera pintada— puede incorporar piedras de colores, plumas y espejos. La capa real está bordada en hilos de oro y plata. El bastón de mando, a veces llamado «cetro», está decorado con cintas de colores que representan los cuatro suyus. El conjunto puede costar varios miles de dólares y suele ser heredado de generación en generación.</p><h2>La danza y su protocolo</h2><p>En el pase, el Rey Moro tiene un protocolo específico: marcha con paso lento y deliberado, hace reverencias en puntos específicos del recorrido (las esquinas de la plaza, frente a la iglesia, frente a las casas de las familias organizadoras) y recibe saludos de los otros personajes. Su presencia da gravedad y solemnidad a la celebración.</p>",
    simbolismo:
      "Representa la complejidad de la síntesis colonial: un personaje nacido como propaganda evangelizadora que fue resignificado por las mismas comunidades que se pretendía convertir. El Rey Moro en el pase riobambeño no es un enemigo derrotado sino un rey poderoso que coexiste con los personajes andinos. Símbolo de resistencia cultural a través de la apropiación.",
    origen:
      "Colonial. Introducido por los frailes franciscanos en el siglo XVI como parte de la «Danza de Moros y Cristianos». Resignificado por las comunidades kichwa de Chimborazo a lo largo de los siglos XVII y XVIII. Hoy es un personaje plenamente integrado en el imaginario de los pases, aunque su origen colonial sea reconocido.",
    publicadoEn: PUBLICADO,
  },

  // ── 5. Capitán ─────────────────────────────────────────────────────────────
  {
    slug: "capitan",
    nombre: "Capitán",
    nombreKichwa: "Kapitán",
    nombresAlt: ["El Capitán", "Capitán del Pase"],
    resumen:
      "El Capitán es el personaje que coordina y lidera el desfile del pase. Con su uniforme militar elaborado —kepis, charreteras doradas, sable y capa— el Capitán abre el paso al resto de los personajes y marca el ritmo de la celebración. En apariencia es un militar español colonial; en la práctica, es la autoridad ritual de la comunidad que ha organizado el pase.\n\nEl cargo de Capitán es una de las dignidades más importantes de un pase. Quien lo asume —generalmente el prioste principal o su representante— ha invertido recursos considerables en la organización de la festividad y asume ante la comunidad la responsabilidad de que todo salga bien.",
    descripcion:
      "<h2>La autoridad ritual</h2><p>En el pase riobambeño, el Capitán no es solo un personaje disfrazado: es la persona real que ha asumido el cargo de prioste (patrocinador) del pase ese año. El traje militar es la forma visible de ese compromiso ante la comunidad. Quitarse el traje antes del final del pase sería una falta grave.</p><h2>El traje</h2><p>El traje del Capitán es de inspiración militar del siglo XIX: kepis (gorra militar) adornado con plumas, casaca azul marino con galones dorados en los hombros, pantalón blanco con franja dorada lateral, botas de cuero lustradas y sable en el costado. Las charreteras —los adornos dorados de los hombros— son el elemento más identificatorio: a más elaboradas, mayor rango del Capitán.</p><h2>El sable y la vara de mando</h2><p>El Capitán porta dos objetos rituales: el sable (que no está afilado y se usa para marcar el ritmo de la marcha golpeándolo contra la vaina) y la vara de mando, un bastón decorado que en algunos pases se pasa de un prioste al siguiente como símbolo de la continuidad de la tradición.</p><h2>El Capitán como institución</h2><p>En las comunidades con pases anuales, existe una lista de familias que se van turnando en el cargo de Capitán. Asumir el cargo es un honor pero también una carga económica: el prioste financia la música, la comida y los gastos de la festividad. Este sistema de reciprocidad (minka) es uno de los mecanismos más antiguos de cohesión social en las comunidades andinas.</p>",
    simbolismo:
      "Representa la autoridad ritual de la comunidad y el compromiso del prioste. El uniforme militar colonial resignificado: quien lo viste no celebra la conquista española sino que asume la responsabilidad de preservar y transmitir la tradición. El sable marca el ritmo de la celebración — la autoridad aquí no es represión sino orden festivo.",
    origen:
      "Colonial tardío / República. El personaje del Capitán en los pases toma su forma actual en el siglo XIX, durante la época republicana, cuando los uniformes militares latinoamericanos se convirtieron en símbolo de autoridad civil. Antes existían figuras similares de autoridad ritual con vestimenta diferente.",
    publicadoEn: PUBLICADO,
  },

  // ── 6. Ángel ───────────────────────────────────────────────────────────────
  {
    slug: "angel",
    nombre: "Ángel",
    nombreKichwa: "Ángel",
    nombresAlt: ["Ángel del pase", "Ángel custodio"],
    resumen:
      "El Ángel es el único personaje del pase riobambeño que proviene exclusivamente del imaginario cristiano colonial. Con sus alas blancas, su túnica inmaculada y su corona de flores, el Ángel representa la presencia de lo sagrado cristiano en medio de la celebración. Sin embargo, en el contexto del pase, la figura del Ángel ha sido integrada en la cosmovisión andina de una manera particular: ya no es solo un mensajero de Dios sino un ser que pertenece al Hanan Pacha.\n\nGeneralmente el Ángel es interpretado por una niña o una adolescente, y su presencia en el pase confiere un aura de inocencia y pureza que contrasta y complementa la energía más intensa de personajes como el Aya Uma o el Sacha Runa.",
    descripcion:
      "<h2>La figura cristiana en el cosmos andino</h2><p>Cuando los evangelizadores españoles introdujeron la figura del ángel en las festividades coloniales, buscaban representar la superioridad del dios cristiano sobre las deidades andinas. Pero las comunidades kichwa procesaron la figura de manera diferente: el Ángel fue integrado como un ser del Hanan Pacha —el mundo de arriba— equivalente a ciertos espíritus mensajeros de la tradición andina.</p><h2>El traje</h2><p>El traje del Ángel es el más elaborado en términos de trabajo artesanal femenino. La túnica blanca está bordada con motivos florales en hilo dorado. Las alas —el elemento central— están confeccionadas en tela o plumas de aves domésticas sobre una estructura de alambre. Pueden alcanzar un metro y medio de envergadura en las versiones más elaboradas. La corona es de flores naturales o de tela, generalmente blancas y doradas.</p><h2>El Ángel y el Niño</h2><p>En los pases del Niño (celebraciones navideñas), el Ángel tiene un rol específico: acompaña la imagen del Niño Jesús y actúa como su guardián simbólico durante el recorrido. En estos pases, el Ángel camina justo detrás de la imagen sagrada, con las manos unidas en posición de oración o extendidas en gesto de bendición.</p>",
    simbolismo:
      "Representa la síntesis colonial-andina: una figura cristiana reinterpretada como habitante del Hanan Pacha. El Ángel da legitimidad cristiana a la celebración (importante durante siglos de control eclesiástico) y al mismo tiempo fue reabsorbido por la cosmovisión kichwa. Su blancura y pureza contrastan con la energía más oscura y compleja de otros personajes, creando el equilibrio que el pase necesita.",
    origen:
      "Colonial. Introducido por los evangelizadores franciscanos y dominicos en los siglos XVI-XVII como parte de los «Autos Sacramentales» (teatro religioso colonial). Integrado paulatinamente en los pases populares a lo largo del siglo XVIII. Hoy es un personaje plenamente kichwa-riobambeño, aunque su forma sea cristiana.",
    publicadoEn: PUBLICADO,
  },

  // ── 7. Perro ───────────────────────────────────────────────────────────────
  {
    slug: "perro",
    nombre: "Perro",
    nombreKichwa: "Allku",
    nombresAlt: ["Allku", "Can del pase"],
    resumen:
      "El Perro —Allku en kichwa— es uno de los personajes más entrañables y menos estudiados de los pases riobambeños. Con su traje de tela que imita el pelaje de un perro y su comportamiento escénico de ladrar, perseguir y juguetear, el Allku introduce un tono doméstico y cotidiano en la celebración que contrasta con la majestuosidad de otros personajes.\n\nEn la cosmovisión andina, el perro tiene un lugar especial: es el compañero del ser humano en vida y, según algunas tradiciones, también en la muerte. El Allku del pase es fiel al Aya Uma —lo sigue, lo protege, lo anuncia— estableciendo entre ambos una relación que refleja la del perro real con su amo.",
    descripcion:
      "<h2>El compañero del Aya Uma</h2><p>En los pases donde aparece, el Perro (Allku) siempre está cerca del Aya Uma. Esta proximidad no es casual: en la mitología kichwa, el perro es el guardián del umbral entre el mundo de los vivos y el mundo de los muertos, el mismo umbral que el Aya Uma transita ritualment. El Allku del pase es el guardián de su guardián.</p><h2>El traje</h2><p>El traje del Perro es uno de los más artesanales del pase. Consiste en una mameluco (enterizo) de tela acolchada que cubre todo el cuerpo, pintado o bordado con manchas de colores que imitan el pelaje de un perro chusco (mestizo). La máscara representa el hocico del animal con orejas flácidas. La cola, cosida en la parte trasera del traje, es uno de los elementos más cómicos: el danzante la mueve con un mecanismo de hilo interno.</p><h2>La actuación del Allku</h2><p>El danzante que interpreta al Perro tiene libertad de improvisación similar al Payaso. Ladra, persigue al público (especialmente a los niños, que huyen y ríen a la vez), finge olisquear el suelo, levanta la «pata» en las esquinas. Su actuación es física y exigente: requiere moverse en cuatro patas durante periodos prolongados.</p><h2>El Allku y la memoria de los ancestros</h2><p>En algunas comunidades de Chimborazo existe la creencia de que los perros ven a los espíritus de los difuntos. En los pases que coinciden con celebraciones relacionadas con los ancestros (como el Corpus Christi, que en la cosmovisión kichwa se superpone con la fiesta de los muertos), el Allku adquiere una dimensión adicional: es el que ve lo que los humanos no pueden ver.</p>",
    simbolismo:
      "Representa el mundo doméstico y la lealtad, en contraste con los personajes más solemnes o salvajes del pase. El Allku es el puente entre lo cotidiano y lo ritual: un animal familiar que en el contexto del pase adquiere dimensiones cósmicas. Su relación con el Aya Uma refleja el vínculo entre el guardián humano y su compañero animal.",
    origen:
      "Prehispánico. El perro (allku) tenía presencia ritual en las culturas andinas antes de la llegada española. En la cultura inca, los perros eran sacrificados en ciertas ceremonias como guías del alma en el Uku Pacha (mundo de abajo). En los pases coloniales, el personaje del Perro fue tolerado por la iglesia por su aparente inocuidad cómica, lo cual permitió que sobreviviera la carga simbólica original.",
    publicadoEn: PUBLICADO,
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log("  Seres del Pase — Carga de personajes");
  console.log("=".repeat(60));

  for (const p of personajes) {
    process.stdout.write(`\n🧑 ${p.nombre} (${p.slug}) ... `);
    const result = await api("POST", "/items/personajes", p);
    if (result?.data?.id) {
      console.log(`✓ id=${result.data.id}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`  ✅ ${personajes.length} personajes cargados.`);
  console.log("=".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
