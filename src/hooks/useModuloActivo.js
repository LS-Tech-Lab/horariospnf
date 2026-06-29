/**
 * useModuloActivo.js
 *
 * Gestiona qué módulo está activo: null (selector), "horarios" o "asistencias".
 *
 * Auto-selección: si el usuario solo tiene acceso a uno de los dos módulos,
 * el useEffect lo selecciona automáticamente sin pasar por el selector.
 * Si tiene acceso a ambos, queda en null y se muestra el ModuleSelector.
 *
 * IMPORTANTE: este hook debe llamarse incondicionalmente (Regla de Hooks).
 * App.jsx lo invoca antes de cualquier return condicional.
 */

import { useState, useEffect } from "react";

export default function useModuloActivo({ efectiveProfile, efectivePermisos }) {
  const [moduloActivo, setModuloActivo] = useState(null);

  const tieneHorarios =
    efectivePermisos.puedeVerTodo || efectivePermisos.puedeVerSoloSuPrograma;
  const tieneQR =
    efectivePermisos.puedeGestionarQR || efectivePermisos.puedeVerReporteAsistencias;

  // Auto-selección cuando el usuario solo tiene acceso a un módulo.
  // Se ejecuta cada vez que cambia el perfil o se resetea moduloActivo a null.
  useEffect(() => {
    if (!efectiveProfile || moduloActivo) return;
    if (tieneHorarios && tieneQR) return; // ambos: queda en selector
    if (tieneQR)   setModuloActivo("asistencias");
    else           setModuloActivo("horarios");
  }, [
    efectiveProfile,
    moduloActivo,
    tieneHorarios,
    tieneQR,
  ]);

  return { moduloActivo, setModuloActivo, tieneHorarios, tieneQR };
}
