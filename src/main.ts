import { APP_INITIALIZER, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalBroadcastService, MsalInterceptor, MsalInterceptorConfiguration, MsalService } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { routes } from './app/routes';
import { Auth } from './app/core/auth';
import { azure, msalConfig } from './app/core/auth-config';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet], template: '<router-outlet/>' })
class App {}

// El interceptor adjunta el access token a toda llamada que vaya al BFF o al servicio Notify/API Gateway.
const interceptorConfig = (): MsalInterceptorConfiguration => {
  const map = new Map<string, string[]>([[azure.apiBaseUrl + '*', [azure.scope]]]);
  if (azure.notifyApiUrl && azure.notifyApiUrl !== azure.apiBaseUrl) {
    map.set(azure.notifyApiUrl + '*', [azure.scope]);
  }
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: map,
  };
};

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: MSAL_INSTANCE, useFactory: () => new PublicClientApplication(msalConfig) },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: interceptorConfig },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalBroadcastService,
    { provide: APP_INITIALIZER, multi: true, deps: [Auth], useFactory: (a: Auth) => () => a.init() },
  ],
});
