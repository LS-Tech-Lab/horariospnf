// Normalización, validación y frescura de los datos de identidad del
// docente guardados en localStorage. Extraído de DocenteScan.jsx.

import { fechaHoyVE } from "../../../utils/time";

export const LS_KEY = "pnf_docente_datos";
// Tiempo máximo en horas antes de mostrar aviso de datos viejos
export const LS_TIMEOUT_HORAS = 12;

// Devuelve string de aviso si los datos guardados son sospechosamente viejos o de otro dia
export function avisoStale(datos) {
  if (!datos) return null;
  if (datos.fecha && datos.fecha !== fechaHoyVE()) {
    return `Estos datos fueron guardados el ${datos.fecha}. Si eres el docente indicado, confirma. Si no, toca "No soy yo".`;
  }
  if (datos.guardadoEn) {
    const diffHoras = Math.round((Date.now() - datos.guardadoEn) / 3600000);
    if (diffHoras >= LS_TIMEOUT_HORAS) {
      return `Estos datos llevan ${diffHoras} horas guardados en este dispositivo. Confirma que eres el docente correcto.`;
    }
  }
  return null;
}

// ── Normalizar cédula ────────────────────────────────────────────────────────
// Formato canónico: solo dígitos (sin prefijo V-/E-, sin guion).
// Esto mantiene consistencia con la tabla `docentes` donde las cédulas
// están almacenadas como números puros (ej: "5174134").
// El docente puede ingresar "V-5174134", "V5174134" o "5174134" — todos
// quedan como "5174134" al registrar.
export function normalizarCedula(raw) {
  return raw.replace(/[^0-9]/g, "");
}

// ── Validar formato de cédula ────────────────────────────────────────────────
// FIX (cedula-validacion-formato): antes la cédula era texto 100% libre, sin
// ninguna validación. Eso permitía guardar typos como "18341588" en vez de
// "18341488" (un solo dígito transpuesto), creando una identidad "fantasma"
// duplicada para el mismo docente — que además rompe el cruce de Ausentes,
// porque esa cédula nueva nunca coincide con la vinculada en `docentes`.
// Una cédula venezolana válida tiene entre 6 y 9 dígitos.
export function cedulaTieneFormatoValido(normalizada) {
  return /^\d{6,9}$/.test(normalizada);
}
