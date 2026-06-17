/**
 * UsuariosView.jsx
 *
 * Panel de gestión de usuarios (solo admin).
 * Permite crear, editar, activar/desactivar usuarios.
 *
 * La creación del usuario en auth.users usa la Admin API de Supabase
 * a través de la anon key + Service Role en un endpoint seguro.
 * Como alternativa, el admin puede usar el Dashboard de Supabase
 * y luego asignar el perfil desde aquí.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { S } from "../constants";

const PROGRAMAS = [
  "PNF Informática",
  "PNF Contaduría Pública",
  "PNF Historia",
  "PNF Agroalimentación",
  "PNF Educación Especial",
];

const ROL_CONFIG = {
  admin:          { label: "Administrador",         emoji: "👑", color: "#7C3AED", bg: "#F5F3FF" },
  coordinador:    { label: "Coordinador General",   emoji: "🏛️", color: "#1D4ED8", bg: "#EFF6FF" },
  secretario:     { label: "Secretario Ap. Docente",emoji: "📋", color: "#0F766E", bg: "#F0FDFA" },
  administrativo: { label: "Administrativo",        emoji: "👤", color: "#374151", bg: "#F9FAFB" },
};

function RolBadge({ rol }) {
  const cfg = ROL_CONFIG[rol] || { label: rol, emoji: "?", color: "#374151", bg: "#F9FAFB" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Modal crear/editar usuario ────────────────────────────────────────
function ModalUsuario({ usuario, onGuardar, onCancelar, guardando }) {
  const esNuevo = !usuario?.id;

  const [nombre,    setNombre]    = useState(usuario?.nombre   || "");
  const [email,     setEmail]     = useState(usuario?.email    || "");
  const [password,  setPassword]  = useState("");
  const [rol,       setRol]       = useState(usuario?.rol      || "administrativo");
  const [programa,  setPrograma]  = useState(usuario?.programa || "");
  const [error,     setError]     = useState(null);

  const valido = nombre.trim() && email.trim()
    && (esNuevo ? password.length >= 8 : true)
    && (rol !== "secretario" || programa);

  const handleSubmit = () => {
    setError(null);
    if (!valido) { setError("Completa todos los campos requeridos."); return; }
    onGuardar({ nombre, email, password, rol, programa: rol === "secretario" ? programa : null });
  };

  const inputStyle = { ...S.input, width: "100%", boxSizing: "border-box", padding: "9px 12px" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900, padding: 20,
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 460, width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ fontSize: 24, marginBottom: 6 }}>{esNuevo ? "➕" : "✏️"}</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
          {esNuevo ? "Nuevo usuario" : `Editar: ${usuario.nombre}`}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748B" }}>
          {esNuevo
            ? "Completa los datos para crear la cuenta."
            : "Modifica los datos del usuario. Deja la contraseña vacía para no cambiarla."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Nombre */}
          <div>
            <label style={labelStyle}>Nombre completo *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: María González" style={inputStyle} />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Correo electrónico *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="usuario@institucion.edu.ve" style={inputStyle}
              disabled={!esNuevo} />
            {!esNuevo && (
              <span style={{ fontSize: 11, color: "#94A3B8" }}>El correo no se puede cambiar.</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>
              Contraseña {esNuevo ? "*" : "(opcional)"} {esNuevo && "(mín. 8 caracteres)"}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={esNuevo ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiar"}
              style={inputStyle} autoComplete="new-password" />
          </div>

          {/* Rol */}
          <div>
            <label style={labelStyle}>Nivel de acceso *</label>
            <select value={rol} onChange={e => setRol(e.target.value)}
              style={{ ...S.select, width: "100%", padding: "9px 12px" }}>
              {Object.entries(ROL_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
              {rol === "admin"          && "Acceso total al sistema. Usuario único preferiblemente."}
              {rol === "coordinador"    && "Acceso total al sistema. Ve y edita todos los programas."}
              {rol === "secretario"     && "Solo puede ver y editar el programa asignado."}
              {rol === "administrativo" && "Solo lectura: puede consultar y exportar reportes."}
            </div>
          </div>

          {/* Programa (solo secretario) */}
          {rol === "secretario" && (
            <div>
              <label style={labelStyle}>Programa asignado *</label>
              <select value={programa} onChange={e => setPrograma(e.target.value)}
                style={{ ...S.select, width: "100%", padding: "9px 12px",
                  borderColor: !programa ? "#FCA5A5" : "#D1D5DB" }}>
                <option value="">— Seleccionar programa —</option>
                {PROGRAMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {!programa && (
                <span style={{ fontSize: 11, color: "#EF4444" }}>
                  El secretario debe tener un programa asignado.
                </span>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 8,
              padding: "10px 14px", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onCancelar}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E5E7EB",
              background: "#F9FAFB", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={!valido || guardando}
            style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none",
              background: valido ? "#2563EB" : "#E5E7EB",
              color: valido ? "#fff" : "#94A3B8",
              cursor: valido ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700 }}>
            {guardando ? "Guardando…" : esNuevo ? "✅ Crear usuario" : "✅ Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export default function UsuariosView({ permisos, logAudit, showToast }) {
  const [usuarios,  setUsuarios]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | { usuario } | { nuevo: true }
  const [guardando, setGuardando] = useState(false);
  const [filtro,    setFiltro]    = useState("");

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_get_users");
    if (error) showToast("❌ Error al cargar usuarios: " + error.message, "error");
    else setUsuarios(data || []);
    setLoading(false);
  }, [showToast]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  // ── Crear usuario ─────────────────────────────────────────────────
  const handleGuardar = async ({ nombre, email, password, rol, programa }) => {
    setGuardando(true);
    const esNuevo = !modal?.usuario?.id;

    try {
      if (esNuevo) {
        // Paso 1: crear usuario en Supabase Auth usando la Admin API
        // Requiere service_role key o llamada server-side.
        // Como la app es client-only, usamos signUp (email confirmation desactivado en Supabase)
        // y luego hacemos upsert del perfil.
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // No requiere confirmación
        });

        if (authError) {
          // Fallback: usar signUp convencional
          // El admin deberá confirmar manualmente o desactivar confirmación en Supabase
          showToast(
            "⚠️ Usa el Dashboard de Supabase > Authentication > Add user para crear la cuenta, luego asigna el perfil aquí.",
            "warning"
          );
          setGuardando(false);
          return;
        }

        const userId = authData.user?.id;
        if (!userId) throw new Error("No se obtuvo ID del usuario creado.");

        // Paso 2: crear perfil extendido
        const { error: profileError } = await supabase.rpc("admin_upsert_user_profile", {
          p_user_id:  userId,
          p_email:    email,
          p_nombre:   nombre,
          p_rol:      rol,
          p_programa: programa,
        });

        if (profileError) throw new Error(profileError.message);

        await logAudit({
          accion:  "CREAR_USUARIO",
          entidad: "usuarios",
          resumen: `Usuario creado: ${email} (${rol}${programa ? ` - ${programa}` : ""})`,
        });

        showToast(`✅ Usuario ${email} creado.`, "success");

      } else {
        // Editar usuario existente
        const userId = modal.usuario.id;

        const { error: profileError } = await supabase.rpc("admin_upsert_user_profile", {
          p_user_id:  userId,
          p_email:    email,
          p_nombre:   nombre,
          p_rol:      rol,
          p_programa: programa,
        });

        if (profileError) throw new Error(profileError.message);

        // Cambiar password si se proporcionó
        if (password) {
          const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password });
          if (pwError) showToast("⚠️ Perfil actualizado pero no se pudo cambiar la contraseña.", "warning");
        }

        await logAudit({
          accion:  "EDITAR_USUARIO",
          entidad: "usuarios",
          entidad_id: userId,
          resumen: `Usuario editado: ${email} (${rol}${programa ? ` - ${programa}` : ""})`,
        });

        showToast(`✅ Usuario ${email} actualizado.`, "success");
      }

      setModal(null);
      await cargarUsuarios();
    } catch (err) {
      showToast("❌ " + err.message, "error");
    }

    setGuardando(false);
  };

  // ── Activar / desactivar ──────────────────────────────────────────
  const handleToggleActivo = async (usuario) => {
    const accion = usuario.activo ? "desactivar" : "activar";
    if (!window.confirm(`¿Confirmas ${accion} a ${usuario.nombre}?`)) return;

    const { error } = await supabase.rpc("admin_toggle_user_activo", {
      p_user_id: usuario.id,
      p_activo:  !usuario.activo,
    });

    if (error) { showToast("❌ " + error.message, "error"); return; }

    await logAudit({
      accion:  usuario.activo ? "DESACTIVAR_USUARIO" : "ACTIVAR_USUARIO",
      entidad: "usuarios",
      entidad_id: usuario.id,
      resumen: `Usuario ${accion}do: ${usuario.email}`,
    });

    showToast(`✅ Usuario ${accion}do.`, "success");
    await cargarUsuarios();
  };

  if (!permisos.puedeGestionarUsuarios) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 14 }}>No tienes permiso para gestionar usuarios.</div>
      </div>
    );
  }

  const filtrados = usuarios.filter(u =>
    !filtro || u.nombre.toLowerCase().includes(filtro.toLowerCase())
      || u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  // Agrupar por rol para mostrar ordenados
  const ordenRoles = ["admin", "coordinador", "secretario", "administrativo"];
  const agrupados = ordenRoles.reduce((acc, rol) => {
    const lista = filtrados.filter(u => u.rol === rol);
    if (lista.length) acc.push({ rol, lista });
    return acc;
  }, []);

  return (
    <>
      {/* Modal */}
      {modal && (
        <ModalUsuario
          usuario={modal.usuario || null}
          onGuardar={handleGuardar}
          onCancelar={() => setModal(null)}
          guardando={guardando}
        />
      )}

      <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>

        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
              Gestión de Usuarios
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setModal({ nuevo: true })}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none",
              background: "#2563EB", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 600 }}>
            ➕ Nuevo usuario
          </button>
        </div>

        {/* Buscador */}
        <input
          value={filtro} onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 20 }}
        />

        {/* Leyenda de roles */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {Object.entries(ROL_CONFIG).map(([k, v]) => (
            <div key={k} style={{ background: v.bg, color: v.color, borderRadius: 8,
              padding: "5px 12px", fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4 }}>
              {v.emoji} {v.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
            Cargando usuarios…
          </div>
        ) : agrupados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 14, color: "#64748B" }}>
              {filtro ? "No se encontraron usuarios." : "No hay usuarios registrados."}
            </div>
          </div>
        ) : (
          agrupados.map(({ rol, lista }) => (
            <div key={rol} style={{ marginBottom: 24 }}>
              {/* Subtítulo de grupo */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 18 }}>{ROL_CONFIG[rol].emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ROL_CONFIG[rol].color }}>
                  {ROL_CONFIG[rol].label}
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>
                  ({lista.length})
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lista.map(u => (
                  <div key={u.id} style={{
                    ...S.card,
                    opacity: u.activo ? 1 : 0.55,
                    borderLeft: `3px solid ${ROL_CONFIG[u.rol]?.color || "#E5E7EB"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", gap: 12 }}>

                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: `linear-gradient(135deg, ${ROL_CONFIG[u.rol]?.color || "#374151"}, #7C3AED)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 700, color: "#fff",
                      }}>
                        {u.nombre?.[0]?.toUpperCase() || "?"}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                            {u.nombre}
                          </span>
                          {!u.activo && (
                            <span style={{ background: "#FEE2E2", color: "#DC2626",
                              borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                              INACTIVO
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          {u.email}
                          {u.programa && (
                            <span style={{ marginLeft: 8, color: "#0F766E", fontWeight: 600 }}>
                              · {u.programa}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
                          Creado {new Date(u.creado_en).toLocaleDateString("es-VE")}
                          {u.creado_por && ` por ${u.creado_por}`}
                        </div>
                      </div>

                      {/* Badge rol */}
                      <RolBadge rol={u.rol} />

                      {/* Acciones */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setModal({ usuario: u })}
                          title="Editar usuario"
                          style={{ background: "#EFF6FF", color: "#1D4ED8", border: "none",
                            borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                            fontSize: 13, fontWeight: 600 }}>
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleActivo(u)}
                          title={u.activo ? "Desactivar" : "Activar"}
                          style={{
                            background: u.activo ? "#FEF2F2" : "#F0FDF4",
                            color: u.activo ? "#DC2626" : "#16A34A",
                            border: "none", borderRadius: 7, padding: "5px 10px",
                            cursor: "pointer", fontSize: 13, fontWeight: 600
                          }}>
                          {u.activo ? "🚫" : "✅"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Nota informativa */}
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10,
          padding: "14px 18px", marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>
            💡 Nota sobre la creación de usuarios
          </div>
          <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.6 }}>
            Si el botón "Nuevo usuario" falla (requiere Service Role Key),
            crea la cuenta primero en el Dashboard de Supabase <strong>Authentication → Users → Add user</strong>,
            luego usa el botón de edición aquí para asignarle el rol y programa correctos.
          </div>
        </div>
      </div>
    </>
  );
}
