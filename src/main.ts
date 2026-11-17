import { APP_INITIALIZER, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService,
} from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { routes } from './app/routes';
import { Auth } from './app/core/auth';
import { CognitoAuth } from './app/core/cognito.service';
import { AuthInterceptor } from './app/core/auth.interceptor';
import { Store } from './app/core/store';
import { azure, msalConfig } from './app/core/auth-config';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet], template: '<router-outlet/>' })
class App {}

const toPattern = (url: string) => url.replace(/\/+$/, '') + '/*';

const interceptorConfig = (): MsalInterceptorConfiguration => {
  const map = new Map<string, string[]>([[toPattern(azure.apiBaseUrl), [azure.scope]]]);
  if (azure.notifyApiUrl && azure.notifyApiUrl !== azure.apiBaseUrl) {
    map.set(toPattern(azure.notifyApiUrl), [azure.scope]);
  }
  if (azure.notifyBaseUrl && azure.notifyBaseUrl !== azure.apiBaseUrl) {
    map.set(toPattern(azure.notifyBaseUrl), [azure.scope]);
  }
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: map,
  };
};

const appInitializer = (cognito: CognitoAuth, msalAuth: Auth, store: Store) => async () => {
  try {
    const cognitoUser = await cognito.init();
    if (cognitoUser) {
      store.live = true;
      await store.syncUserWithBackend(cognitoUser);
      await store.refresh();
      return;
    }
  } catch (e) {
    console.warn('Error inicializando Cognito:', e);
  }

  // Si no hay sesión activa en Cognito, inicializar MSAL como fallback
  try {
    await msalAuth.init();
  } catch (e) {
    console.warn('Error inicializando MSAL:', e);
  }
};

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: () => new PublicClientApplication(msalConfig) },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: interceptorConfig },
    MsalService,
    MsalBroadcastService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [CognitoAuth, Auth, Store],
      useFactory: appInitializer,
    },
  ],
});
