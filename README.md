# AndesStay Frontend (Angular 18)

Frontend SPA para la plataforma **AndesStay**, desarrollado con Angular 18 e integrado con autenticación empresarial Microsoft Entra ID (MSAL).
En la Entrega 2 incluye la **pantalla de mensajería y notificaciones**, conectada a `ms-andesstay-notify` a través del API Gateway de AWS.

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
   - **Demo / Local**: Inicio de sesión mediante correo y contraseña simulados (ej. `admin@cabanago.cl`).
   - **Microsoft Entra ID (AndesStay)**: Autenticación OAuth 2.0 / OpenID Connect con la cuenta académica, con claims de roles y token Bearer automático hacia el backend.

---

## 🔐 Integración con Azure Entra ID

La configuración de identidad se encuentra en `src/app/core/auth-config.ts`:
- **`tenantId`**: Tenant institucional AndesStay.
- **`clientId`**: Registro de aplicación del Frontend SPA.
- **`apiClientId` / `scope`**: Scope delegado de la API (`andesstay-backend`, scope `access-all`).
- **`apiBaseUrl`**: URL del BFF (por defecto `http://localhost:8080`).
- **`notifyBaseUrl`**: URL del API Gateway de AWS que expone `ms-andesstay-notify`
  (`https://<api-id>.execute-api.us-east-1.amazonaws.com`, sin `/` final).

El interceptor de MSAL (`src/main.ts`) adjunta el access token **solo** a las URLs registradas en `protectedResourceMap`
(BFF y `notifyBaseUrl`). Si se agrega un backend nuevo, hay que registrarlo ahí.
Los patrones deben terminar en `/*` (ej. `https://<api-id>.execute-api.us-east-1.amazonaws.com/*`): un `*` pegado al dominio
produce `TypeError: Failed to construct 'URL'` y la petición nunca sale. `main.ts` lo normaliza con la función `toPattern`.

### Roles (`claim: roles`)
- `CONSULTOR`: vista de usuario (catálogo, favoritos, reservas, perfil y mensajes).
- `AUDITOR`: acceso además al panel de administración, auditoría y mensajes de administración.
- El código también reconoce `ADMIN` y `RECEPCIONISTA` (heredados de la Entrega 1).

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

1. **Rama principal (`main`)**:
   - La rama `main` siempre contiene código probado y listo para producción.
2. **Crear ramas descriptivas para cada tarea**:
   - Ramas creadas directamente desde `main` con nombres representativos:
     - `feature/<nombre-caracteristica>`
     - `fix/<descripcion-error>`
     - `docs/<actualizacion-documentacion>`
3. **Confirmaciones (Commits) regulares**:
   - Commits atómicos y descriptivos siguiendo convenciones (ej. Conventional Commits: `feat:`, `fix:`, `docs:`).
4. **Abrir un Pull Request (PR)**:
   - Se abre un PR hacia `main` para revisión y retroalimentación del equipo.
5. **Revisión y Pruebas**:
   - Validación de código, pruebas de compilación y aprobación.
6. **Merge y Despliegue**:
   - Se integra a `main` y se elimina la rama secundaria.

---

## 📦 Estructura del Proyecto

```text
AndesStay-frond/
├── src/
│   ├── app/
│   │   ├── core/           # Servicios centrales (API, Auth MSAL, Store, Notify)
│   │   ├── pages/          # Vistas (Admin, Bookings, Home, Detail, Mensajes, etc.)
│   │   └── routes.ts       # Definición de rutas y guards
│   ├── index.html          # Punto de entrada HTML
│   ├── main.ts             # Bootstrap de Angular, MSAL e interceptor
│   └── styles.css          # Estilos globales
├── angular.json            # Configuración de compilación Angular
├── package.json            # Dependencias y scripts
└── tsconfig.json           # Configuración TypeScript
```
