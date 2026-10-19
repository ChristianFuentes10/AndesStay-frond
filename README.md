# CabañaGo (Angular 18) + login Microsoft (Azure Entra ID)
1. Node 18.19+ y luego: `npm install`
2. `npm start` → http://localhost:4200 (debe ser exactamente esa URL: es el redirect URI registrado en Azure)
3. Puedes entrar con correo + contraseña (demo; admin: correo con "admin", ej. admin@cabanago.cl) o con el botón "Microsoft (cuenta AndesStay)", que es opcional y requiere estar invitado en Entra ID.

## Azure
Todo está en `src/app/core/auth-config.ts` (tenant, client ID del frontend, scope `api://0c8e7680-.../access-all`, URL del BFF).
- `core/auth.ts`: procesa el regreso de Microsoft, obtiene el access token, lee el claim `roles` y arma el usuario.
- `main.ts`: MSAL + interceptor que adjunta `Authorization: Bearer` a las llamadas a `apiBaseUrl`.
- Roles: `AUDITOR` (o `ADMIN`) abre el panel de administración; `CONSULTOR` o sin rol ve el panel de usuario. Se cambia en `ADMIN_ROLES`.
- En "Mi Perfil" aparece la tarjeta "Sesión Microsoft" con roles, scp, aud, ver (debe ser 2.0) y expiración.
- Los roles salen en el token solo si están creados en `andesstay-backend` y asignados al usuario en Aplicaciones empresariales; después hay que cerrar sesión y volver a entrar.

## Datos
Cabañas, reservas y mensajes siguen simulados en `core/store.ts`. Para conectar al BFF, usa HttpClient: el token ya se adjunta solo.

## Conexión con el backend (BFF)
Con sesión Microsoft el frontend usa el BFF (`apiBaseUrl` en `auth-config.ts`, por defecto http://localhost:8080); con correo/contraseña sigue en modo demo con datos simulados.
- Catálogo → `/api/catalog/units` (cabañas = unidades; nombre, tipo, capacidad, precio y disponibilidad vienen del backend; ubicación, descripción, foto, habitaciones y baños se guardan solo en el navegador).
- Reservas → `/api/reservations` (+ `/mias`, `/{id}/confirmar|checkin|checkout|cancelar`). Admin/Recepcionista ven todas; el resto, las suyas.
- Auditoría → `/api/audit` (pantalla nueva «Auditoría», solo ADMIN y AUDITOR).
- Roles que reconoce (claim `roles`): ADMIN (todo), RECEPCIONISTA (gestiona reservas), AUDITOR (auditoría), HUESPED (reserva). Deben existir como roles de aplicación en Azure.
- Mensajes y favoritos no tienen backend: quedan locales.
