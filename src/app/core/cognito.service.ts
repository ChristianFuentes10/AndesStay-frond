import { Injectable, signal } from '@angular/core';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { environment } from '../../environments/environment';

export interface CognitoLoginResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  sub: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class CognitoAuth {
  private userPool: CognitoUserPool | null = null;
  readonly error = signal<string>('');
  readonly loading = signal<boolean>(false);

  private getUserPool(): CognitoUserPool {
    if (!this.userPool) {
      this.userPool = new CognitoUserPool({
        UserPoolId: environment.cognito.userPoolId,
        ClientId: environment.cognito.clientId,
      });
    }
    return this.userPool;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('as_access_token');
  }

  getIdToken(): string | null {
    return localStorage.getItem('as_id_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Intenta restaurar la sesion activa de Cognito desde el pool o localStorage.
   */
  async init(): Promise<CognitoLoginResult | null> {
    const pool = this.getUserPool();
    const cognitoUser = pool.getCurrentUser();

    if (!cognitoUser) {
      const accessToken = localStorage.getItem('as_access_token');
      const idToken = localStorage.getItem('as_id_token');
      if (accessToken && idToken) {
        try {
          const idPayload = this.decodeJwt(idToken);
          const accessPayload = this.decodeJwt(accessToken);
          const exp = idPayload.exp || accessPayload.exp;
          if (exp && exp * 1000 > Date.now()) {
            const roles = (idPayload['cognito:groups'] || accessPayload['cognito:groups'] || []);
            return {
              accessToken,
              idToken,
              refreshToken: localStorage.getItem('as_refresh_token') || '',
              sub: idPayload['sub'] || accessPayload['sub'] || '',
              username: idPayload['cognito:username'] || '',
              email: idPayload['email'] || '',
              name: idPayload['name'] || idPayload['email'] || '',
              phone: idPayload['phone_number'] || '',
              roles: Array.isArray(roles) ? roles : [roles],
            };
          }
        } catch {
          this.logout();
        }
      }
      return null;
    }

    return new Promise((resolve) => {
      cognitoUser.getSession((err: any, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
          return;
        }

        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        localStorage.setItem('as_access_token', accessToken);
        localStorage.setItem('as_id_token', idToken);
        localStorage.setItem('as_refresh_token', refreshToken);
        localStorage.setItem('as_auth_provider', 'cognito');

        const idPayload = session.getIdToken().decodePayload();
        const accessPayload = session.getAccessToken().decodePayload();
        const roles = (idPayload['cognito:groups'] || accessPayload['cognito:groups'] || []);

        resolve({
          accessToken,
          idToken,
          refreshToken,
          sub: idPayload['sub'] || accessPayload['sub'] || '',
          username: idPayload['cognito:username'] || cognitoUser.getUsername(),
          email: idPayload['email'] || '',
          name: idPayload['name'] || cognitoUser.getUsername(),
          phone: idPayload['phone_number'] || '',
          roles: Array.isArray(roles) ? roles : [roles],
        });
      });
    });
  }

  /**
   * Registro en Cognito con email y atributos basicos.
   */
  signUp(username: string, email: string, pass: string, name: string, phone?: string): Promise<any> {
    const pool = this.getUserPool();
    const attributes: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email.trim() }),
      new CognitoUserAttribute({ Name: 'name', Value: name.trim() }),
    ];
    if (phone && phone.trim()) {
      attributes.push(new CognitoUserAttribute({ Name: 'phone_number', Value: phone.trim() }));
    }

    return new Promise((resolve, reject) => {
      pool.signUp(username.trim(), pass, attributes, [], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  /**
   * Confirmacion de cuenta con codigo recibido por correo.
   */
  confirmSignUp(username: string, code: string): Promise<any> {
    const user = new CognitoUser({
      Username: username.trim(),
      Pool: this.getUserPool(),
    });

    return new Promise((resolve, reject) => {
      user.confirmRegistration(code.trim(), true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  /**
   * Reenvio de codigo de confirmacion.
   */
  resendConfirmationCode(username: string): Promise<any> {
    const user = new CognitoUser({
      Username: username.trim(),
      Pool: this.getUserPool(),
    });

    return new Promise((resolve, reject) => {
      user.resendConfirmationCode((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  /**
   * Autenticacion contra Cognito y persistencia de tokens.
   */
  login(usernameOrEmail: string, pass: string): Promise<CognitoLoginResult> {
    const user = new CognitoUser({
      Username: usernameOrEmail.trim(),
      Pool: this.getUserPool(),
    });
    const authDetails = new AuthenticationDetails({
      Username: usernameOrEmail.trim(),
      Password: pass,
    });

    return new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          const accessToken = session.getAccessToken().getJwtToken();
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();

          localStorage.setItem('as_access_token', accessToken);
          localStorage.setItem('as_id_token', idToken);
          localStorage.setItem('as_refresh_token', refreshToken);
          localStorage.setItem('as_auth_provider', 'cognito');

          const idPayload = session.getIdToken().decodePayload();
          const accessPayload = session.getAccessToken().decodePayload();
          const roles = (idPayload['cognito:groups'] || accessPayload['cognito:groups'] || []);

          const res: CognitoLoginResult = {
            accessToken,
            idToken,
            refreshToken,
            sub: idPayload['sub'] || accessPayload['sub'] || '',
            username: idPayload['cognito:username'] || usernameOrEmail,
            email: idPayload['email'] || usernameOrEmail,
            name: idPayload['name'] || usernameOrEmail,
            phone: idPayload['phone_number'] || '',
            roles: Array.isArray(roles) ? roles : [roles],
          };
          resolve(res);
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: () => {
          reject(new Error('Se requiere cambio de contraseña inicial. Contacta al administrador.'));
        },
      });
    });
  }

  logout(): void {
    try {
      const user = this.getUserPool().getCurrentUser();
      if (user) {
        user.signOut();
      }
    } catch {}

    localStorage.removeItem('as_access_token');
    localStorage.removeItem('as_id_token');
    localStorage.removeItem('as_refresh_token');
    localStorage.removeItem('as_auth_provider');
  }

  decodeJwt(token: string): any {
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    } catch {
      return {};
    }
  }

  translateError(err: any): string {
    const code = err?.code || err?.name || '';
    const msg = err?.message || '';

    switch (code) {
      case 'UserNotFoundException':
        return 'No existe una cuenta con ese correo o usuario.';
      case 'NotAuthorizedException':
        return 'Contraseña o usuario incorrecto.';
      case 'UserNotConfirmedException':
        return 'La cuenta no ha sido confirmada. Ingresa el código enviado a tu correo.';
      case 'UsernameExistsException':
        return 'Ya existe un usuario registrado con ese correo o nombre de usuario.';
      case 'InvalidPasswordException':
        return 'La contraseña debe tener al menos 8 caracteres, mayúsculas, números y símbolos.';
      case 'CodeMismatchException':
        return 'Código de confirmación incorrecto.';
      case 'ExpiredCodeException':
        return 'El código ha expirado. Solicita un nuevo código.';
      case 'LimitExceededException':
        return 'Has excedido el límite de intentos. Intenta más tarde.';
      default:
        return msg || 'Ocurrió un error al procesar la solicitud.';
    }
  }
}

