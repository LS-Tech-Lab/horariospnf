import React from "react";

/**
 * Mejora 6: ErrorBoundary global.
 * Captura cualquier error de render en el árbol y muestra un mensaje amigable
 * en lugar de una pantalla blanca. Incluye botón para recargar.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturó un error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100vh", gap: 16, padding: 32, fontFamily: "system-ui, sans-serif",
        background: "#0F172A", color: "#E2E8F0", textAlign: "center",
      }}>
        <span style={{ fontSize: 48 }}>⚠️</span>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#F1F5F9" }}>
          Algo salió mal
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#94A3B8", maxWidth: 420, lineHeight: 1.6 }}>
          {this.state.error?.message || "Error inesperado en la aplicación."}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: "10px 24px", borderRadius: 8, border: "none",
            background: "#3B82F6", color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Recargar página
        </button>
      </div>
    );
  }
}
