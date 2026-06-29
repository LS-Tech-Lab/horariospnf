// Hook que escucha el evento `online` y vacía la cola de asistencias
// pendientes guardadas en IndexedDB durante períodos sin conexión.
// Montar una sola vez en App.jsx.
//
// Fix O-2: los registros irrecuperables se eliminan de IDB en lugar de
// reintentar indefinidamente. Se purgan también entradas con TTL > 48 h.

import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerPendientes, eliminarPendiente, purgarExpirados } from '../utils/offlineQueue';

// Códigos que la RPC registrar_asistencia() devuelve cuando el registro
// nunca podrá sincronizarse — eliminar de IDB sin reintentar.
// TOKEN_EXPIRADO      → el token QR venció (código real de la RPC en 0039)
// SESION_INACTIVA     → la sesión fue cerrada por el admin
// SESION_FECHA_INVALIDA → la sesión era de otro día
const CODIGOS_IRRECUPERABLES = new Set([
  'TOKEN_EXPIRADO',
  'SESION_INACTIVA',
  'SESION_FECHA_INVALIDA',
  'TOKEN_INVALIDO',
]);

// Códigos de éxito idempotente: el registro ya está en BD
const CODIGOS_YA_REGISTRADO = new Set([
  'YA_REGISTRADO',
  'YA_REGISTRADO_SALIDA',
]);

export default function useSyncPendientes(showToast) {
  const sync = useCallback(async () => {
    // Fix O-2: purgar entradas expiradas (>48 h) antes de intentar sync
    try { await purgarExpirados(); } catch { /* silencioso */ }

    let pendientes;
    try {
      pendientes = await obtenerPendientes();
    } catch {
      return; // IndexedDB no disponible — ignorar
    }

    if (!pendientes?.length) return;

    let sincronizados = 0;
    let fallidos      = 0;
    let irrecuperables = 0;

    for (const item of pendientes) {
      const { id, creadoEn, ...payload } = item;
      try {
        const { data } = await supabase.rpc('registrar_asistencia', payload);

        if (data?.ok || CODIGOS_YA_REGISTRADO.has(data?.codigo)) {
          // Registrado correctamente o ya estaba en BD (idempotente)
          await eliminarPendiente(id);
          sincronizados++;
        } else if (CODIGOS_IRRECUPERABLES.has(data?.codigo)) {
          // Fix O-2: el registro nunca podrá sincronizarse → purgar de IDB
          await eliminarPendiente(id);
          irrecuperables++;
        } else {
          // Error transitorio (red, Supabase caído, etc.) → reintentar luego
          fallidos++;
        }
      } catch {
        fallidos++;
      }
    }

    if (sincronizados > 0) {
      showToast?.(
        `✅ ${sincronizados} registro${sincronizados > 1 ? 's' : ''} offline sincronizado${sincronizados > 1 ? 's' : ''} con éxito.`,
        'success'
      );
    }
    if (irrecuperables > 0) {
      showToast?.(
        `⚠️ ${irrecuperables} registro${irrecuperables > 1 ? 's' : ''} offline no pudieron sincronizarse: el código QR ya había expirado o la sesión fue cerrada. Comuníquelo al coordinador para registrarlo manualmente.`,
        'warning'
      );
    }
    if (fallidos > 0) {
      showToast?.(
        `⚠️ ${fallidos} registro${fallidos > 1 ? 's' : ''} no pudieron sincronizarse. Se reintentará al reconectar.`,
        'warning'
      );
    }
  }, [showToast]);

  useEffect(() => {
    // Intentar sincronizar al montar (por si venimos de recargar con red)
    if (navigator.onLine) sync();

    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);
}
