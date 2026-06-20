// Fila "esqueleto" mostrada mientras carga la tabla de asistencias.
// Extraído de ReporteAsistencias.jsx.

import { S } from "../../../constants";

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRow({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={S.td}>
          <div style={{
            height: 14, width: [120, 90, 160, 90, 80, 100][i] || 100, borderRadius: 4,
            background: "linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)",
            backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
          }} />
        </td>
      ))}
    </tr>
  );
}

export default SkeletonRow;
