import React, { useState } from "react";
import useAppData from "./hooks/useAppData";
import LoginScreen from "./components/LoginScreen";
import ResponsiveStyles from "./components/ResponsiveStyles";
import GlobalSearch from "./components/GlobalSearch";
import Toast from "./components/Toast";
import DashboardView from "./components/DashboardView";
import HorariosView from "./components/HorariosView";
import SeccionesView from "./components/SeccionesView";
import DocentesView from "./components/DocentesView";
import MateriasView from "./components/MateriasView";
import AsistenciasView from "./components/AsistenciasView";
import ConflictosView from "./components/ConflictosView";
import EstadisticasView from "./components/EstadisticasView";
import { NAV_ITEMS, S } from "./constants";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTrayecto, setSelectedTrayecto] = useState("all");
  const [selectedSeccion, setSelectedSeccion] = useState("all");
  const [activeDay, setActiveDay] = useState("all");
  const [expandedCell, setExpandedCell] = useState(null);
  const [docenteNav, setDocenteNav] = useState(null);
  const [materiaNav, setMateriaNav] = useState(null);

  const appData = useAppData();

  if (appData.user === undefined) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0F172A", color: "#94A3B8", fontFamily: "system-ui, sans-serif", fontSize: 15 }}>Verificando sesión…</div>;
  if (!appData.user) return <LoginScreen />;
  if (appData.loading && !appData.data.length) return <div style={{ padding: 20, textAlign: "center", fontSize: 15, fontWeight: 500 }}>Cargando horarios...</div>;

  const handleNavigate = (r) => {
    if (r.docente) { setDocenteNav(r.rawDocente || r.docente); setView("docentes"); }
    else if (r.materia) { setMateriaNav(r.rawMateria); setView("materias"); }
    else setView("horarios");
  };

  const seccionesByTrayecto = React.useMemo(() => {
    return [...new Set(appData.data.map(d => d.sheet.trim()))].sort().filter(s =>
      selectedTrayecto === "all" || appData.data.some(d => d.sheet.trim() === s && d.trayecto === selectedTrayecto)
    );
  }, [selectedTrayecto, appData.data]);

  const nav = NAV_ITEMS.map(item => ({ ...item, badge: item.hasBadge ? appData.conflicts.length : 0 }));

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui,-apple-system,sans-serif", background: "#F3F4F6", overflow: "hidden" }}>
      <ResponsiveStyles />
      {appData.toast && <Toast message={appData.toast.message} type={appData.toast.type} onClose={() => appData.showToast(null)} />}
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 299 }} />
      <aside className={`sidebar-aside${sidebarOpen ? " open" : ""}`} style={{ width: 220, background: "#111827", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>PNF</div>
          <select value={appData.selectedPrograma} onChange={e => appData.setSelectedPrograma(e.target.value)} style={{ ...S.select, width: "100%", background: "#1F2937", color: "#fff", borderColor: "#374151", marginBottom: 12 }}>
            {appData.programasDisponibles.map(p => <option key={p} value={p}>{p === "todos" ? "📋 Todos los programas" : p}</option>)}
          </select>
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#1F2937", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "#9CA3AF" }}>Clases</span><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{appData.stats.total}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "#9CA3AF" }}>Secciones</span><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{appData.stats.secciones}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "#9CA3AF" }}>Docentes</span><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{appData.stats.docentes}</span></div>
          </div>
          <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 6, background: appData.isOffline ? "#FEF2F2" : "#F0FDF4", display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: appData.isOffline ? "#DC2626" : "#16A34A", flexShrink: 0 }}></span>
            <span style={{ color: appData.isOffline ? "#991B1B" : "#065F46", fontWeight: 600 }}>{appData.isOffline ? "Modo offline" : "En línea"}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 9, color: "#6B7280", textAlign: "center" }}>Última sinc: {appData.lastSync}</div>
        </div>
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                border: "none", borderRadius: 8, background: view === item.id ? "#2563EB" : "transparent",
                color: view === item.id ? "#fff" : "#9CA3AF", cursor: "pointer", fontSize: 14,
                textAlign: "left", marginBottom: 2, fontWeight: view === item.id ? 600 : 400
              }}
            >
              <span style={{ fontSize: 15 }}>{item.emoji}</span><span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 10, fontSize: 11, padding: "2px 7px", fontWeight: 700 }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 14px", borderTop: "1px solid #1F2937" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button onClick={appData.exportarDatos} disabled={appData.uploading || !appData.data.length} style={{ flex: 1, cursor: appData.data.length ? "pointer" : "not-allowed", background: "#059669", color: "#fff", textAlign: "center", padding: "7px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", opacity: appData.data.length ? 1 : 0.5 }}>💾 Backup</button>
            <label htmlFor="import-backup" style={{ flex: 1, cursor: "pointer", background: "#D97706", color: "#fff
