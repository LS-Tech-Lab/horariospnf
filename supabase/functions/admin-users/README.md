# Edge Function: admin-users

Permite crear usuarios y resetear contraseñas de otros usuarios usando la
`service_role` key de Supabase, que nunca se expone al cliente.

## Desplegar

**Opción A — Dashboard (sin instalar nada):**
1. Entra a tu proyecto en supabase.com → **Edge Functions** → **Deploy a new function**.
2. Nombra la función `admin-users`.
3. Pega el contenido de `index.ts`.
4. Guarda y despliega. Listo — `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles automáticamente, no
   hay que configurar ningún secreto.

**Opción B — CLI:**
```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy admin-users
```

## Requisitos en la base de datos

Esta función asume que ya existen (deberían existir, porque `UsuariosView`
ya las usa):
- Tabla `user_profiles` con columnas `id`, `rol`, `activo`.
- RPC `admin_upsert_user_profile(p_user_id, p_email, p_nombre, p_rol, p_programa)`.

## Probar

```bash
curl -i --location --request POST \
  'https://TU_PROJECT_REF.supabase.co/functions/v1/admin-users' \
  --header "Authorization: Bearer TU_ACCESS_TOKEN_DE_SESION" \
  --header 'Content-Type: application/json' \
  --data '{"action":"create","email":"prueba@correo.com","password":"12345678","nombre":"Prueba","rol":"administrativo"}'
```

`TU_ACCESS_TOKEN_DE_SESION` es el `access_token` de una sesión con un
usuario que tenga `rol = 'admin'` en `user_profiles` (lo puedes copiar
desde las DevTools del navegador, en `localStorage`, mientras estás
logueado como admin en la app).
