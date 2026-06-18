/**
 * useQRSession.js
 *
 * Hook que gestiona el ciclo de vida de una sesión QR:
 *   - Crear una nueva sesión (crear_qr_session RPC)
 *   - Auto-renovar el token cada TTL_MINUTES minutos (renovar_qr_token RPC)
 *   - Exponer estado: sessionId, token, expiresAt, segundosRestantes, loading, error
 *   - Cerrar / invalidar la sesión manualmente
 *
 * La URL que se codifica en el QR tiene la forma:
 *   <origin>/scan?token=<UUID>
 *
 * El componente que usa este hook solo necesita pasar `qrUrl` a la
 * librería de generación de QR.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const TTL_MINUTES = 5; // minutos de vida de cada token

export default function useQRSession() {
  const [sessionId,  setSessionId]  = useState(null);
  const [token,      setToken]      = useState(null);
  const [expiresAt,  setExpiresAt]  = useState(null);
  const [segundos,   setSegundos]   = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [activa,     setActiva]     = useState(false);

  const renewTimerRef    = useRef(null); // setInterval para auto-renovar
  const countdownRef     = useRef(null); // setInterval para la cuenta atrás visual

  // ── Limpia todos los intervalos ──────────────────────────────────────────
  const limpiarIntervalos = useCallback(() => {
    if (renewTimerRef.current)    clearInterval(renewTimerRef.current);
    if (countdownRef.current)     clearInterval(countdownRef.current);
    renewTimerRef.current = null;
    countdownRef.current  = null;
  }, []);

  // ── Inicia la cuenta atrás visual dado un expires_at ─────────────────────
  const iniciarCountdown = useCallback((expiresAtStr) => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    const tick = () => {
      const secsLeft = Math.max(
        0,
        Math.round((new Date(expiresAtStr) - Date.now()) / 1000)
      );
      setSegundos(secsLeft);
    };

    tick(); // inmediato
    countdownRef.current = setInterval(tick, 1000);
  }, []);

  // ── Renueva el token de una sesión activa ─────────────────────────────────
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

  // ── Inicia el auto-renovado periódico ─────────────────────────────────────
  const iniciarAutoRenovado = useCallback((sid) => {
    if (renewTimerRef.current) clearInterval(renewTimerRef.current);

    // Renova 10 segundos antes de que expire para no dejar ventana muerta
    const intervalMs = (TTL_MINUTES * 60 - 10) * 1000;

    renewTimerRef.current = setInterval(async () => {
      await renovarToken(sid);
    }, intervalMs);
  }, [renovarToken]);

  // ── Crea una nueva sesión QR ──────────────────────────────────────────────
  const crearSesion = useCallback(async ({ turno, programa = null, fecha = null }) => {
    setLoading(true);
    setError(null);
    limpiarIntervalos();

    const params = {
      p_turno:   turno,
      p_ttl_min: TTL_MINUTES,
    };
    if (programa) params.p_programa = programa;
    if (fecha)    params.p_fecha    = fecha;

    const { data, error: rpcErr } = await supabase.rpc("crear_qr_session", params);

    if (rpcErr || !data?.ok) {
      setError(data?.mensaje || rpcErr?.message || "No se pudo crear la sesión QR.");
      setLoading(false);
      return false;
    }

    setSessionId(data.session_id);
    setToken(data.token);
    setExpiresAt(data.expires_at);
    setActiva(true);
    iniciarCountdown(data.expires_at);
    iniciarAutoRenovado(data.session_id);
    setLoading(false);
    return true;
  }, [limpiarIntervalos, iniciarCountdown, iniciarAutoRenovado]);

  // ── Renueva manualmente (botón "Regenerar" del admin) ────────────────────
  const renovarManual = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    await renovarToken(sessionId);
    setLoading(false);
  }, [sessionId, renovarToken]);

  // ── Cierra / invalida la sesión ───────────────────────────────────────────
  const cerrarSesion = useCallback(async () => {
    limpiarIntervalos();

    if (sessionId) {
      // Marcar la sesión como inactiva en BD
      await supabase
        .from("qr_sessions")
        .update({ activa: false })
        .eq("id", sessionId);
    }

    setSessionId(null);
    setToken(null);
    setExpiresAt(null);
    setSegundos(0);
    setActiva(false);
  }, [sessionId, limpiarIntervalos]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => limpiarIntervalos();
  }, [limpiarIntervalos]);

  // ── URL que se codifica en el QR ─────────────────────────────────────────
  const qrUrl = token
    ? `${window.location.origin}/scan?token=${token}`
    : null;

  return {
    // Estado
    sessionId,
    token,
    expiresAt,
    segundosRestantes: segundos,
    qrUrl,
    activa,
    loading,
    error,
    ttlMinutes: TTL_MINUTES,

    // Acciones
    crearSesion,
    renovarManual,
    cerrarSesion,
  };
}
