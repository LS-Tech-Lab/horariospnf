> **Nota:** Este documento describe el diseño original del sistema de roles y permisos.
> La migración referenciada como `0006_seguridad_roles_logs.sql` fue posteriormente
> dividida/renombrada en el historial real de migraciones (ver `0006_modulo_asistencias_qr.sql`,
> `0006b_acceso_anonimo_scan.sql` y `0007_rol_operador_qr.sql`). Se conserva como referencia
> conceptual de la matriz de roles, no como instrucción literal de instalación.

# 🔐 Sistema de Seguridad — Guía de Implementación

## Archivos creados / modificados

### Nuevos archivos
| Archivo | Descripción |
|---|---|
| `src/hooks/useAuth.js` | Hook central de auth: roles, permisos, login, logout, logAudit |
| `src/components/UsuariosView.jsx` | Panel de gestión de usuarios (solo admin) |
| `src/components/LogsView.jsx` | Vista de logs de sesión y auditoría |
| `src/supabase/migrations/0006_seguridad_roles_logs.sql` | Migración completa de BD |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Integración de `useAuth`, menú adaptativo por rol, pantallas de error |
| `src/components/DocentesView.jsx` | Botón editar oculto si sin permiso |
| `src/components/MateriasView.jsx` | Botón editar oculto si sin permiso |
| `src/components/HistorialView.jsx` | Botones cerrar/crear ocultados si sin permiso |

---

## Estructura de roles y permisos

| Acción | Admin 👑 | Coordinador 🏛️ | Secretario 📋 | Administrativo 👤 |
|---|:---:|:---:|:---:|:---:|
| Ver horarios (su programa) | ✅ | ✅ | ✅ (solo su prog.) | ✅ |
| Importar Excel | ✅ | ✅ | ✅ (solo su prog.) | ❌ |
| Editar docentes/materias | ✅ | ✅ | ✅ (solo su prog.) | ❌ |
| Borrar horarios | ✅ | ✅ | ❌ | ❌ |
| Exportar backup | ✅ | ✅ | ❌ | ❌ |
| Restaurar backup | ✅ | ❌ | ❌ | ❌ |
| Gestionar trimestres | ✅ | ✅ | ❌ | ❌ |
| Ver logs de sesión | ✅ | ✅ | ❌ | ❌ |
| Ver auditoría | ✅ | ✅ | ✅ (solo su prog.) | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |

---

## Pasos de implementación en Supabase

### 1. Ejecutar la migración SQL
En el Dashboard de Supabase → **SQL Editor**, ejecutar el archivo:
```
src/supabase/migrations/0006_seguridad_roles_logs.sql
```

### 2. Crear el primer usuario administrador
En **Authentication → Users → Add user**:
- Email: `admin@tuinstitucion.edu.ve`
- Password: (elige una contraseña segura)
- Auto-confirm: ✅

Luego en el **SQL Editor**:
```sql
INSERT INTO user_profiles (id, email, nombre, rol)
VALUES (
  '<UUID-del-usuario-creado>',
  'admin@tuinstitucion.edu.ve',
  'Administrador del Sistema',
  'admin'
);
```

> El UUID del usuario se encuentra en la columna `id` de la tabla `auth.users`
> o en la pantalla del usuario recién creado en el Dashboard.

### 3. Crear los demás usuarios desde la app
1. Inicia sesión con la cuenta admin
2. Ve a **Sistema → Usuarios** (solo visible para admin)
3. Usa el botón **➕ Nuevo usuario**

> **Nota:** Si la creación desde la app falla (requiere Service Role Key),
> crea la cuenta en Supabase Dashboard y luego asigna el rol desde la app.

---

## Configuración de Supabase Auth recomendada

En **Authentication → Settings**:
- **Email confirmations**: desactivar (para que las cuentas funcionen inmediatamente)
- **Secure email change**: activar
- **Minimum password length**: 8
- **Rate limit**: activar (protección brute force en backend)

---

## Seguridad a nivel de base de datos (RLS)

Las políticas de Row Level Security garantizan que incluso si alguien accede
directamente a la API de Supabase, solo puede ver/modificar lo que le corresponde:

- `user_profiles`: cada usuario ve su propio perfil; admin ve todos
- `session_logs`: solo admin y coordinador pueden leer
- `audit_logs`: admin/coordinador ven todo; secretario ve solo su programa
- `horarios`, `docentes`, `materias`: RLS existente (autenticados)

---

## Flujo de log de auditoría

Cada operación de escritura llama a `logAudit()` automáticamente:

```js
// Ejemplo en App.jsx
await logAudit({
  accion:            "IMPORTAR_EXCEL",
  entidad:           "horarios",
  lapso:             "2-2025",
  programa_afectado: "PNF Informática",
  resumen:           "Importación Excel: horarios_informatica.xlsx",
});
```

Las acciones registradas automáticamente son:
- `IMPORTAR_EXCEL` — al cargar un archivo
- `EXPORTAR_BACKUP` — al descargar backup
- `CREAR_USUARIO` / `EDITAR_USUARIO` / `ACTIVAR_USUARIO` / `DESACTIVAR_USUARIO`
- `CREAR_TRIMESTRE` / `CERRAR_TRIMESTRE` (pendiente: integrar en HistorialView)
- `EDITAR_DOCENTE` / `EDITAR_MATERIA` (pendiente: integrar en saveDocenteName/saveMateriaName)

---

## Pendientes opcionales (mejoras futuras)

1. **Auditoría en edición de docentes/materias**: pasar `logAudit` a `useAppData`
   y llamarlo en `saveDocenteName` / `saveMateriaName`.

2. **Auditoría en HistorialView**: recibir `logAudit` como prop y llamarlo
   en `handleCerrar` / `handleCrear`.

3. **Creación de usuarios con Service Role**: para crear usuarios directamente
   desde la app sin pasar por el Dashboard, necesitas una Edge Function de Supabase
   con la `service_role` key que exponga un endpoint autenticado.

4. **Cambio de contraseña propio**: agregar opción en el perfil de usuario
   para que cada usuario cambie su propia contraseña.
