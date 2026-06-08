import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message
      );
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      {/* Fondo animado */}
      <div style={styles.bg}>
        <div style={{ ...styles.blob, top: "10%", left: "15%", background: "radial-gradient(circle, #2563EB44, transparent 70%)" }} />
        <div style={{ ...styles.blob, bottom: "15%", right: "10%", background: "radial-gradient(circle, #7C3AED44, transparent 70%)", width: 500, height: 500 }} />
        <div style={{ ...styles.blob, top: "50%", left: "50%", background: "radial-gradient(circle, #059669 22, transparent 70%)", width: 300, height: 300 }} />
      </div>

      {/* Card */}
      <div style={styles.card}>
        {/* Logo / Header */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>📅</div>
          <div>
            <div style={styles.logoTitle}>Horarios PNF</div>
            <div style={styles.logoSub}>Sistema de Gestión Académica</div>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.welcomeText}>Acceso al panel de administración</div>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Email */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Correo electrónico</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                required
                autoComplete="email"
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerDot} /> PNF · Cabimas · Sede Los Laureles
        </div>
      </div>
    </div>
  );
}

/* ── Estilos ──────────────────────────────────────────────────── */
const styles = {
  overlay: {
    minHeight: "100vh",
    background: "#0F172A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bg: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  blob: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: "50%",
    filter: "blur(80px)",
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(30, 41, 59, 0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: "40px 44px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 36,
    width: 56,
    height: 56,
    background: "linear-gradient(135deg, #2563EB, #7C3AED)",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 15px #2563EB55",
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#F8FAFC",
    letterSpacing: "-0.3px",
  },
  logoSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.07)",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 24,
    letterSpacing: "0.01em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    fontSize: 14,
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "11px 14px 11px 38px",
    color: "#F1F5F9",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    padding: 4,
    lineHeight: 1,
    color: "#64748B",
  },
  errorBox: {
    background: "rgba(220, 38, 38, 0.12)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#FCA5A5",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  submitBtn: {
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 15px #2563EB44",
    transition: "transform 0.15s, box-shadow 0.15s",
    letterSpacing: "0.02em",
  },
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  footer: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 11,
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerDot: {
    display: "inline-block",
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#2563EB",
  },
};

/* Spinner keyframes via global style injection */
if (typeof document !== "undefined" && !document.getElementById("login-spin-style")) {
  const s = document.createElement("style");
  s.id = "login-spin-style";
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}
