/**
 * ModalCambiarPassword.jsx
 *
 * Modal para que cualquier usuario cambie su propia contraseña.
 * Usa supabase.auth.updateUser() que no requiere service_role.
 */

import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ModalCambiarPassword({ onCerrar, showToast }) {
  const [actual,    setActual]    = useState("");
  const [nueva,     setNueva]     = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState(null);

  const valido =
    actual.length >= 1 &&
    nueva.length >= 8 &&
    nueva === confirmar;

  const handleGuardar = async () => {
    setError(null);
    if (nueva !== confirmar) { setError("Las contraseñas no coinciden."); return; }
    if (nueva.length < 8)    { setError("La nueva contraseña debe tener al menos 8 caracteres."); return; }

    setGuardando(true);

    // Paso 1: re-autenticar con la contraseña actual para verificarla
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;

    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email,
      password: actual,
    });

    if (reAuthError) {
      setError("La contraseña actual es incorrecta.");
      setGuardando(false);
      return;
    }

    // Paso 2: actualizar la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: nueva,
    });

    if (updateError) {
      setError("Error al cambiar la contraseña: " + updateError.message);
      setGuardando(false);
      return;
    }

    showToast?.("Contraseña actualizada correctamente.", "success");
    setGuardando(false);
    onCerrar();
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid #E5E7EB", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: "#374151",
    display: "block", marginBottom: 5,
  };

  // Indicador de fortaleza de contraseña
  const fortaleza = (() => {
    if (!nueva) return null;
    if (nueva.length < 8)  return { label: "Muy corta",  color: "#EF4444", width: "20%" };
    if (nueva.length < 10) return { label: "Débil",      color: "#F97316", width: "40%" };
    if (!/[A-Z]/.test(nueva) || !/[0-9]/.test(nueva))
                           return { label: "Regular",    color: "#EAB308", width: "60%" };
    if (nueva.length < 14) return { label: "Buena",      color: "#22C55E", width: "80%" };
    return                        { label: "Excelente",  color: "#16A34A", width: "100%" };
  })();

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 28,
        maxWidth: 400, width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
      }}>
        {/* Cabecera */}
        <div style={{ marginBottom: 20 }}>
          <i className="ti ti-key" style={{ fontSize: 28, color: "#2563EB", marginBottom: 6, display: "block" }} aria-hidden="true" />
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
            Cambiar contraseña
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
            Elige una contraseña segura de al menos 8 caracteres.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Contraseña actual */}
          <div>
            <label style={labelStyle}>Contraseña actual *</label>
            <input
              type="password" value={actual}
              onChange={e => { setActual(e.target.value); setError(null); }}
              placeholder="Tu contraseña actual"
              style={inputStyle} autoComplete="current-password"
            />
          </div>

          {/* Nueva contraseña */}
          <div>
            <label style={labelStyle}>Nueva contraseña * (mín. 8 caracteres)</label>
            <input
              type="password" value={nueva}
              onChange={e => { setNueva(e.target.value); setError(null); }}
              placeholder="Mínimo 8 caracteres"
              style={inputStyle} autoComplete="new-password"
            />
            {/* Indicador fortaleza */}
            {fortaleza && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 4, borderRadius: 4, background: "#E5E7EB", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: fortaleza.width, background: fortaleza.color,
                    transition: "width 0.3s, background 0.3s",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: fortaleza.color, fontWeight: 600, marginTop: 3, display: "block" }}>
                  {fortaleza.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label style={labelStyle}>Confirmar nueva contraseña *</label>
            <input
              type="password" value={confirmar}
              onChange={e => { setConfirmar(e.target.value); setError(null); }}
              placeholder="Repite la nueva contraseña"
              style={{
                ...inputStyle,
                borderColor: confirmar && nueva !== confirmar ? "#FCA5A5" : "#E5E7EB",
              }}
              autoComplete="new-password"
            />
            {confirmar && nueva !== confirmar && (
              <span style={{ fontSize: 11, color: "#EF4444", marginTop: 3, display: "block" }}>
                Las contraseñas no coinciden.
              </span>
            )}
            {confirmar && nueva === confirmar && nueva.length >= 8 && (
              <span style={{ fontSize: 11, color: "#16A34A", marginTop: 3, display: "block" }}>
                ✓ Las contraseñas coinciden.
              </span>
            )}
          </div>

          {/* Error general */}
          {error && (
            <div style={{
              background: "#FEF2F2", color: "#DC2626", borderRadius: 8,
              padding: "10px 14px", fontSize: 13,
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 6 }} aria-hidden="true" />{error}
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onCerrar}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: "1px solid #E5E7EB", background: "#F9FAFB",
              color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={!valido || guardando}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 8, border: "none",
              background: valido && !guardando ? "#2563EB" : "#E5E7EB",
              color: valido && !guardando ? "#fff" : "#94A3B8",
              cursor: valido && !guardando ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 700,
            }}>
            {guardando
              ? "Actualizando…"
              : <><i className="ti ti-key" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 6 }} aria-hidden="true" />Actualizar contraseña</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
