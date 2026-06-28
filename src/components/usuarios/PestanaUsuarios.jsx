/**
 * usuarios/PestanaUsuarios.jsx
 *
 * Pestaña de gestión de usuarios: tabla, filtros, acciones
 * (activar/desactivar, editar, eliminar) y gestión de huérfanos.
 *
 * Props:
 *   permisos    — objeto de permisos del usuario actual
 *   roles       — lista de roles (para filtro y modal)
 *   programas   — lista de programas disponibles
 *   showToast   — función de toast global (opcional; usa toast local si no se pasa)
 *   logAudit    — función de auditoría
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { S } from "../../constants";
import { hex2rgba, Badge, Spinner, ModalConfirm } from "./shared";
import ModalUsuario from "./ModalUsuario";

export default function PestanaUsuarios({ permisos, roles, programas, showToast: showToastProp, logAudit }) {
  const [usuarios,    setUsuarios]    = useState([]);
  const [huerfanos,   setHuerfanos]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState("");
  const [filtroRol,   setFiltroRol]   = useState("todos");
  const [modalEditar, setModalEditar] = useState(null);
  const [modalNuevo,  setModalNuevo]  = useState(false);
  const [confirm,     setConfirm]     = useState(null);
  const [toastMsg,    setToastMsg]    = useState("");

  const toast = useCallback((msg, type) => {
    if (showToastProp) showToastProp(msg, type);
    else { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); }
  }, [showToastProp]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_users");
      if (error) throw error;
      setUsuarios(data || []);
    } catch (e) {
      toast(`Error al cargar usuarios: ${e.message}`);
    }
    try {
      const { data: orphans } = await supabase.rpc("admin_get_orphan_auth_users");
      setHuerfanos(orphans || []);
    } catch {
      setHuerfanos([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Acciones ───────────────────────────────────────────────────────────────
  const toggleActivo = async (u, nuevoActivo) => {
    try {
      const { error } = await supabase.rpc("admin_toggle_user_activo", {
        p_user_id: u.id, p_activo: nuevoActivo,
      });
      if (error) throw error;
      await logAudit?.({
        accion:     nuevoActivo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
        entidad:    "usuarios",
        entidad_id: u.id,
        resumen:    `Usuario ${nuevoActivo ? "activado" : "desactivado"}: ${u.email}`,
      });
      toast(nuevoActivo ? `${u.nombre} activado.` : `${u.nombre} desactivado.`, "success");
      cargar();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const eliminarUsuario = async (u) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "delete", user_id: u.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al eliminar.");
      await logAudit?.({
        accion:     "ELIMINAR_USUARIO",
        entidad:    "usuarios",
        entidad_id: u.id,
        resumen:    `Usuario eliminado permanentemente: ${u.email}`,
      });
      toast(`Usuario ${u.email} eliminado.`, "success");
      cargar();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const eliminarHuerfano = async (u) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: "delete_orphan", user_id: u.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al eliminar.");
      toast(`Usuario huérfano ${u.email} eliminado.`, "success");
      cargar();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    return (
      (!busqueda || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (filtroRol === "todos" || u.rol === filtroRol)
    );
  });

  const totalActivos = usuarios.filter(u => u.activo).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Barra de herramientas */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email…"
          style={{ ...S.input, flex: "1 1 220px" }}
        />
        <select style={S.select} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          {roles.map(r => <option key={r.nombre} value={r.nombre}>{r.emoji} {r.label}</option>)}
        </select>
        {permisos.puedeGestionarUsuarios && (
          <button
            onClick={() => setModalNuevo(true)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "var(--brand-500)", color: "#fff", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-user-plus" /> Nuevo usuario
          </button>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Total",    value: usuarios.length,             color: "var(--brand-500)",     bg: "var(--color-background-info)" },
          { label: "Activos",  value: totalActivos,                color: "var(--color-success)",  bg: "var(--color-success-bg)" },
          { label: "Inactivos",value: usuarios.length - totalActivos, color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${hex2rgba(s.color, 0.2)}`,
            borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Banner usuarios huérfanos */}
      {huerfanos.length > 0 && (
        <div style={{
          background: "#FEF9EC", border: "1px solid #F59E0B", borderRadius: 10,
          padding: "12px 16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-alert-triangle" style={{ color: "var(--color-warning)", fontSize: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-warning-text)" }}>
              {huerfanos.length} usuario{huerfanos.length !== 1 ? "s" : ""} sin perfil detectado{huerfanos.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#78350F", lineHeight: 1.5 }}>
            Estos usuarios existen en el sistema de autenticación pero{" "}
            <strong>no tienen perfil en la base de datos</strong>, por lo que no pueden iniciar sesión.
            Probablemente se crearon antes de la corrección del constraint de roles. Puedes eliminarlos permanentemente:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {huerfanos.map(h => (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
                borderRadius: 7, padding: "6px 10px",
              }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{h.email}</span>
                  <span style={{ fontSize: 11, color: "var(--color-warning-text)", marginLeft: 8 }}>
                    Creado: {new Date(h.created_at).toLocaleDateString("es-VE")}
                  </span>
                </div>
                <button
                  onClick={() => setConfirm({ usuario: h, accion: "delete_orphan" })}
                  style={{
                    background: "none", border: "1px solid #F59E0B", borderRadius: 6,
                    padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#B45309",
                    display: "flex", alignItems: "center", gap: 4, fontWeight: 600,
                  }}
                >
                  <i className="ti ti-trash" /> Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>
      ) : (
        <div style={{ ...S.card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Usuario", "Rol", "Programa", "Estado", ""].map((h, i) => (
                  <th key={i} style={{ ...S.th, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...S.td, textAlign: "center", padding: 32, color: "var(--color-text-tertiary)" }}>
                    Sin resultados
                  </td>
                </tr>
              ) : usuariosFiltrados.map(u => {
                const rolInfo = roles.find(r => r.nombre === u.rol);
                return (
                  <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.5 }}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 13 }}>{u.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{u.email}</div>
                    </td>
                    <td style={S.td}>
                      <Badge color={rolInfo?.color}>{rolInfo?.emoji || "👤"} {rolInfo?.label || u.rol}</Badge>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{u.programa || "—"}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.badge(
                        u.activo ? "var(--color-success-bg)" : "var(--color-background-tertiary)",
                        u.activo ? "var(--color-success)" : "var(--color-text-tertiary)"
                      ) }}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      {permisos.puedeGestionarUsuarios && (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setModalEditar(u)}
                            title="Editar"
                            style={{
                              background: "none", border: "1px solid var(--color-border-tertiary)",
                              borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                              fontSize: 13, color: "var(--color-text-mid)",
                            }}
                          ><i className="ti ti-pencil" /></button>
                          <button
                            onClick={() => setConfirm({ usuario: u, nuevoActivo: !u.activo })}
                            title={u.activo ? "Desactivar" : "Activar"}
                            style={{
                              background: "none", border: "1px solid var(--color-border-tertiary)",
                              borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 13,
                              color: u.activo ? "var(--color-danger)" : "var(--color-success)",
                            }}
                          ><i className={u.activo ? "ti ti-user-off" : "ti ti-user-check"} /></button>
                          <button
                            onClick={() => setConfirm({ usuario: u, accion: "delete" })}
                            title="Eliminar permanentemente"
                            style={{
                              background: "none", border: "1px solid var(--color-danger-light)",
                              borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                              fontSize: 13, color: "var(--color-danger)",
                            }}
                          ><i className="ti ti-trash" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {(modalNuevo || modalEditar) && (
        <ModalUsuario
          usuario={modalEditar || null}
          roles={roles}
          programas={programas}
          showToast={toast}
          logAudit={logAudit}
          onSave={() => { setModalNuevo(false); setModalEditar(null); cargar(); }}
          onClose={() => { setModalNuevo(false); setModalEditar(null); }}
        />
      )}

      {confirm?.accion === "delete" && (
        <ModalConfirm
          titulo="Eliminar usuario permanentemente"
          mensaje={`¿Eliminar la cuenta de ${confirm.usuario.nombre || confirm.usuario.email} de forma PERMANENTE? Se borrará tanto el perfil como el acceso al sistema. Esta acción no se puede deshacer.`}
          onConfirm={() => { eliminarUsuario(confirm.usuario); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.accion === "delete_orphan" && (
        <ModalConfirm
          titulo="Eliminar usuario sin perfil"
          mensaje={`¿Eliminar permanentemente la cuenta huérfana "${confirm.usuario.email}"? No tiene perfil en la BD y no puede acceder al sistema de todas formas.`}
          onConfirm={() => { eliminarHuerfano(confirm.usuario); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm && !confirm.accion && (
        <ModalConfirm
          titulo={confirm.nuevoActivo ? "Activar usuario" : "Desactivar usuario"}
          mensaje={`¿Confirmas ${confirm.nuevoActivo ? "activar" : "desactivar"} la cuenta de ${confirm.usuario.nombre}?`}
          peligro={!confirm.nuevoActivo}
          onConfirm={() => { toggleActivo(confirm.usuario, confirm.nuevoActivo); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--color-text-primary)", color: "#fff", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 500, zIndex: 2000,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
        }}>{toastMsg}</div>
      )}
    </div>
  );
}
