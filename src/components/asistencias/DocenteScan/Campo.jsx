// Input con estilo y manejo de error/hint, usado en el formulario de
// primera vez. Extraído de DocenteScan.jsx.

function Campo({ label, hint, error, ...props }) {
  return (
    <div style={{ marginBottom: "clamp(16px,4vw,20px)" }}>
      <label style={{
        display: "block",
        fontSize: "clamp(14px,3.5vw,16px)",
        fontWeight: 700,
        color: "#374151",
        marginBottom: 8,
      }}>{label}</label>
      <input
        {...props}
        style={{
          width: "100%",
          padding: "clamp(14px,3.5vw,16px) clamp(14px,3.5vw,18px)",
          borderRadius: 10,
          border: `2px solid ${error ? "#FCA5A5" : "#D1D5DB"}`,
          fontSize: "clamp(17px,4vw,20px)",
          color: "#111827",
          outline: "none",
          boxSizing: "border-box",
          fontWeight: 600,
        }}
        onFocus={e => { e.target.style.borderColor="#2563EB"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)"; }}
        onBlur={e  => { e.target.style.borderColor= error ? "#FCA5A5" : "#D1D5DB"; e.target.style.boxShadow="none"; }}
      />
      {error ? (
        <p style={{ margin:"5px 0 0", fontSize:"clamp(12px,3vw,14px)", color:"#DC2626", fontWeight:600 }}>⚠️ {error}</p>
      ) : hint ? (
        <p style={{ margin:"5px 0 0", fontSize:"clamp(12px,3vw,14px)", color:"#9CA3AF" }}>{hint}</p>
      ) : null}
    </div>
  );
}

export default Campo;
