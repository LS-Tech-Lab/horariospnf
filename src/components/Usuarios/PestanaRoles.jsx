/**
 * usuarios/PestanaRoles.jsx
 *
 * Pestaña de gestión de roles: lista expandible con detalle de permisos,
 * creación, edición y eliminación de roles personalizados.
 *
 * Props:
 *   permisos       — objeto de permisos del usuario actual
 *   onRolesChanged — callback que recibe la lista actualizada de roles
 *   showToast      — función de toast global (opcional)
 *   logAudit       — función de auditoría
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { S } from "../../constants";
import { GRUPOS_PERMISOS, hex2rgba, Spinner, ModalConfirm } from "./shared";
import ModalRol from "./ModalRol";

export default function PestanaRoles({ permisos: permisosUsuario, onRolesChanged, showToast: showToastProp, logAudit }) {
  const [roles,     setRoles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modalRol,  setModalRol]  = useState(undefined); // undefined = cerrado, null = nuevo, obj = editar
  const [confirm,   setConfirm]   = useState(null);
  const [toastMsg,  setToastMsg]  = useState("");
  const [expandido, setExpandido] = useState(null);

  const toast = useCallback((msg, type) => {
    if (showToastProp) showToastProp(msg, type);
    else { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); }
  }, [showToastProp]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_roles");
      if (error) throw error;
      setRoles(data || []);
      onRolesChanged?.(data || []);
    } catch (e) {
      toast(`Error: ${e.message}`);
    }
    setLoading(false);
  }, [onRolesChanged]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminarRol = async (nombre, label) => {
    try {
      const { error } = await supabase.rpc("admin_delete_role", { p_nombre: nombre });
      if (error) throw error;
      await logAudit?.({
        accion:     "ELIMINAR_ROL",
        entidad:    "roles",
        entidad_id: nombre,
        resumen:    `Rol eliminado: "${label}" (${nombre})`,
      });
      toast("✓ Rol eliminado.");
      cargar();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          Los roles del sistema (marcados con 🔒) no se pueden eliminar ni renombrar,
          pero sí puedes editar sus permisos. Los roles personalizados son totalmente gestionables.
        </p>
        {permisosUsuario.puedeGestionarRoles && (
          <button
            onClick={() => setModalRol(null)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "var(--color-role-coord)", color: "#fff", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 16,
            }}
          >
            <i className="ti ti-plus" /> Nuevo rol
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roles.map(r => {
            const abierto = expandido === r.nombre;
            const permsCounts = Object.entries(r.permisos || {}).filter(([, v]) => v === true).length;
            return (
              <div key={r.nombre} style={{ ...S.card, overflow: "visible" }}>
                {/* Cabecera del rol */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandido(abierto ? null : r.nombre)}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: hex2rgba(r.color, 0.12),
                    border: `1px solid ${hex2rgba(r.color, 0.25)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {r.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{r.label}</span>
                      {r.es_sistema && (
                        <span title="Rol del sistema" style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>🔒</span>
                      )}
                      {r.restringe_programa && (
                        <span style={{ ...S.badge("#FEF3C7", "var(--color-warning-text)"), fontSize: 11 }}>
                          Restricción de programa
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                      <code style={{
                        background: "var(--color-background-tertiary)",
                        padding: "1px 5px", borderRadius: 4, fontSize: 11,
                      }}>{r.nombre}</code>
                      &nbsp;·&nbsp;{permsCounts} permiso{permsCounts !== 1 ? "s" : ""} activo{permsCounts !== 1 ? "s" : ""}
                      &nbsp;·&nbsp;{r.usuarios_count} usuario{r.usuarios_count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {permisosUsuario.puedeGestionarRoles && (
                      <>
                        <button
                          onClick={() => setModalRol(r)}
                          title="Editar"
                          style={{
                            background: "none", border: "1px solid var(--color-border-tertiary)",
                            borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                            fontSize: 13, color: "var(--color-text-mid)",
                          }}
                        ><i className="ti ti-pencil" /></button>
                        {!r.es_sistema && (
                          <button
                            onClick={() => setConfirm(r)}
                            title="Eliminar"
                            style={{
                              background: "none", border: "1px solid var(--color-border-tertiary)",
                              borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                              fontSize: 13, color: "var(--color-danger)",
                            }}
                          ><i className="ti ti-trash" /></button>
                        )}
                      </>
                    )}
                    <i
                      className={`ti ti-chevron-${abierto ? "up" : "down"}`}
                      style={{ color: "var(--color-text-tertiary)", fontSize: 16 }}
                    />
                  </div>
                </div>

                {/* Detalle expandible */}
                {abierto && (
                  <div style={{ borderTop: "1px solid var(--color-background-tertiary)", padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                      {GRUPOS_PERMISOS.map(g => (
                        <div key={g.grupo}>
                          <div style={{
                            fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)",
                            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                            display: "flex", alignItems: "center", gap: 5,
                          }}>
                            <i className={`ti ${g.icono}`} /> {g.grupo}
                          </div>
                          {g.items.map(item => {
                            const activo = r.permisos?.[item.key] === true;
                            return (
                              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <i
                                  className={`ti ti-${activo ? "check" : "x"}`}
                                  style={{
                                    fontSize: 13, flexShrink: 0,
                                    color: activo ? "var(--color-success)" : "var(--color-border-secondary)",
                                  }}
                                />
                                <span style={{ fontSize: 12, color: activo ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal rol */}
      {modalRol !== undefined && (
        <ModalRol
          rol={modalRol || null}
          onSave={() => { setModalRol(undefined); cargar(); toast("✓ Rol guardado."); }}
          onClose={() => setModalRol(undefined)}
          logAudit={logAudit}
        />
      )}

      {/* Confirmar eliminación */}
      {confirm && (
        <ModalConfirm
          titulo="Eliminar rol"
          mensaje={`¿Eliminar el rol "${confirm.label}"? Esta acción no se puede deshacer. Solo es posible si ningún usuario lo tiene asignado.`}
          onConfirm={() => { eliminarRol(confirm.nombre, confirm.label); setConfirm(null); }}
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
