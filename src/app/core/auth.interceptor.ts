import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CognitoAuth } from './cognito.service';
import { environment } from '../../environments/environment';

/**
 * Interceptor HTTP que adjunta el Bearer Token de AWS Cognito
 * a todas las peticiones dirigidas al BFF y a los microservicios.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private cognito = inject(CognitoAuth);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.cognito.getAccessToken();

    // Solo adjuntar si no viene ya un header Authorization y existe un token de Cognito
    if (token && !req.headers.has('Authorization')) {
      const isTarget =
        req.url.startsWith(environment.apiBaseUrl) ||
        req.url.startsWith(environment.notifyApiUrl) ||
        req.url.startsWith(environment.notifyBaseUrl) ||
        req.url.startsWith('/api') ||
        req.url.includes(':8080');

      if (isTarget) {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next.handle(cloned);
      }
    }

    return next.handle(req);
  }
}

