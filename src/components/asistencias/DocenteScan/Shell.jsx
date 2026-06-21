// Contenedor centrado de pantalla completa usado por todas las vistas de
// DocenteScan (formulario, confirmación, resultado, etc).
// Extraído de DocenteScan.jsx.

function Shell({ children, ancho = 380 }) {
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"36px 28px", width:"100%", maxWidth:ancho, boxShadow:"0 20px 60px rgba(0,0,0,0.35)", display:"flex", flexDirection:"column", alignItems:"center" }}>
        {children}
      </div>
    </div>
  );
}

export default Shell;
