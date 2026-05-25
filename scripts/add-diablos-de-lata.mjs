#!/usr/bin/env node
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

const personaje = {
  slug: "diablos-de-lata",
  nombre: "Diablos de lata",
  nombreKichwa: "Supay",
  nombresAlt: ["Diablo de hojalata", "Supay del pase"],
  resumen:
    "Los Diablos de lata son los líderes de las comparsas en los pases riobambeños. Con sus imponentes máscaras rojas confeccionadas en hojalata y sus sonajeros que llenan el aire de un ritmo metálico inconfundible, estos personajes encarnan la rebeldía y el sincretismo religioso que define a los pases chimboracenses: son diablos que no pertenecen al infierno cristiano sino al carnaval andino, figuras de poder que desafían el orden establecido desde adentro de la celebración.",
  descripcion:
    "<h2>Los líderes de la comparsa</h2><p>En el pase riobambeño, los Diablos de lata no marchan al final —van al frente. Son quienes abren el espacio ritual: con sus sonajeros de metal anuncian que la comparsa llega y que el orden cotidiano va a ser interrumpido. Su liderazgo no es de autoridad formal sino de energía ritual: donde el Diablo de lata danza, la multitud se reorganiza.</p><h2>La máscara de hojalata</h2><p>La máscara roja de hojalata es el elemento más característico de este personaje y una obra maestra de la artesanía popular riobambeña. Confeccionada por artesanos especializados que trabajan el metal con martillo y punzón, cada máscara es única: lleva cuernos retorcidos, ojos de vidrio o botones y dientes tallados en el metal. El color rojo no es accidental —en la cosmovisión andina, el rojo es el color del fuego y de la sangre que da vida. El diablo rojo del pase no viene a llevarse almas sino a traer energía vital.</p><h2>Los sonajeros</h2><p>Los Diablos de lata llevan sonajeros en muñecas, tobillos y cintura —construidos con latas de metal, semillas secas o huesos. El sonido es inconfundible: metálico, rítmico, penetrante. Cumple una función ritual: el ruido ahuyenta espíritus negativos y limpia el espacio por donde pasa la comparsa.</p><h2>Ni diablo cristiano ni supay andino</h2><p>La figura del diablo en los pases riobambeños es una de las expresiones más fascinantes del sincretismo colonial andino. Los evangelizadores usaron la figura del diablo para representar todo lo que debía rechazarse —las deidades andinas, los rituales indígenas. Pero las comunidades kichwa tomaron esa figura y la transformaron: el Diablo de lata heredó la máscara aterradora del diablo cristiano y la llenó con el poder del Supay andino, ser que en la cosmovisión original no era malo sino habitante del Uku Pacha, con poder sobre las fuerzas de la tierra.</p>",
  simbolismo:
    "Representan la rebeldía y el sincretismo religioso. La máscara roja de hojalata combina el imaginario del diablo cristiano —introducido para intimidar a las comunidades— con el poder del Supay andino, habitante del Uku Pacha. Los Diablos de lata son la prueba de que la resistencia cultural no siempre toma la forma del rechazo: a veces consiste en tomar el símbolo del opresor y darle vuelta.",
  origen: "mestizo",
  publicadoEn: "2026-05-25T12:00:00",
};

async function main() {
  console.log("Agregando Diablos de lata a Directus...");
  const result = await api("POST", "/items/personajes", personaje);
  if (result?.data?.id) {
    console.log(`✓ Creado con id=${result.data.id}`);
  } else {
    console.log("Sin respuesta exitosa — revisar si ya existe el slug.");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
