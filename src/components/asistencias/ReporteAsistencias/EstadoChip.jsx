// Chip visual con el estado real del docente (entrada/salida/anómalo).
// Extraído de ReporteAsistencias.jsx.

// ── Chip de estado del docente ───────────────────────────────────────────────
// CRÍTICO #1: reemplaza el "✓ Presente" homogéneo por el estado real.
function EstadoChip({ estado }) {
  const map = {
    completo:    { label: "✅ Entrada y salida", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
    solo_entrada:{ label: "🟡 Solo entrada",     bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
    solo_salida: { label: "⚠️ Solo salida",      bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const ui = map[estado] || map.solo_entrada;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: ui.bg, color: ui.color, border: `1px solid ${ui.border}`,
      whiteSpace: "nowrap",
    }}>
      {ui.label}
    </span>
  );
}

export default EstadoChip;
