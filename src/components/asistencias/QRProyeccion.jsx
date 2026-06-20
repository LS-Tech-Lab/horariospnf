/**
 * QRProyeccion.jsx
 *
 * FIX (qr-pill-proyeccion):
 *
 * Antes, el único lugar donde se mostraba el QR era "📲 Panel QR", que
 * también tiene los controles de Iniciar / Regenerar / Cerrar sesión. Esa
 * misma pantalla es la que se proyecta para que los docentes escaneen, así
 * que cualquiera con acceso físico al equipo (incluyendo un docente, en un
 * descuido del personal administrativo) podía tocar esos botones: generar
 * una sesión nueva, regenerar el QR a su antojo, o cerrarla.
 *
 * Esta vista es de SOLO LECTURA: muestra el QR y la cuenta regresiva de la
 * sesión activa (la que ya haya iniciado el admin/operador desde el Panel
 * QR), pero no tiene ningún botón de control. Es la pantalla que debe
 * quedar proyectada o en la tablet/TV que ven los docentes — la
 * configuración (fecha, turno, programa, iniciar/regenerar/cerrar) se queda
 * exclusivamente en "📲 Panel QR", en el dispositivo del admin/operador.
 */

import React from "react";
import { QRDisplay, formatFechaVE, TURNOS_VISIBLES } from "./AdminQRPanel";

const PASOS = [
  "Abre la cámara de tu celular",
  "Apunta al código QR en pantalla",
  "Elige Entrada o Salida",
  "Primera vez: ingresa tu cédula y nombre",
  "Confirma y listo ✅",
];

export default function QRProyeccion({ activa, qrUrl, segundosRestantes, ttlMinutes, meta }) {
  const turnoInfo = meta?.turno ? TURNOS_VISIBLES.find(t => t.id === meta.turno) : null;

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>🖥️ Proyección de Asistencia</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9CA3AF" }}>
          Solo lectura — esta pantalla no tiene controles para iniciar, regenerar ni cerrar la sesión.
        </p>
      </div>

      {!activa ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "2px dashed #E2E8F0", padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📲</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Esperando que se inicie una sesión</div>
          <div style={{ fontSize: 14, color: "#9CA3AF", maxWidth: 320, margin: "0 auto" }}>
            El administrador u operador debe iniciar la sesión QR desde su propio dispositivo, en <strong>📲 Panel QR</strong>. En cuanto la active, el código aparecerá aquí automáticamente.
          </div>
        </div>
      ) : (
        <div>
          {/* FIX (qr-solo-en-proyeccion): badge "Sesión activa · turno · fecha",
              antes vivía en el panel de control junto a los botones. */}
          {meta && (
            <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "pulse 1.4s ease-in-out infinite" }} />
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>
                Sesión activa{turnoInfo ? ` · ${turnoInfo.label}` : ""}{meta.fecha ? ` · ${formatFechaVE(meta.fecha)}` : ""}
                {meta.programa ? ` · ${meta.programa.replace("PNF ", "")}` : ""}
              </span>
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Escanea para registrar tu entrada o salida
            </div>
            <QRDisplay qrUrl={qrUrl} segundos={segundosRestantes} ttlMinutes={ttlMinutes} />

            {/* FIX (qr-solo-en-proyeccion): instrucciones, antes vivían en el
                panel de control junto a los botones de Iniciar/Regenerar/Cerrar. */}
            <div style={{ marginTop: 20, background: "#F8FAFC", borderRadius: 10, padding: "14px 18px", width: "100%", maxWidth: 340 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Instrucciones para el docente</div>
              {PASOS.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < PASOS.length - 1 ? 8 : 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563EB", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#374151" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
