import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const LOCKOUT_STORAGE_KEY = "login_lockout_until";
const ATTEMPTS_STORAGE_KEY = "login_failed_attempts";

function getAuthErrorMessage(error) {
  const msg = (error?.message || "").toLowerCase();
  const status = error?.status;

  if (msg.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (msg.includes("email not confirmed")) {
    return "Correo no confirmado. Revisa tu bandeja de entrada para confirmar la cuenta.";
  }
  if (msg.includes("user not found")) {
    return "No existe una cuenta con ese correo.";
  }
  if (msg.includes("too many requests") || status === 429) {
    return "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Error de conexión. Verifica tu internet e intenta de nuevo.";
  }
  return error?.message || "No se pudo iniciar sesión. Intenta de nuevo.";
}

// El bloqueo por intentos fallidos se persiste en localStorage para que
// sobreviva recargas de página (F5) y no se pueda eludir simplemente
// refrescando el navegador. La protección real contra brute force la
// aplica Supabase Auth en el backend; esto es una capa adicional de UX.
function readStoredLockout() {
  try {
    const until = parseInt(localStorage.getItem(LOCKOUT_STORAGE_KEY) || "0", 10);
    return until > Date.now() ? until : null;
  } catch {
    return null;
  }
}

function readStoredAttempts() {
  try {
    return parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function persistLockout(until) {
  try {
    if (until) localStorage.setItem(LOCKOUT_STORAGE_KEY, String(until));
    else localStorage.removeItem(LOCKOUT_STORAGE_KEY);
  } catch { /* localStorage no disponible (modo privado, etc.) — degradamos sin persistencia */ }
}

function persistAttempts(n) {
  try {
    if (n > 0) localStorage.setItem(ATTEMPTS_STORAGE_KEY, String(n));
    else localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
  } catch { /* idem */ }
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    // Si hay un lockout activo persistido, los intentos también se restauran;
    // si el lockout ya expiró, no tiene sentido arrastrar el contador.
    return readStoredLockout() ? readStoredAttempts() : 0;
  });
  const [lockedUntil, setLockedUntil] = useState(() => readStoredLockout());
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const secsLeft = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setRemaining(secsLeft);
      if (secsLeft <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        persistLockout(null);
        persistAttempts(0);
        clearInterval(timerRef.current);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => clearInterval(timerRef.current);
  }, [lockedUntil]);

  const isLocked = !!lockedUntil && remaining > 0;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(getAuthErrorMessage(error));
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      persistAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockedUntil(until);
        persistLockout(until);
      }
      // Registrar intento fallido en BD (RPC accesible por anon)
      try {
        await supabase.rpc("log_login_fallido", {
          p_email:      email,
          p_user_agent: navigator.userAgent,
          p_motivo:     error.message,
        });
      } catch { /* no-op: los logs no deben bloquear el flujo */ }
    } else {
      setFailedAttempts(0);
      persistAttempts(0);
      persistLockout(null);
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 32px",
        width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>Gestión de Horarios Académicos y Asistencias Docentes</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLocked}
              placeholder="admin@ejemplo.com"
              autoComplete="email"
              onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
              onBlur={e  => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #D1D5DB", fontSize: 14,
                outline: "none", boxSizing: "border-box", transition: "border-color .15s, box-shadow .15s",
                background: isLocked ? "#F3F4F6" : "#fff",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLocked}
              placeholder="••••••••"
              autoComplete="current-password"
              onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
              onBlur={e  => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #D1D5DB", fontSize: 14,
                outline: "none", boxSizing: "border-box", transition: "border-color .15s, box-shadow .15s",
                background: isLocked ? "#F3F4F6" : "#fff",
              }}
            />
          </div>

          {error && !isLocked && (
            <div style={{
              background: "#FEF2F2",
              color: "#DC2626",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              fontWeight: 500,
            }}>
              {error}
              {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#B91C1C" }}>
                  Intento {failedAttempts} de {MAX_ATTEMPTS}.
                </div>
              )}
            </div>
          )}

          {isLocked && (
            <div style={{
              background: "#FFFBEB",
              color: "#92400E",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              fontWeight: 500,
            }}>
              ⏳ Demasiados intentos fallidos. Intenta de nuevo en {remaining} segundo{remaining === 1 ? "" : "s"}.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isLocked}
            style={{
              width: "100%",
              padding: "11px 0",
              background: (loading || isLocked) ? "#93C5FD" : "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: (loading || isLocked) ? "not-allowed" : "pointer",
            }}
          >
            {isLocked ? `Bloqueado (${remaining}s)` : loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
