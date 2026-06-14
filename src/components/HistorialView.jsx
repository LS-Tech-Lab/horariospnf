import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { formatLapso, compareLapsos, getSiguienteLapso, getCurrentLapso, isValidLapso } from "../utils/lapso";
import { S } from "../constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ estado }) {
  const cfg = {
    activo:   { bg: "#DCFCE7", col: "#166534", label: "Activo" },
    cerrado:  { bg: "#F1F5F9", col: "#475569", label: "Cerrado" },
    archivado:{ bg: "#EFF6FF", col: "#1E40AF", label: "Archivado" },
  };
  const c = cfg[estado] || cfg.cerrado;
  return (
    <span style={{ ...S.badge(c.bg, c.col), fontSize: 11 }}>{c.label}</span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function HistorialView({ lapsoActivo, onCambiarLapso, showToast, openConfirm, closeConfirm, user }) {
  const [trimestres, setTrimestres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [detalle, setDetalle] = useState({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [creandoSiguiente, setCreandoSiguiente] = useState(false);
  const [nuevoLapso, setNuevoLapso] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // ── Carga la tabla de trimestres ──────────────────────────────────────────
  const cargarTrimestres = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trimestres")
      .select("*")
      .order("anio", { ascending: false })
      .order("numero", { ascending: false });
    if (error) {
      showToast("❌ Error al cargar historial: " + error.message, "error");
    } else {
      setTrimestres(data || []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { cargarTrimestres(); }, [cargarTrimestres]);

  // ── Carga estadísticas de un trimestre ────────────────────────────────────
  const cargarDetalle = async (lapso) => {
    if (detalle[lapso]) { setExpandido(lapso); return; }
    setLoadingDetalle(true);
    const { data: horarios } = await supabase
      .from("horarios")
      .select("programa, trayecto, sheet")
      .eq("lapso", lapso);
    if (horarios) {
      setDetalle(prev => ({
        ...prev,
        [lapso]: {
          total: horarios.length,
          secciones: new Set(horarios.map(h => h.sheet?.trim())).size,
          programas: [...new Set(horarios.map(h => h.programa).filter(Boolean))].sort(),
          trayectos: [...new Set(horarios.map(h => h.trayecto).filter(Boolean))].sort(),
        }
      }));
    }
    setExpandido(lapso);
    setLoadingDetalle(false);
  };

  // ── Cerrar trimestre activo ───────────────────────────────────────────────
  const cerrarTrimestre = () => {
    openConfirm({
      title: "Cerrar trimestre activo",
      message: `¿Confirmas cerrar el trimestre ${formatLapso(lapsoActivo)}? Los datos pasarán al historial como solo lectura. Podrás consultarlos en cualquier momento.`,
      confirmLabel: "Sí, cerrar trimestre",
      danger: false,
      onConfirm: async () => {
        closeConfirm();
        const [num, anio] = lapsoActivo.split("-").map(Number);
        const { error } = await supabase
          .from("trimestres")
          .upsert(
            { lapso: lapsoActivo, numero: num, anio, estado: "cerrado", cerrado_en: new Date().toISOString(), cerrado_por: user?.email },
            { onConflict: "lapso" }
          );
        if (error) { showToast("❌ Error al cerrar: " + error.message, "error"); return; }
        // Marcar registros de horarios con este lapso
        await supabase.from("horarios").update({ lapso: lapsoActivo }).is("lapso", null);
        showToast(`✅ Trimestre ${formatLapso(lapsoActivo)} cerrado y archivado.`, "success");
        await cargarTrimestres();
        const siguiente = getSiguienteLapso(lapsoActivo);
        setNuevoLapso(siguiente);
        setModalCrear(true);
      },
    });
  };

  // ── Activar un nuevo trimestre ────────────────────────────────────────────
  const activarNuevoTrimestre = async () => {
    if (!isValidLapso(nuevoLapso)) { showToast("❌ Formato de trimestre inválido (ej: 3-2026)", "error"); return; }
    const yaExiste = trimestres.find(t => t.lapso === nuevoLapso && t.estado === "activo");
    if (yaExiste) { showToast("⚠️ Ese trimestre ya está activo.", "warning"); return; }
    setCreandoSiguiente(true);
    const [num, anio] = nuevoLapso.split("-").map(Number);
    const { error } = await supabase
      .from("trimestres")
      .upsert(
        { lapso: nuevoLapso, numero: num, anio, estado: "activo", creado_en: new Date().toISOString(), creado_por: user?.email },
        { onConflict: "lapso" }
      );
    if (error) { showToast("❌ Error al crear trimestre: " + error.message, "error"); setCreandoSiguiente(false); return; }
    showToast(`✅ Trimestre ${formatLapso(nuevoLapso)} activado. ¡Ya puedes cargar los horarios!`, "success");
    onCambiarLapso(nuevoLapso);
    setModalCrear(false);
    setCreandoSiguiente(false);
    await cargarTrimestres();
  };

  // ── Filtrado por búsqueda ─────────────────────────────────────────────────
  const filtrados = trimestres.filter(t =>
    !busqueda ||
    t.lapso.includes(busqueda) ||
    formatLapso(t.lapso).toLowerCase().includes(busqueda.toLowerCase())
  );

  const trimestreActual = trimestres.find(t => t.lapso === lapsoActivo);

  // ── Modal de nuevo trimestre ──────────────────────────────────────────────
  if (modalCrear) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, background: "rgba(0,0,0,0.25)" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 32, maxWidth: 440, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎓</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Activar nuevo trimestre</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
            El trimestre anterior fue archivado. Indica el código del nuevo trimestre para comenzar a cargar horarios.
          </p>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Código del trimestre</label>
          <input
            value={nuevoLapso}
            onChange={e => setNuevoLapso(e.target.value)}
            placeholder="ej: 3-2026"
            style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 20, fontSize: 16, padding: "10px 14px" }}
          />
          <p style={{ margin: "0 0 20px", fontSize: 11, color: "#94A3B8" }}>
            Formato: <strong>[número trimestre]-[año]</strong> → 1-2027, 2-2027, 3-2027…
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setModalCrear(false)}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >Cancelar</button>
            <button
              onClick={activarNuevoTrimestre}
              disabled={creandoSiguiente || !nuevoLapso}
              style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
            >{creandoSiguiente ? "Activando…" : `✅ Activar ${nuevoLapso || "…"}`}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 28px", maxWidth: 860, margin: "0 auto" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>Historial de Trimestres</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>Consulta y gestiona todos los períodos académicos</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => { setNuevoLapso(getSiguienteLapso(lapsoActivo)); setModalCrear(true); }}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >+ Nuevo trimestre</button>
          <button
            onClick={cerrarTrimestre}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            title="Archivar trimestre activo y preparar el siguiente"
          >🔒 Cerrar trimestre activo</button>
        </div>
      </div>

      {/* Trimestre activo */}
      <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F5F3FF)", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Trimestre en curso</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1E40AF" }}>{formatLapso(lapsoActivo)}</div>
          {trimestreActual?.creado_en && (
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
              Iniciado: {new Date(trimestreActual.creado_en).toLocaleDateString("es-VE")}
              {trimestreActual.creado_por ? ` · por ${trimestreActual.creado_por}` : ""}
            </div>
          )}
        </div>
        <StatusBadge estado="activo" />
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar trimestre… (ej: 2026, 1-2025)"
          style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {/* Lista de trimestres */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94A3B8", fontSize: 14 }}>Cargando historial…</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 14, color: "#64748B" }}>
            {busqueda ? "No se encontraron trimestres con ese criterio." : "No hay trimestres en el historial aún."}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
            Cierra el trimestre activo para que pase al historial automáticamente.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrados.map(t => {
            const isOpen = expandido === t.lapso;
            const d = detalle[t.lapso];
            return (
              <div key={t.lapso}
                style={{ ...S.card, border: t.lapso === lapsoActivo ? "1.5px solid #3B82F6" : "1px solid #E5E7EB", borderRadius: 10 }}
              >
                {/* Cabecera */}
                <div
                  onClick={() => isOpen ? setExpandido(null) : cargarDetalle(t.lapso)}
                  style={{ display: "flex", alignItems: "center", padding: "14px 18px", cursor: "pointer", gap: 12, userSelect: "none" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{formatLapso(t.lapso)}</div>
                    {t.cerrado_en && (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                        Cerrado: {new Date(t.cerrado_en).toLocaleDateString("es-VE")}
                        {t.cerrado_por ? ` · ${t.cerrado_por}` : ""}
                      </div>
                    )}
                  </div>
                  <StatusBadge estado={t.estado} />
                  <span style={{ color: "#94A3B8", fontSize: 16 }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Detalle expandible */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #F1F5F9", padding: "14px 18px" }}>
                    {loadingDetalle && !d ? (
                      <div style={{ color: "#94A3B8", fontSize: 13 }}>Cargando estadísticas…</div>
                    ) : d ? (
                      <>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
                          {[
                            { label: "Clases", val: d.total, color: "#60A5FA" },
                            { label: "Secciones", val: d.secciones, color: "#34D399" },
                          ].map(s => (
                            <div key={s.label} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                              <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {d.programas?.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Programas</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {d.programas.map(p => (
                                <span key={p} style={S.badge("#F0FDF4", "#166534")}>{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Botón de activar como activo (solo trimestres cerrados) */}
                        {t.estado !== "activo" && (
                          <button
                            onClick={() => onCambiarLapso(t.lapso)}
                            style={{ marginTop: 8, padding: "7px 14px", borderRadius: 7, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                          >👁️ Ver en el sistema</button>
                        )}
                      </>
                    ) : (
                      <div style={{ color: "#94A3B8", fontSize: 13 }}>Sin datos cargados para este trimestre.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
