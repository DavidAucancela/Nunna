const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function formatearFechaPase(mes: number | null, dia: number | null): string {
  if (mes === null) return "Fecha variable";
  const nombreMes = MESES_ES[mes - 1] ?? "";
  return dia !== null ? `${dia} de ${nombreMes}` : nombreMes;
}

export function esFechaProxima(mes: number | null, dia: number | null): boolean {
  if (mes === null) return false;
  const hoy = new Date();
  const objetivo = new Date(hoy.getFullYear(), mes - 1, dia ?? 1);
  const diff = objetivo.getTime() - hoy.getTime();
  return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}
