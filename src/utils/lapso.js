/**
 * Utilidades para manejo de lapsos académicos.
 *
 * El año académico venezolano se divide en 3 lapsos:
 *   1-YYYY → enero–abril
 *   2-YYYY → mayo–agosto
 *   3-YYYY → septiembre–diciembre
 */

/**
 * Calcula el lapso académico actual basado en la fecha del sistema.
 * @param {Date} [fecha] - Fecha de referencia (por defecto: hoy)
 * @returns {string} Ej: "2-2026"
 */
export function getCurrentLapso(fecha = new Date()) {
  const mes = fecha.getMonth() + 1; // 1–12
  const anio = fecha.getFullYear();
  let numero;
  if (mes >= 1 && mes <= 4) numero = 1;
  else if (mes >= 5 && mes <= 8) numero = 2;
  else numero = 3;
  return `${numero}-${anio}`;
}

/**
 * Genera la lista de lapsos disponibles: los 2 anteriores, el actual y los 2 siguientes.
 * @param {string} [lapsoActual] - Ej: "2-2026". Si se omite, usa el calculado.
 * @returns {string[]}
 */
export function getLapsosDisponibles(lapsoActual = getCurrentLapso()) {
  const [num, anio] = parseLapso(lapsoActual);
  const result = [];
  let n = num, y = anio;

  // 2 anteriores
  const anteriores = [];
  let pn = n, py = y;
  for (let i = 0; i < 2; i++) {
    pn--;
    if (pn < 1) { pn = 3; py--; }
    anteriores.unshift(`${pn}-${py}`);
  }

  // 2 siguientes
  const siguientes = [];
  let sn = n, sy = y;
  for (let i = 0; i < 2; i++) {
    sn++;
    if (sn > 3) { sn = 1; sy++; }
    siguientes.push(`${sn}-${sy}`);
  }

  return [...anteriores, `${n}-${y}`, ...siguientes];
}

/**
 * Parsea un string de lapso.
 * @param {string} lapso - Ej: "2-2026"
 * @returns {[number, number]} [numero, año]
 */
export function parseLapso(lapso) {
  const parts = lapso.split("-");
  return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
}

/**
 * Formatea un lapso para mostrar al usuario.
 * @param {string} lapso - Ej: "2-2026"
 * @returns {string} Ej: "Lapso 2 · 2026"
 */
export function formatLapso(lapso) {
  const [num, anio] = parseLapso(lapso);
  const meses = {
    1: "Ene – Abr",
    2: "May – Ago",
    3: "Sep – Dic",
  };
  return `Lapso ${num} · ${anio}  (${meses[num] || ""})`;
}
