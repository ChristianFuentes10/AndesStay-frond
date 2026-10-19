import { Injectable, inject, signal } from '@angular/core';
import { MSAL_INSTANCE } from '@azure/msal-angular';
import { AccountInfo, IPublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { ADMIN_ROLES, azure } from './auth-config';
import type { User } from './store';

export type Claims = Record<string, any>;

function decode(jwt: string): Claims {
  const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private pca = inject<IPublicClientApplication>(MSAL_INSTANCE);
  initialUser: User | null = null;
  claims: Claims | null = null;
  error = signal('');

  /** Se ejecuta antes de que arranque la app: procesa el regreso de Microsoft y lee el access token. */
  async init() {
    await this.pca.initialize();
    try {
      const res = await this.pca.handleRedirectPromise();
      if (res?.account) this.pca.setActiveAccount(res.account);
    } catch (e: any) { this.error.set(this.msg(e)); }

    const acc = this.pca.getActiveAccount() ?? this.pca.getAllAccounts()[0];
    if (!acc) return;
    this.pca.setActiveAccount(acc);
    try {
      const tk = await this.pca.acquireTokenSilent({ scopes: [azure.scope], account: acc });
      this.claims = decode(tk.accessToken);
      this.initialUser = this.build(acc, this.claims);
    } catch (e: any) {
      if (e instanceof InteractionRequiredAuthError) await this.pca.acquireTokenRedirect({ scopes: [azure.scope], account: acc });
      else this.error.set(this.msg(e));
    }
  }

  private build(acc: AccountInfo, c: Claims): User {
    const roles: string[] = Array.isArray(c['roles']) ? c['roles'] : [];
    return {
      name: c['name'] || acc.name || acc.username,
      email: c['preferred_username'] || acc.username,
      role: roles.some(r => ADMIN_ROLES.includes(r)) ? 'admin' : 'user',
      roles,
    };
  }

  login(loginHint?: string) {
    this.error.set('');
    return this.pca.loginRedirect({ scopes: [azure.scope], loginHint }).catch(e => this.error.set(this.msg(e)));
  }

  logout() {
    return this.pca.logoutRedirect({ account: this.pca.getActiveAccount(), postLogoutRedirectUri: azure.redirectUri });
  }

  private msg(e: any) { return e?.errorMessage || e?.message || 'No se pudo iniciar sesión con Microsoft'; }
}
