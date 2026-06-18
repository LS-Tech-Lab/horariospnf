/**
 * ReporteAsistencias.jsx
 *
 * Vista de reporte diario de asistencias para el administrador.
 * Muestra la lista de docentes presentes/ausentes, con filtros
 * por fecha, turno y programa, y permite exportar a CSV.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { DEFAULT_PROGRAMAS } from "../../constants";
import { S } from "../../constants";

const TURNOS = ["DIURNO", "VESPERTINO", "NOCTURNO"];

function exportarCSV(rows, fecha, turno) {
  const headers = ["Cédula", "Nombre", "Turno", "Programa", "Hora de registro", "Dispositivo (hash)"];
  const lines = rows.map((r) => [
    r.cedula_docente,
    r.nombre_docente,
    r.turno,
    r.programa || "—",
    new Date(r.hora_registro).toLocaleTimeString("es-VE"),
    r.device_fingerprint?.slice(0, 12) || "—",
  ]);

  const csvContent = [headers, ...lines]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `asistencias_${turno.toLowerCase()}_${fecha}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Chip de estado ────────────────────────────────────────────────────────────
function EstadoChip({ tipo }) {
  const map = {
    presente: { label: "Presente", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
    ausente:  { label: "Ausente",  bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const ui = map[tipo] || map.ausente;
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: ui.bg,
        color: ui.color,
        border: `1px solid ${ui.border}`,
      }}
    >
      {ui.label}
    </span>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[140, 200, 80, 120, 80].map((w, i) => (
        <td key={i} style={S.td}>
          <div
            style={{
              height: 14,
              width: w,
              borderRadius: 4,
              background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function ReporteAsistencias({ onVolverPanel }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha,    setFecha]    = useState(hoy);
  const [turno,    setTurno]    = useState("DIURNO");
  const [programa, setPrograma] = useState("");
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("asistencias_diarias")
      .select("*")
      .eq("fecha", fecha)
      .eq("turno", turno)
      .order("hora_registro", { ascending: true });

    if (programa) query = query.eq("programa", programa);

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [fecha, turno, programa]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel("reporte_asistencias_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "asistencias_diarias" },
        () => fetchAsistencias()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAsistencias]);

  const rowsFiltradas = rows.filter((r) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      r.cedula_docente?.toLowerCase().includes(q) ||
      r.nombre_docente?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Cabecera */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
            📋 Reporte de Asistencias
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>
            Registro diario de presencia docente
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onVolverPanel && (
            <button
              onClick={onVolverPanel}
              style={{
                padding: "8px 16px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              ← Volver al panel QR
            </button>
          )}
          <button
            onClick={() => exportarCSV(rowsFiltradas, fecha, turno)}
            disabled={rowsFiltradas.length === 0}
            style={{
              padding: "8px 16px",
              background: rowsFiltradas.length === 0 ? "#F3F4F6" : "#059669",
              border: "none",
              borderRadius: 8,
              cursor: rowsFiltradas.length === 0 ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: rowsFiltradas.length === 0 ? "#9CA3AF" : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⬇ Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #E5E7EB",
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {/* Fecha */}
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ ...S.input, fontSize: 13 }}
          />
        </label>

        {/* Turno */}
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Turno</span>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            style={{ ...S.select }}
          >
            {TURNOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        {/* Programa */}
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Programa</span>
          <select
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
            style={{ ...S.select }}
          >
            <option value="">Todos</option>
            {DEFAULT_PROGRAMAS.map((p) => (
              <option key={p} value={p}>{p.replace("PNF ", "")}</option>
            ))}
          </select>
        </label>

        {/* Búsqueda */}
        <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Buscar</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o cédula…"
            style={{ ...S.input }}
          />
        </label>
      </div>

      {/* Resumen */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Registrados", value: rows.length, color: "#2563EB", bg: "#EFF6FF" },
          {
            label: "Esta búsqueda",
            value: rowsFiltradas.length,
            color: "#059669",
            bg: "#ECFDF5",
          },
          {
            label: "Hora primer reg.",
            value:
              rows.length > 0
                ? new Date(rows[0].hora_registro).toLocaleTimeString("es-VE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—",
            color: "#7C3AED",
            bg: "#F5F3FF",
          },
          {
            label: "Último registro",
            value:
              rows.length > 0
                ? new Date(rows[rows.length - 1].hora_registro).toLocaleTimeString("es-VE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—",
            color: "#D97706",
            bg: "#FFFBEB",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              borderRadius: 10,
              padding: "14px 16px",
              border: `1px solid ${stat.color}22`,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#FEF2F2",
            color: "#DC2626",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Tabla */}
      <div style={{ ...S.card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Cédula", "Nombre docente", "Turno", "Hora registro", "Estado"].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rowsFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...S.td, textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
                  {busqueda
                    ? "No se encontraron docentes con ese nombre o cédula."
                    : "No hay asistencias registradas para esta fecha y turno."}
                </td>
              </tr>
            ) : (
              rowsFiltradas.map((r) => (
                <tr
                  key={r.id}
                  style={{ transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td style={{ ...S.td, fontFamily: "monospace", fontWeight: 600, color: "#1D4ED8" }}>
                    {r.cedula_docente}
                  </td>
                  <td style={{ ...S.td, fontWeight: 500 }}>
                    {r.nombre_docente || <span style={{ color: "#9CA3AF" }}>—</span>}
                  </td>
                  <td style={S.td}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#374151",
                        background: "#F3F4F6",
                        borderRadius: 5,
                        padding: "2px 8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {r.turno}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: "#374151" }}>
                    {new Date(r.hora_registro).toLocaleTimeString("es-VE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td style={S.td}>
                    <EstadoChip tipo="presente" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {rowsFiltradas.length > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#9CA3AF",
            textAlign: "right",
          }}
        >
          {rowsFiltradas.length} docente{rowsFiltradas.length !== 1 ? "s" : ""} · Actualización en tiempo real
        </div>
      )}
    </div>
  );
}
