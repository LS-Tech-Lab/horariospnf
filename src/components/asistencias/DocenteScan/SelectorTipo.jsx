// Pantalla inicial: elegir entre marcar Entrada o Salida.
// Extraído de DocenteScan.jsx.

import Shell from "./Shell";

function SelectorTipo({ onElegir }) {
  return (
    <Shell>
      <div style={{ textAlign:"center", marginBottom:24, width:"100%" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#1E3A8A,#2563EB)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 12px" }}>📲</div>
        <h1 style={{ margin:0, fontSize:19, fontWeight:700, color:"#111827" }}>Control de Asistencia</h1>
        <p style={{ margin:"5px 0 0", fontSize:13, color:"#6B7280" }}>¿Qué deseas registrar?</p>
      </div>

      <button
        onClick={() => onElegir("ENTRADA")}
        style={{ width:"100%", padding:"16px 0", background:"#2563EB", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
      >
        🟢 Marcar Entrada
      </button>

      <button
        onClick={() => onElegir("SALIDA")}
        style={{ width:"100%", padding:"16px 0", background:"#fff", color:"#374151", border:"1.5px solid #D1D5DB", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
      >
        🔴 Marcar Salida
      </button>

      <p style={{ marginTop:18, fontSize:11, color:"#9CA3AF", textAlign:"center", lineHeight:1.5 }}>
        Debes marcar tu entrada antes de poder marcar la salida.
      </p>
    </Shell>
  );
}

export default SelectorTipo;
