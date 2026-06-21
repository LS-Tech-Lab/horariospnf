// ── Grupos de navegación ──────────────────────────────────────────────────────
// Se recalculan según permisos en el componente App
function buildNavGroups(permisos) {
  const grupos = [
    {
      label: "Consulta",
      items: [
        { id: "resumen",   icon: "ti-layout-dashboard", label: "Resumen",    hasBadge: true },
        { id: "horarios",  icon: "ti-calendar-event",   label: "Horarios"  },
        { id: "secciones", icon: "ti-school",           label: "Secciones" },
      ],
    },
    {
      label: "Académico",
      items: [
        { id: "docentes",    icon: "ti-users",        label: "Docentes"    },
        { id: "materias",    icon: "ti-book-2",       label: "Materias"    },
        { id: "asistencias", icon: "ti-printer",      label: "Asistencias" },
        { id: "historial",   icon: "ti-archive",      label: "Historial"   },
        ...(permisos.puedeVerLogs
          ? [{ id: "logs",      icon: "ti-shield-lock", label: "Registros" }]
          : []),
        ...(permisos.puedeGestionarUsuarios
          ? [{ id: "usuarios",  icon: "ti-crown",       label: "Usuarios"  }]
          : []),
      ],
    },
  ];

  return grupos;
}

export default buildNavGroups;
