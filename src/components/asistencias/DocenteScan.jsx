/**
 * DocenteScan.jsx
 *
 * Página que abre el docente al escanear el código QR.
 * No requiere sesión de Supabase Auth (acceso anónimo).
 *
 * Flujo:
 *   1. Lee el ?token= de la URL
 *   2. Solicita la cédula del docente (+ nombre si es primera vez)
 *   3. Calcula el device fingerprint (hash del navegador)
 *   4. Llama a la RPC registrar_asistencia()
 *   5. Muestra resultado: éxito, ya registrado, token expirado, etc.
 *
 * Esta página se renderiza en App.jsx cuando la URL es /scan
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

// ── Genera un hash simple del dispositivo (no criptográfico, es señal) ───────
async function calcularDeviceFingerprint() {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform || "",
  ].join("|");

  // Usa SubtleCrypto si está disponible (HTTPS), sino un hash manual
  if (window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(raw);
      const hashBuf = await window.crypto.subtle.digest("SHA-256", data);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      /* fallback */
    }
  }

  // Fallback: hash djb2
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) + h + raw.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

// ── Normalizar cédula: "12345678" → "V-12345678" ────────────────────────────
function normalizarCedula(raw) {
  const limpio = raw.replace(/\s/g, "").toUpperCase();
  if (/^[VEve]-?\d+$/.test(limpio)) {
    const tipo = limpio[0];
    const nums = limpio.replace(/[^0-9]/g, "");
    return `${tipo}-${nums}`;
  }
  if (/^\d+$/.test(limpio)) return `V-${limpio}`;
  return limpio;
}

// ── Iconos SVG inline ────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#22C55E" />
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconError = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#EF4444" />
    <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const IconWarn = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#F59E0B" />
    <path d="M12 7v6M12 16v1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// ── Resultados posibles ──────────────────────────────────────────────────────
const RESULTADO_UI = {
  ok: {
    Icon: IconCheck,
    titulo: "¡Asistencia registrada!",
    color: "#15803D",
    bg: "#F0FDF4",
    border: "#86EFAC",
  },
  YA_REGISTRADO: {
    Icon: IconWarn,
    titulo: "Ya registraste tu asistencia hoy",
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FCD34D",
  },
  TOKEN_EXPIRADO: {
    Icon: IconError,
    titulo: "Código QR expirado",
    color: "#991B1B",
    bg: "#FEF2F2",
    border: "#FECACA",
    hint: "Pide al administrador que regenere el código.",
  },
  TOKEN_INVALIDO: {
    Icon: IconError,
    titulo: "Código QR no válido",
    color: "#991B1B",
    bg: "#FEF2F2",
    border: "#FECACA",
    hint: "Asegúrate de escanear el código correcto.",
  },
  SESION_INACTIVA: {
    Icon: IconError,
    titulo: "Sesión cerrada",
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    hint: "El administrador cerró esta sesión. Consulta si hay una nueva.",
  },
  DEVICE_DUPLICADO: {
    Icon: IconError,
    titulo: "Dispositivo ya utilizado",
    color: "#991B1B",
    bg: "#FEF2F2",
    border: "#FECACA",
    hint: "Este celular ya registró la asistencia de otro docente en esta sesión.",
  },
  ERROR: {
    Icon: IconError,
    titulo: "Error inesperado",
    color: "#991B1B",
    bg: "#FEF2F2",
    border: "#FECACA",
    hint: "Intenta de nuevo o contacta al administrador.",
  },
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function DocenteScan() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get("token");

  const [cedula,   setCedula]   = useState("");
  const [nombre,   setNombre]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resultado, setResultado] = useState(null); // null | { ok, codigo, mensaje }

  // Si no hay token, mostrar error inmediato
  const sinToken = !token;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!cedula.trim()) return;

      setLoading(true);
      setResultado(null);

      try {
        const fingerprint = await calcularDeviceFingerprint();
        const cedulaNorm  = normalizarCedula(cedula.trim());

        const { data, error: rpcErr } = await supabase.rpc(
          "registrar_asistencia",
          {
            p_token:              token,
            p_cedula_docente:     cedulaNorm,
            p_nombre_docente:     nombre.trim() || cedulaNorm,
            p_device_fingerprint: fingerprint,
          }
        );

        if (rpcErr) throw rpcErr;
        setResultado(data);
      } catch (err) {
        setResultado({
          ok:      false,
          codigo:  "ERROR",
          mensaje: err.message || "Error de conexión. Intenta de nuevo.",
        });
      } finally {
        setLoading(false);
      }
    },
    [token, cedula, nombre]
  );

  // ── Render sin token ─────────────────────────────────────────────────────
  if (sinToken) {
    return (
      <PantallaCentrada>
        <IconError />
        <h2 style={{ margin: "16px 0 8px", fontSize: 18, color: "#991B1B" }}>
          Enlace inválido
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280", textAlign: "center" }}>
          Este enlace no contiene un código QR válido. Escanea el código QR
          desde la pantalla del aula.
        </p>
      </PantallaCentrada>
    );
  }

  // ── Render con resultado ─────────────────────────────────────────────────
  if (resultado) {
    const tipo = resultado.ok ? "ok" : resultado.codigo || "ERROR";
    const ui   = RESULTADO_UI[tipo] || RESULTADO_UI.ERROR;
    const { Icon, titulo, color, bg, border, hint } = ui;

    return (
      <PantallaCentrada>
        <Icon />
        <h2 style={{ margin: "16px 0 6px", fontSize: 18, color, textAlign: "center" }}>
          {titulo}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#374151",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {resultado.mensaje}
        </p>
        {hint && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 13,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            {hint}
          </p>
        )}

        {/* Solo para YA_REGISTRADO mostramos opción de volver */}
        {resultado.codigo === "YA_REGISTRADO" && (
          <div
            style={{
              marginTop: 20,
              padding: "12px 16px",
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 10,
              fontSize: 13,
              color: "#92400E",
              textAlign: "center",
            }}
          >
            Tu asistencia ya estaba registrada con anterioridad. No es necesario
            hacer nada más.
          </div>
        )}
      </PantallaCentrada>
    );
  }

  // ── Render formulario ────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "36px 28px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              margin: "0 auto 14px",
            }}
          >
            ✅
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Registro de Asistencia
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280" }}>
            Ingresa tus datos para registrar tu presencia
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Cédula */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Cédula de identidad
            </label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              required
              placeholder="V-12345678"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 9,
                border: "1.5px solid #D1D5DB",
                fontSize: 16,
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563EB";
                e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.boxShadow = "none";
              }}
            />
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "#9CA3AF" }}>
              Ejemplo: V-12345678 o E-87654321
            </p>
          </div>

          {/* Nombre (opcional pero recomendado) */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Nombre completo{" "}
              <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Prof. Juan García"
              autoComplete="name"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 9,
                border: "1.5px solid #D1D5DB",
                fontSize: 14,
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563EB";
                e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !cedula.trim()}
            style={{
              width: "100%",
              padding: "13px 0",
              background:
                loading || !cedula.trim() ? "#93C5FD" : "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !cedula.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Registrando…" : "Registrar mi asistencia"}
          </button>
        </form>

        {/* Aviso de privacidad */}
        <p
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "#9CA3AF",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Solo se registra tu cédula y hora de llegada. Los datos son de uso
          exclusivo del departamento académico.
        </p>
      </div>
    </div>
  );
}

// ── Helper: pantalla centrada para resultados ────────────────────────────────
function PantallaCentrada({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 28px",
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
