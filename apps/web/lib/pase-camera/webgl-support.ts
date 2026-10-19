/**
 * Detección de soporte WebGL — no existe ningún precedente de esto en el repo
 * (los otros mapas usan MapLibre, que ya trae su propio fallback). Necesario
 * para degradar a PaseCameraFallback sin intentar montar el <Canvas> de R3F.
 */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
