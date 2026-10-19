# AndesStay Frontend (Angular 18)

Frontend SPA para la plataforma **AndesStay**, desarrollado con Angular 18 e integrado con autenticación empresarial Microsoft Entra ID (Azure AD MSAL).

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
   Acceder a `http://localhost:4200` (URL registrada como redirect URI en Azure Entra ID).

4. **Modos de Acceso**:
   - **Demo / Local**: Inicio de sesión mediante correo y contraseña simulados (ej. `admin@cabanago.cl`).
   - **Microsoft Entra ID (AndesStay)**: Autenticación OAuth 2.0 / OpenID Connect institucional con claims de roles y token Bearer automático para el BFF.

---

## 🔐 Integración con Azure Entra ID

La configuración de identidad se encuentra en `src/app/core/auth-config.ts`:
- **`tenantId`**: Tenant institucional AndesStay.
- **`clientId`**: Registro de aplicación del Frontend SPA.
- **`apiClientId` / `scope`**: Scope delegado para el BFF (`andesstay-backend`).
- **`apiBaseUrl`**: URL del BFF (por defecto `http://localhost:8080`).

### Roles Soportados (`claim: roles`)
- `ADMIN`: Acceso total a gestión de cabañas, usuarios, reservas y auditoría.
- `RECEPCIONISTA`: Gestión operativa y estados de reservas (confirmar, check-in, check-out, cancelar).
- `AUDITOR`: Acceso de lectura al módulo de auditoría y reportes.
- `HUESPED`: Visualización de catálogo, favoritos y reserva de unidades.

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
│   │   ├── core/           # Servicios centrales (API, Auth MSAL, Store)
│   │   ├── pages/          # Vistas (Admin, Bookings, Home, Detail, etc.)
│   │   └── routes.ts       # Definición de rutas y guards
│   ├── index.html          # Punto de entrada HTML
│   ├── main.ts             # Bootstrap de Angular y configuración MSAL
│   └── styles.css          # Estilos globales
├── angular.json            # Configuración de compilación Angular
├── package.json            # Dependencias y scripts
└── tsconfig.json           # Configuración TypeScript
```
