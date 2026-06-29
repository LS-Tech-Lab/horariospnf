// Hook que escucha el evento `online` y vacía la cola de asistencias
// pendientes guardadas en IndexedDB durante períodos sin conexión.
// Montar una sola vez en App.jsx.
//
// Fix O-2: los registros con TOKEN_VENCIDO se eliminan de IDB en lugar de
// reintentar indefinidamente. Se purgan también entradas con TTL > 48 h.

import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerPendientes, eliminarPendiente, contarPendientes, purgarExpirados } from '../utils/offlineQueue';

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
    let fallidos = 0;
    // Fix O-2: contar tokens vencidos para notificar al coordinador
    let vencidos = 0;

    for (const item of pendientes) {
      const { id, creadoEn, ...payload } = item;
      try {
        const { data } = await supabase.rpc('registrar_asistencia', payload);
        // Éxito: ok=true o ya registrado (idempotente)
        if (data?.ok || data?.codigo === 'YA_REGISTRADO') {
          await eliminarPendiente(id);
          sincronizados++;
        // Fix O-2: token vencido → eliminar de IDB, no reintentar
        } else if (data?.codigo === 'TOKEN_VENCIDO') {
          await eliminarPendiente(id);
          vencidos++;
        } else {
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
    if (vencidos > 0) {
      showToast?.(
        `⚠️ ${vencidos} registro${vencidos > 1 ? 's' : ''} offline no pudieron sincronizarse: el código QR ya había vencido. Comunique al coordinador para registrarlo manualmente.`,
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
