/**
 * useQRSession.js
 *
 * Hook que gestiona el ciclo de vida de una sesión QR.
 * IMPORTANTE: debe vivir en App.jsx (o en el componente padre del módulo
 * de asistencias) para que su estado NO se pierda al cambiar de pestaña
 * entre "Panel QR" y "Reporte".
 *
 * Fixes incluidos:
 *  - Estado persistente entre cambios de sub-vista (el hook vive arriba)
 *  - Rotación inmediata del token cuando se registra un escaneo exitoso
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const TTL_MINUTES = 5;

export default function useQRSession() {
  const [sessionId,  setSessionId]  = useState(null);
  const [token,      setToken]      = useState(null);
  const [expiresAt,  setExpiresAt]  = useState(null);
  const [segundos,   setSegundos]   = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [activa,     setActiva]     = useState(false);

  const renewTimerRef  = useRef(null);
  const countdownRef   = useRef(null);
  // Ref para sessionId accesible dentro de closures de intervalos
  const sessionIdRef   = useRef(null);

  const limpiarIntervalos = useCallback(() => {
    if (renewTimerRef.current)  clearInterval(renewTimerRef.current);
    if (countdownRef.current)   clearInterval(countdownRef.current);
    renewTimerRef.current = null;
    countdownRef.current  = null;
  }, []);

  const iniciarCountdown = useCallback((expiresAtStr) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const tick = () => {
      const secsLeft = Math.max(0, Math.round((new Date(expiresAtStr) - Date.now()) / 1000));
      setSegundos(secsLeft);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
  }, []);

  const renovarToken = useCallback(async (sid) => {
    const { data, error: rpcErr } = await supabase.rpc("renovar_qr_token", {
      p_session_id: sid,
      p_ttl_min:    TTL_MINUTES,
    });
    if (rpcErr || !data?.ok) {
      setError(data?.mensaje || rpcErr?.message || "Error al renovar el token QR.");
      return false;
    }
    setToken(data.token);
    setExpiresAt(data.expires_at);
    iniciarCountdown(data.expires_at);
    return true;
  }, [iniciarCountdown]);

  const iniciarAutoRenovado = useCallback((sid) => {
    if (renewTimerRef.current) clearInterval(renewTimerRef.current);
    // Renueva 15 s antes de expirar
    const intervalMs = (TTL_MINUTES * 60 - 15) * 1000;
    renewTimerRef.current = setInterval(() => {
      renovarToken(sid);
    }, intervalMs);
  }, [renovarToken]);

  // ── Suscripción realtime: rota el token cuando llega un nuevo registro ────
  // Esto hace que una foto del QR compartida sea inútil al instante.
  useEffect(() => {
    if (!sessionId) return;
    sessionIdRef.current = sessionId;

    const channel = supabase
      .channel(`qr_rotate_on_scan_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "asistencias_diarias",
          filter: `qr_session_id=eq.${sessionId}`,
        },
        () => {
          // Rotar inmediatamente al detectar un escaneo exitoso
          renovarToken(sessionIdRef.current);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, renovarToken]);

  const crearSesion = useCallback(async ({ turno, programa = null, fecha = null }) => {
    setLoading(true);
    setError(null);
    limpiarIntervalos();

    const params = { p_turno: turno, p_ttl_min: TTL_MINUTES };
    if (programa) params.p_programa = programa;
    if (fecha)    params.p_fecha    = fecha;

    const { data, error: rpcErr } = await supabase.rpc("crear_qr_session", params);

    if (rpcErr || !data?.ok) {
      setError(data?.mensaje || rpcErr?.message || "No se pudo crear la sesión QR.");
      setLoading(false);
      return false;
    }

    setSessionId(data.session_id);
    sessionIdRef.current = data.session_id;
    setToken(data.token);
    setExpiresAt(data.expires_at);
    setActiva(true);
    iniciarCountdown(data.expires_at);
    iniciarAutoRenovado(data.session_id);
    setLoading(false);
    return true;
  }, [limpiarIntervalos, iniciarCountdown, iniciarAutoRenovado]);

  const renovarManual = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    await renovarToken(sessionId);
    setLoading(false);
  }, [sessionId, renovarToken]);

  const cerrarSesion = useCallback(async () => {
    limpiarIntervalos();
    if (sessionId) {
      await supabase.from("qr_sessions").update({ activa: false }).eq("id", sessionId);
    }
    setSessionId(null);
    sessionIdRef.current = null;
    setToken(null);
    setExpiresAt(null);
    setSegundos(0);
    setActiva(false);
  }, [sessionId, limpiarIntervalos]);

  useEffect(() => () => limpiarIntervalos(), [limpiarIntervalos]);

  const qrUrl = token ? `${window.location.origin}/scan?token=${token}` : null;

  return {
    sessionId, token, expiresAt,
    segundosRestantes: segundos,
    qrUrl, activa, loading, error,
    ttlMinutes: TTL_MINUTES,
    crearSesion, renovarManual, cerrarSesion,
  };
}
