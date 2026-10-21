import { Configuration } from '@azure/msal-browser';

// Datos del tenant AndesStay (no son secretos).
export const azure = {
  tenantId: 'c6e4115e-5f34-4439-932c-baf559636e26',
  clientId: '827bc699-01c4-43f5-8211-c7dd33df5f8a',      // App Registration del frontend (SPA)
  apiClientId: '0c8e7680-da3e-46b5-b400-5d45ee4dda46',    // andesstay-backend
  scope: 'api://0c8e7680-da3e-46b5-b400-5d45ee4dda46/access-all',
  redirectUri: window.location.origin,                    // debe ser http://localhost:4200 (igual que en Azure)
  apiBaseUrl: 'http://localhost:8080',                    // BFF; cambiar a la URL real al desplegar
  notifyApiUrl: 'http://localhost:8080',                  // URL del API Gateway o Notify; cambiar si es independiente del BFF
  notifyBaseUrl: 'http://localhost:8082',                 // Microservicio notify independiente (docker en 8082)
};

// Roles de aplicación (claim "roles" del access token, los mismos que exige el BFF) que abren el panel de administración.
export const ADMIN_ROLES = ['ADMIN', 'AUDITOR', 'RECEPCIONISTA'];

export const msalConfig: Configuration = {
  auth: {
    clientId: azure.clientId,
    authority: `https://login.microsoftonline.com/${azure.tenantId}`,
    redirectUri: azure.redirectUri,
    postLogoutRedirectUri: azure.redirectUri,
  },
  cache: { cacheLocation: 'localStorage' },
};
