# AndesStay Frontend (Angular 18)

Frontend SPA para la plataforma **AndesStay**, desarrollado con Angular 18 e integrado con autenticación empresarial Microsoft Entra ID (MSAL).
En la Entrega 2 incluye la **pantalla de mensajería y notificaciones**, conectada a `ms-andesstay-notify` a través del API Gateway de AWS.
En la Entrega 3 incorpora la **página dedicada de checkout**, **gestión de reservas con filtros y paginación**, **badges por estado**, **auditoría mejorada**, **environments por ambiente** y soporte **Docker**.

---

## 🚀 Requisitos y Puesta en Marcha

1. **Node.js**: Versión 18.19 o superior.
2. **Instalación de dependencias**:
   ```bash
   npm install
   ```
3. **Ejecución local**:
   ```bash
   npm start
   ```
   Acceder a `http://localhost:4200`. Debe ser **exactamente** este origen: es el redirect URI registrado en Azure Entra ID
   y el único origen permitido por el CORS del API Gateway.

4. **Modos de Acceso**:
   - **Demo / Local**: Inicio de sesión mediante correo y contraseña simulados (ej. `admin@andesstay.cl`).
   - **Microsoft Entra ID (AndesStay)**: Autenticación OAuth 2.0 / OpenID Connect con la cuenta académica, con claims de roles y token Bearer automático hacia el backend.

---

## 🐳 Docker

### Build de producción

```bash
docker compose up --build frontend
```

Sirve la SPA en `http://localhost:4200` con Nginx (el redirect URI de Azure sigue siendo `http://localhost:4200`).

### Desarrollo con hot reload

```bash
docker compose --profile dev up frontend-dev
```

Monta el código como volumen y ejecuta `ng serve` con `--poll 2000` para detectar cambios en volúmenes Docker.

---

## ⚙️ Environments

La configuración de URLs del backend se lee desde archivos de ambiente:

| Archivo | Uso |
|---|---|
| `src/environments/environment.ts` | Desarrollo (apunta a `localhost:8080`) |
| `src/environments/environment.prod.ts` | Producción (placeholders `CHANGE_ME`) |

El build de producción (`ng build`) reemplaza automáticamente `environment.ts` por `environment.prod.ts` gracias a `fileReplacements` en `angular.json`.

