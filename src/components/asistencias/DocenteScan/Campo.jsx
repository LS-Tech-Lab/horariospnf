// Input con estilo y manejo de error/hint, usado en el formulario de
// primera vez. Extraído de DocenteScan.jsx.

function Campo({ label, hint, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>{label}</label>
      <input
        {...props}
        style={{ width:"100%", padding:"11px 14px", borderRadius:9, border:`1.5px solid ${error ? "#FCA5A5" : "#D1D5DB"}`, fontSize:15, color:"#111827", outline:"none", boxSizing:"border-box", fontWeight:600 }}
        onFocus={e => { e.target.style.borderColor="#2563EB"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.12)"; }}
        onBlur={e  => { e.target.style.borderColor= error ? "#FCA5A5" : "#D1D5DB"; e.target.style.boxShadow="none"; }}
      />
      {error ? (
        <p style={{ margin:"4px 0 0", fontSize:11, color:"#DC2626", fontWeight:600 }}>⚠️ {error}</p>
      ) : hint ? (
        <p style={{ margin:"4px 0 0", fontSize:11, color:"#9CA3AF" }}>{hint}</p>
      ) : null}
    </div>
  );
}

export default Campo;
