import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .profile-wrap {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .header-card {
      background: linear-gradient(135deg, rgba(20, 83, 45, 0.45) 0%, rgba(17, 27, 23, 0.95) 100%);
      border: 1px solid var(--b);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      position: relative;
      overflow: hidden;
    }
    .header-card::after {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%);
      pointer-events: none;
    }
    .big-av {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #15803d);
      color: #04130a;
      display: grid;
      place-items: center;
      font-size: 28px;
      font-weight: 800;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
      border: 3px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media(max-width: 700px) {
      .header-card { flex-direction: column; text-align: center; }
      .grid-2 { grid-template-columns: 1fr; }
    }
    .info-card {
      background: var(--p);
      border: 1px solid var(--b);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field-group label {
      font-size: 12px;
      color: var(--m);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13px;
    }
    .detail-row:last-child {
      border-bottom: 0;
    }
    .badge-lg {
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      background: #14532d;
      color: #4ade80;
      letter-spacing: 0.5px;
    }
  `],
  template: `
    <div class="profile-wrap">
      <!-- Encabezado de Perfil Profesional -->
      <div class="header-card">
        <div class="big-av">
          {{ s.user()!.name[0] || 'A' }}
        </div>
        <div style="flex: 1; min-width: 0">
          <div class="row" style="gap: 10px; margin-bottom: 4px; flex-wrap: wrap">
            <h1 style="font-size: 22px; font-weight: 700">{{ s.user()!.name }}</h1>
            <span class="badge-lg">
              🛡️ {{ s.user()!.roles?.[0] || s.user()!.role | uppercase }}
            </span>
          </div>
          <p class="muted" style="font-size: 13px">
            {{ s.user()!.email }} · AndesStay Cloud Management
          </p>
        </div>
      </div>

      <div class="grid-2">
        <!-- Tarjeta de Información Personal -->
        <div class="info-card">
          <div class="row sp">
            <h3 style="font-size: 16px">👤 Información del Usuario</h3>
            <span class="muted" style="font-size: 12px">Datos de Cuenta</span>
          </div>

          <form (ngSubmit)="save()" style="display: flex; flex-direction: column; gap: 14px">
            <div class="field-group">
              <label>Nombre</label>
              <input class="inp" name="firstName" [(ngModel)]="firstName" placeholder="Nombre">
            </div>

            <div class="field-group">
              <label>Apellido</label>
              <input class="inp" name="lastName" [(ngModel)]="lastName" placeholder="Apellido">
            </div>

            <div class="field-group">
              <label>Correo Electrónico (Mail)</label>
              <input class="inp" name="email" [(ngModel)]="email" [readonly]="!!a.claims" style="opacity: 0.85">
            </div>

            <div class="field-group">
              <label>Número de Teléfono</label>
              <input class="inp" name="phone" [(ngModel)]="phone" placeholder="+56 9 1234 5678">
            </div>

            <div class="field-group">
              <label>Rol Principal</label>
              <div class="row" style="gap: 8px; flex-wrap: wrap">
                <span class="badge-lg">
                  {{ s.user()!.roles?.[0] || s.user()!.role }}
                </span>
                @if (s.user()!.role === 'admin') {
                  <span class="badge" style="background:#1e3a8a; color:#93c5fd">ADMINISTRADOR</span>
                }
              </div>
            </div>

            <button class="btn" style="margin-top: 6px" type="submit">
              💾 Guardar Cambios
            </button>

            @if (ok()) {
              <div class="green" style="font-size: 13px; text-align: center">
                ✔ Perfil actualizado correctamente
              </div>
            }
          </form>
        </div>

        <!-- Tarjeta de Roles y Sesión Microsoft Azure -->
        <div class="info-card">
          <div class="row sp">
            <h3 style="font-size: 16px">🔐 Roles y Credenciales</h3>
            <span class="badge" style="background: rgba(34,197,94,0.15); color: #4ade80">Activo</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px">
            <div class="detail-row">
              <span class="muted">Roles Asignados</span>
              <div class="row" style="gap: 6px">
                @for (r of s.user()!.roles || []; track r) {
                  <span class="badge">{{ r }}</span>
                } @empty {
                  <span class="muted">Sin roles asignados</span>
                }
              </div>
            </div>

            <div class="detail-row">
              <span class="muted">Tipo de Autenticación</span>
              <span>{{ a.claims ? 'Microsoft Entra ID (OAuth 2.0)' : 'Credenciales Locales' }}</span>
            </div>

            @if (a.claims) {
              @for (k of rows(); track k[0]) {
                <div class="detail-row">
                  <span class="muted">{{ k[0] }}</span>
                  <span style="font-family: monospace; font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; text-align: right">
                    {{ k[1] }}
                  </span>
                </div>
              }
            }
          </div>

          <!-- Sección Token JWT para jwt.io -->
          <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid var(--g); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px">
            <div class="row sp">
              <b style="font-size: 13px; color: var(--g)">🔑 Access Token (JWT)</b>
              <a href="https://jwt.io" target="_blank" class="btn sm ghost" style="text-decoration: none">
                🔗 Abrir jwt.io ↗
              </a>
            </div>
            <p class="muted" style="font-size: 11px">
              Copia el token con un clic para pegarlo en jwt.io y verificar <code>aud</code>, <code>roles</code>, <code>scp</code> y <code>ver</code>.
            </p>
            <button class="btn sm" type="button" (click)="copyToken()">
              {{ copied() ? '✔ ¡Token copiado al portapapeles!' : '📋 Copiar Token Completo' }}
            </button>
            @if (copied()) {
              <small class="green" style="font-size: 11px; text-align: center">
                ¡Listo! Ahora ve a jwt.io y pega con Ctrl + V.
              </small>
            }
          </div>

          <div style="background: var(--p2); border: 1px solid var(--b); border-radius: 10px; padding: 12px; margin-top: auto">
            <div class="row" style="gap: 8px; margin-bottom: 4px">
              <span>🛡️</span>
              <b style="font-size: 12px">Permisos de Acceso</b>
            </div>
            <p class="muted" style="font-size: 11px; line-height: 1.4">
              Tu rol actual te permite acceder al Panel de Administración, visualización de métricas, gestión de cabañas y consultas de auditoría.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Profile {
  s = inject(Store);
  a = inject(Auth);

  firstName = this.s.user()!.firstName || this.s.user()!.name;
  lastName = this.s.user()!.lastName || '';
  email = this.s.user()!.email;
  phone = this.s.user()!.phone || '+56 9 8452 1980';
  ok = signal(false);
  copied = signal(false);

  copyToken() {
    try {
      const entry = Object.entries(localStorage).find(([k]) => k.includes('accesstoken'));
      if (entry) {
        const parsed = JSON.parse(entry[1]);
        const secret = parsed.secret || parsed.accessToken || entry[1];
        navigator.clipboard.writeText(secret);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 4000);
      } else {
        alert('No se encontró el accesstoken en localStorage. Inicia sesión con Microsoft primero.');
      }
    } catch {
      alert('Error al leer el token de localStorage.');
    }
  }

  rows = () => {
    const c = this.a.claims || {};
    return [
      ['Alcance (Scope)', c['scp']],
      ['Audiencia (aud)', c['aud']],
      ['Versión de Token', c['ver']],
      ['Tenant ID', c['tid']],
      ['Expiración', c['exp'] ? new Date(c['exp'] * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '']
    ].filter(x => x[1]);
  };

  save() {
    const fullName = `${this.firstName.trim()} ${this.lastName.trim()}`.trim();
    const updated = {
      ...this.s.user()!,
      name: fullName,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim()
    };

    this.s.user.set(updated);
    localStorage.setItem('as_phone', this.phone.trim());
    if (!this.a.claims) {
      localStorage.setItem('cg_user', JSON.stringify(updated));
    }

    this.ok.set(true);
    setTimeout(() => this.ok.set(false), 4000);
  }
}
