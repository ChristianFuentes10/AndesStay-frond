import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '../core/store';
import { Auth } from '../core/auth';
import { CognitoAuth } from '../core/cognito.service';

type LoginMode = 'login' | 'register' | 'confirm';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .wrap {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 440px;
      background: linear-gradient(#0b1210cc, #0b1210ee),
        url('https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=70') center/cover;
    }
    .hero {
      display: grid;
      place-content: center;
      text-align: center;
      gap: 10px;
      padding: 30px;
    }
    .hero .logo {
      font-size: 40px;
    }
    .box {
      background: #0d1512ee;
      border-left: 1px solid var(--b);
      padding: 42px 34px;
      display: grid;
      align-content: center;
      gap: 12px;
    }
    .or {
      text-align: center;
      color: var(--m);
      font-size: 12px;
    }
    .soc {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .alert-success {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid #22c55e;
      color: #4ade80;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #f87171;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
    }
    @media (max-width: 800px) {
      .wrap { grid-template-columns: 1fr; }
      .hero { display: none; }
    }
  `],
  template: `
    <div class="wrap">
      <div class="hero">
        <div class="logo">🏔️ Andes<b>Stay</b></div>
        <p class="muted">Tu próxima escapada,<br>más cerca de lo que imaginas.</p>
      </div>

      <form class="box" (ngSubmit)="submit()">
        <!-- Encabezado según el modo -->
        @if (mode() === 'login') {
          <h2>Iniciar sesión</h2>
          <p class="muted">Accede con tu cuenta AWS Cognito para continuar</p>
        } @else if (mode() === 'register') {
          <h2>Crear cuenta</h2>
          <p class="muted">Regístrate en AndesStay (Cognito)</p>
        } @else {
          <h2>Confirmar código</h2>
          <p class="muted">Ingresa el código de 6 dígitos enviado a tu correo</p>
        }

        <!-- Mensajes de éxito y error -->
        @if (success()) {
          <div class="alert-success">{{ success() }}</div>
        }
        @if (err() || a.error()) {
          <div class="alert-error">{{ err() || a.error() }}</div>
        }

        <!-- Formulario: MODO CONFIRMAR CÓDIGO -->
        @if (mode() === 'confirm') {
          <label class="muted" style="font-size:12px">Usuario o Correo</label>
          <input class="inp" name="e" [(ngModel)]="email" placeholder="Correo electrónico" required />

          <label class="muted" style="font-size:12px">Código de verificación</label>
          <input class="inp" name="c" [(ngModel)]="code" placeholder="Ej: 123456" required />

          <button class="btn" [disabled]="loading()">
            {{ loading() ? 'Confirmando…' : 'Verificar y activar cuenta' }}
          </button>

          <div class="row sp" style="font-size:12px; margin-top:4px">
            <a class="green" href="#" (click)="$event.preventDefault(); resendCode()">Reenviar código</a>
            <a class="muted" href="#" (click)="$event.preventDefault(); mode.set('login')">Volver al login</a>
          </div>
        }

        <!-- Formulario: MODO REGISTRO -->
        @if (mode() === 'register') {
          <input class="inp" name="n" [(ngModel)]="name" placeholder="Nombre completo" required />
          <input class="inp" name="e" type="email" [(ngModel)]="email" placeholder="Correo electrónico" required />
          <input class="inp" name="tel" type="tel" [(ngModel)]="phone" placeholder="Teléfono (+56 9 ...)" />
          <input class="inp" name="p" type="password" [(ngModel)]="pass" placeholder="Contraseña (mínimo 8 caracteres)" required />

          <button class="btn" [disabled]="loading()">
            {{ loading() ? 'Registrando…' : 'Registrarme' }}
          </button>

          <p class="or">
            ¿Ya tienes cuenta?
            <a class="green" href="#" (click)="$event.preventDefault(); mode.set('login')">Inicia sesión</a>
          </p>
          <p class="or">
            ¿Tienes un código pendiente?
            <a class="green" href="#" (click)="$event.preventDefault(); mode.set('confirm')">Confirmar cuenta</a>
          </p>
        }

        <!-- Formulario: MODO INICIAR SESIÓN -->
        @if (mode() === 'login') {
          <input class="inp" name="e" type="text" [(ngModel)]="email" placeholder="Correo electrónico o usuario" required />
          <input class="inp" name="p" type="password" [(ngModel)]="pass" placeholder="Contraseña" required />

          <div class="row sp">
            <label class="row muted" style="font-size:12px"><input type="checkbox" checked /> Recordarme</label>
            <a class="green" href="#" (click)="$event.preventDefault(); mode.set('confirm')" style="font-size:12px">¿Confirmar cuenta?</a>
          </div>

          <button class="btn" [disabled]="loading()">
            {{ loading() ? 'Autenticando…' : 'Iniciar sesión con Cognito' }}
          </button>

          <div class="or">o continúa con</div>
          <div class="soc">
            <button type="button" class="btn ghost" (click)="microsoft()">
              Iniciar con Microsoft (Azure Entra ID)
            </button>
          </div>

          <p class="or">
            ¿No tienes cuenta?
            <a class="green" href="#" (click)="$event.preventDefault(); mode.set('register')">Regístrate</a>
          </p>
        }
      </form>
    </div>
  `,
})
export class Login {
  s = inject(Store);
  r = inject(Router);
  a = inject(Auth);
  cognito = inject(CognitoAuth);

  email = '';
  pass = '';
  name = '';
  phone = '';
  code = '';

  mode = signal<LoginMode>('login');
  err = signal<string>('');
  success = signal<string>('');
  loading = signal<boolean>(false);

  constructor() {
    const u = this.s.user();
    if (u) {
      this.redirect(u);
    }
  }

  async submit() {
    this.err.set('');
    this.success.set('');

    if (this.mode() === 'confirm') {
      await this.doConfirm();
    } else if (this.mode() === 'register') {
      await this.doRegister();
    } else {
      await this.doLogin();
    }
  }

  private async doLogin() {
    if (!this.email || !this.pass) {
      this.err.set('Ingresa tu correo/usuario y contraseña.');
      return;
    }

    this.loading.set(true);
    try {
      const res = await this.cognito.login(this.email, this.pass);
      this.s.live = true;

      // Sincronizar con el BFF: POST /api/users luego GET /api/users/me
      const user = await this.s.syncUserWithBackend(res);
      await this.s.refresh();

      this.redirect(user);
    } catch (e: any) {
      if (e?.name === 'UserNotConfirmedException' || e?.code === 'UserNotConfirmedException') {
        this.mode.set('confirm');
        this.err.set('Tu cuenta aún no está confirmada. Ingresa el código que te enviamos por correo.');
      } else {
        this.err.set(this.cognito.translateError(e));
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async doRegister() {
    if (!this.name || !this.email || !this.pass) {
      this.err.set('Completa todos los campos obligatorios.');
      return;
    }
    if (this.pass.length < 8) {
      this.err.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    this.loading.set(true);
    try {
      await this.cognito.signUp(this.email, this.email, this.pass, this.name, this.phone);
      this.mode.set('confirm');
      this.success.set('¡Registro exitoso! Enviamos un código de confirmación a tu correo.');
    } catch (e: any) {
      this.err.set(this.cognito.translateError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async doConfirm() {
    if (!this.email || !this.code) {
      this.err.set('Ingresa tu usuario/correo y el código de verificación.');
      return;
    }

    this.loading.set(true);
    try {
      await this.cognito.confirmSignUp(this.email, this.code);
      this.mode.set('login');
      this.success.set('¡Cuenta confirmada con éxito! Ahora puedes iniciar sesión con tu contraseña.');
    } catch (e: any) {
      this.err.set(this.cognito.translateError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async resendCode() {
    if (!this.email) {
      this.err.set('Ingresa tu correo o usuario para reenviar el código.');
      return;
    }
    try {
      await this.cognito.resendConfirmationCode(this.email);
      this.success.set('Nuevo código enviado a tu correo.');
    } catch (e: any) {
      this.err.set(this.cognito.translateError(e));
    }
  }

  microsoft() {
    this.err.set('');
    this.a.login(this.email.trim() || undefined);
  }

  private redirect(u: any) {
    const roles: string[] = u?.roles || [];
    if (roles.includes('AUDITOR')) {
      this.r.navigate(['/reports']);
    } else if (u.role === 'admin' || roles.includes('ADMIN') || roles.includes('RECEPCIONISTA')) {
      this.r.navigate(['/admin']);
    } else {
      this.r.navigate(['/']);
    }
  }
}
