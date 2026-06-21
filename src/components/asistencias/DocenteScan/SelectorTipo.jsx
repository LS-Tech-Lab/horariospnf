import Shell from "./Shell";

function SelectorTipo({ onElegir }) {
  return (
    <Shell>
      <div style={{ textAlign:"center", marginBottom:"clamp(20px,5vw,32px)", width:"100%" }}>
        <div style={{
          width: "clamp(60px,14vw,76px)",
          height: "clamp(60px,14vw,76px)",
          borderRadius: 18,
          background: "linear-gradient(135deg,#1E3A8A,#2563EB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "clamp(28px,7vw,36px)",
          margin: "0 auto clamp(14px,3vw,18px)",
        }}>
          <i className="ti ti-qrcode" style={{ fontSize:"clamp(28px,7vw,36px)", color:"#fff" }} aria-hidden="true" />
        </div>
        <h1 style={{ margin:0, fontSize:"clamp(22px,5vw,28px)", fontWeight:800, color:"#0F172A" }}>
          Control de Asistencia
        </h1>
        <p style={{ margin:"8px 0 0", fontSize:"clamp(15px,3.5vw,18px)", color:"#64748B" }}>
          ¿Qué deseas registrar?
        </p>
      </div>

      <button
        onClick={() => onElegir("ENTRADA")}
        style={{
          width: "100%",
          padding: "clamp(18px,4.5vw,22px) 0",
          background: "#2563EB", color: "#fff",
          border: "none", borderRadius: 14,
          fontSize: "clamp(18px,4.5vw,22px)", fontWeight: 800,
          cursor: "pointer",
          marginBottom: "clamp(12px,3vw,16px)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          letterSpacing: "0.01em",
        }}
      >
        <i className="ti ti-login" style={{ fontSize:"clamp(20px,5vw,24px)" }} aria-hidden="true" />
        Marcar Entrada
      </button>

      <button
        onClick={() => onElegir("SALIDA")}
        style={{
          width: "100%",
          padding: "clamp(18px,4.5vw,22px) 0",
          background: "#fff", color: "#334155",
          border: "2px solid #E2E8F0", borderRadius: 14,
          fontSize: "clamp(18px,4.5vw,22px)", fontWeight: 800,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          letterSpacing: "0.01em",
        }}
      >
        <i className="ti ti-logout" style={{ fontSize:"clamp(20px,5vw,24px)" }} aria-hidden="true" />
        Marcar Salida
      </button>

      <p style={{ marginTop:"clamp(16px,4vw,22px)", fontSize:"clamp(13px,3vw,15px)", color:"#94A3B8", textAlign:"center", lineHeight:1.6 }}>
        Debes marcar tu entrada antes de poder marcar la salida.
      </p>
    </Shell>
  );
}

export default SelectorTipo;
