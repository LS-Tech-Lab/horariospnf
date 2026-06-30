// Input con estilo y manejo de error/hint, usado en el formulario de primera vez.

function Campo({ label, hint, error, success, ...props }) {
  return (
    <div style={{ marginBottom: "clamp(16px,4vw,20px)" }}>
      <label style={{
        display: "block",
        fontSize: "clamp(14px,3.5vw,16px)",
        fontWeight: 700,
        color: "#334155",
        marginBottom: 8,
      }}>{label}</label>
      <input
        {...props}
        style={{
          width: "100%",
          padding: "clamp(14px,3.5vw,16px) clamp(14px,3.5vw,18px)",
          borderRadius: 10,
          border: `2px solid ${error ? "#FCA5A5" : success ? "#86EFAC" : "#E2E8F0"}`,
          fontSize: "clamp(17px,4vw,20px)",
          color: "#0F172A",
          outline: "none",
          boxSizing: "border-box",
          fontWeight: 600,
        }}
        onFocus={e => { e.target.style.borderColor="#2563EB"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)"; }}
        onBlur={e  => { e.target.style.borderColor= error ? "#FCA5A5" : success ? "#86EFAC" : "#E2E8F0"; e.target.style.boxShadow="none"; }}
      />
      {error ? (
        <p style={{ margin:"5px 0 0", fontSize:"clamp(12px,3vw,14px)", color:"#DC2626", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize:13 }} aria-hidden="true" />
          {error}
        </p>
      ) : success ? (
        <p style={{ margin:"5px 0 0", fontSize:"clamp(12px,3vw,14px)", color:"#15803D", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
          <i className="ti ti-check" style={{ fontSize:13 }} aria-hidden="true" />
          {hint}
        </p>
      ) : hint ? (
        <p style={{ margin:"5px 0 0", fontSize:"clamp(12px,3vw,14px)", color:"#64748B" }}>{hint}</p>
      ) : null}
    </div>
  );
}

export default Campo;