Para desplegar, edita `environment.prod.ts` con las URLs reales del BFF y Notify:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.andesstay.cl',
  notifyApiUrl: 'https://api.andesstay.cl',
  notifyBaseUrl: 'https://notify.andesstay.cl',
};
```

---

## 🛒 Flujo de Checkout (Entrega 3)

1. El huésped navega al detalle de una cabaña (`/cabana/:id`).
2. Pulsa **"Reservar"** → lo lleva a `/cabana/:id/reservar`.
3. En la página de checkout selecciona fecha de entrada, fecha de salida y cantidad de huéspedes.
4. Ve un resumen lateral con nombre, tipo, precio/noche, noches calculadas y total estimado.
5. Pulsa **"Confirmar reserva"** → se crea la reserva en el BFF (o localmente en modo demo).
6. Pantalla de éxito con número de reserva, estado Pendiente, resumen y links a "Ver mis reservas" y "Volver al catálogo".

### Gestión de reservas

- **Huésped (`/reservas`)**: ve sus reservas en tarjetas, puede cancelar las que estén Pendiente o Confirmada.
- **Staff (`/admin/reservas`)**: tabla con filtros (estado, fechas), paginación del servidor (20 por página), y acciones con confirmación (Confirmar, Check-in, Check-out, Cancelar, Eliminar).
- **Eliminar** solo está disponible para ADMIN y solo en reservas Canceladas.

### Traducción de errores

Todos los errores HTTP de reservas se traducen a mensajes en español claros:
- 403 al crear → "Tu cuenta aún no tiene rol de huésped asignado…"
- 409 al crear → "La unidad no está disponible para esas fechas…"
- 401 → "Tu sesión ha expirado…" con botón para iniciar sesión.

---

## 🔐 Integración con Azure Entra ID

La configuración de identidad se encuentra en `src/app/core/auth-config.ts`:
- **`tenantId`**: Tenant institucional AndesStay.
- **`clientId`**: Registro de aplicación del Frontend SPA.
- **`apiClientId` / `scope`**: Scope delegado de la API (`andesstay-backend`, scope `access-all`).
- **`apiBaseUrl`**: URL del BFF (leída desde `environment`).
- **`notifyBaseUrl`**: URL del API Gateway de AWS (leída desde `environment`).

El interceptor de MSAL (`src/main.ts`) adjunta el access token **solo** a las URLs registradas en `protectedResourceMap`
(BFF y `notifyBaseUrl`). Si se agrega un backend nuevo, hay que registrarlo ahí.
Los patrones deben terminar en `/*` (ej. `https://<api-id>.execute-api.us-east-1.amazonaws.com/*`): un `*` pegado al dominio
produce `TypeError: Failed to construct 'URL'` y la petición nunca sale. `main.ts` lo normaliza con la función `toPattern`.

### Roles (`claim: roles`)
- `HUESPED`: puede crear reservas y ver/cancelar las propias.
- `RECEPCIONISTA`: puede gestionar todas las reservas (confirmar, check-in, check-out, cancelar).
- `ADMIN`: todo lo anterior + eliminar reservas canceladas, gestionar cabañas, ver auditoría.
- `AUDITOR`: acceso al panel de administración y auditoría.
- `CONSULTOR`: vista de usuario (catálogo, favoritos, reservas, perfil y mensajes).

Los roles se asignan en Entra ID (aplicación empresarial `andesstay-backend`) y llegan en el token.

---

## 💬 Mensajería y notificaciones (Entrega 2)

Rutas: `/mensajes` (cualquier usuario autenticado) y `/admin/mensajes` (roles de administración).

- **Formulario "Enviar notificación":** canal (Email, Voucher o Housekeeping), destinatario, correo, asunto y mensaje.
  Envía `POST {notifyBaseUrl}/api/v1/notificaciones/enviar` (producer).
- **Historial:** `GET {notifyBaseUrl}/api/v1/notificaciones` con fecha, canal, destinatario, asunto y estado
  (`ENVIADA`, `PENDIENTE`, `FALLIDA`). Se actualiza con el botón *Actualizar* y automáticamente tras enviar.
- El servicio `NotifyService` (`src/app/core/notify.ts`) transforma el formulario al contrato del backend
  (`guestName`, `guestEmail`, `propertyName`, `checkIn`, `checkOut`, `totalAmount`, `currency`, `operatorEmail`,
  `specialRequests`) y completa con valores por defecto lo que el formulario no solicita.

Flujo completo:

```
Angular ─ login Azure ─► token JWT
   └─ Bearer ─► API Gateway (JWT authorizer) ─► ms-andesstay-notify (EC2)
                                                  ├─ producer ─► RabbitMQ (EC2) ─► consumers
                                                  └─ historial ◄─ PostgreSQL (RDS)
```

Si la pantalla muestra "No se pudo conectar con notify": revisar que la EC2 y la RDS estén iniciadas, que la app corra en
`http://localhost:4200`, que `notifyBaseUrl` esté bien escrita y que el API Gateway tenga la ruta `OPTIONS /{proxy+}` sin autorizador.
Los detalles técnicos quedan en la consola del navegador (`[notify] enviar falló`).

---

## 🌿 Flujo de Trabajo: GitHub Flow

Este repositorio sigue la metodología **GitHub Flow**:

1. **Rama principal (`main`)**: siempre contiene código probado y listo para producción.
2. **Crear ramas descriptivas para cada tarea**:
   - `feature/<nombre-caracteristica>`
   - `fix/<descripcion-error>`
   - `docs/<actualizacion-documentacion>`
3. **Confirmaciones (Commits) regulares**: atómicos y descriptivos (Conventional Commits: `feat:`, `fix:`, `docs:`).
4. **Abrir un Pull Request (PR)**: hacia `main` para revisión y retroalimentación.
5. **Revisión y Pruebas**: validación de código, pruebas de compilación y aprobación.
6. **Merge y Despliegue**: se integra a `main` y se elimina la rama secundaria.

---

## 📦 Estructura del Proyecto

```text
AndesStay-frond/
├── src/
│   ├── app/
│   │   ├── core/           # Servicios centrales (API, Auth MSAL, Store, Notify, Errors)
│   │   ├── pages/          # Vistas (Admin, Bookings, Checkout, Home, Detail, Mensajes, etc.)
│   │   └── routes.ts       # Definición de rutas y guards
│   ├── environments/       # Configuración por ambiente (dev / prod)
│   ├── index.html          # Punto de entrada HTML
│   ├── main.ts             # Bootstrap de Angular, MSAL e interceptor
│   └── styles.css          # Estilos globales
├── angular.json            # Configuración de compilación Angular
├── Dockerfile              # Build multi-stage (node → nginx)
├── docker-compose.yml      # Producción + dev con hot reload
├── nginx.conf              # Configuración de Nginx para SPA
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración TypeScript
├── .prettierrc             # Reglas de formateo
└── .editorconfig           # Convenciones de editor
```
