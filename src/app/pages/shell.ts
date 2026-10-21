import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '../core/store';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    .app {
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: 100vh;
    }
    .side {
      background: var(--p);
      border-right: 1px solid var(--b);
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .side a, .side button.nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      color: var(--m);
      background: none;
      border: 0;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      transition: .15s;
    }
    .side a:hover, .side button.nav-btn:hover {
      background: var(--p2);
      color: var(--t);
    }
    .side a.on {
      background: #14532d;
      color: #4ade80;
      font-weight: 600;
    }
    .top {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 14px 24px;
      border-bottom: 1px solid var(--b);
      position: sticky;
      top: 0;
      background: var(--bg);
      z-index: 5;
    }
    .av {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #14532d);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    .profile-card {
      margin-top: auto;
      background: var(--p2);
      border: 1px solid var(--b);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-decoration: none;
      color: inherit;
      transition: .2s;
      cursor: pointer;
    }
    .profile-card:hover {
      border-color: var(--g);
      transform: translateY(-2px);
    }
    .profile-card.active-profile {
      border-color: var(--g);
      background: rgba(20, 83, 45, 0.25);
    }
    .p-name {
      font-weight: 600;
      font-size: 13px;
      color: var(--t);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .p-meta {
      font-size: 11px;
      color: var(--m);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .p-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      background: #14532d;
      color: #4ade80;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    main {
      padding: 24px;
    }
    @media(max-width: 900px) {
      .app { grid-template-columns: 1fr; }
      .side { display: none; }
    }
  `],
  template: `
    <div class="app">
      <!-- Barra lateral izquierda -->
      <nav class="side">
        <div class="logo" style="margin:4px 8px 18px">🏔️ Andes<b>Stay</b></div>

        <!-- Enlaces de navegación -->
        @for (l of links(); track l[1]) {
          <a [routerLink]="l[1]" routerLinkActive="on" [routerLinkActiveOptions]="{exact: true}">
            <span style="font-size: 15px">{{ l[2] }}</span> {{ l[0] }}
          </a>
        }

        <!-- Tarjeta de Perfil Profesional en el costado izquierdo -->
        <a [routerLink]="'/perfil'" routerLinkActive="active-profile" class="profile-card" title="Ver mi perfil completo">
          <div class="row" style="gap: 10px">
            <div class="av">
              {{ s.user()!.name[0] || 'U' }}
            </div>
            <div style="flex: 1; min-width: 0">
              <div class="p-name">
                {{ s.user()!.firstName || s.user()!.name }}
                @if (s.user()!.lastName) {
                  <span>{{ s.user()!.lastName }}</span>
                }
              </div>
              <div class="p-meta">✉ {{ s.user()!.email }}</div>
            </div>
          </div>

          <!-- Rol y Teléfono -->
          <div class="row sp" style="font-size: 11px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06)">
            <span class="p-meta">📞 {{ s.user()!.phone || '+56 9 8452 1980' }}</span>
            <span class="p-badge">
              {{ s.user()!.roles?.[0] || s.user()!.role }}
            </span>
          </div>
        </a>

        <!-- Botón Cerrar Sesión -->
        <button class="nav-btn" style="margin-top: 6px; padding: 8px 12px; font-size: 12px" (click)="out()">
          ⎋ Cerrar sesión
        </button>

        <p class="muted" style="font-size:11px; padding: 4px 8px">
          {{ s.user()!.role === 'admin' ? '🛡️ Modo Administrador' : 'Descubre, reserva, vive la experiencia' }}
        </p>
      </nav>

      <!-- Contenido Principal -->
      <div>
        <header class="top">
          <input
            class="inp"
            style="max-width:420px"
            placeholder="Buscar cabañas, destinos..."
            [value]="s.query()"
            (input)="search($event)">
          <span class="grow"></span>
          <span>🔔</span>
          <a [routerLink]="'/perfil'" class="row" style="cursor: pointer" title="Ir a Mi Perfil">
            <div class="av">{{ s.user()!.name[0] }}</div>
            <span style="font-weight: 500; font-size: 13px">{{ s.user()!.name }}</span>
            <span class="badge" style="margin-left: 4px">
              {{ s.user()!.roles?.[0] || s.user()!.role }}
            </span>
          </a>
        </header>

        <main>
          @if (s.notice()) {
            <div class="card row sp" style="margin-bottom:14px;border-color:var(--r);color:var(--r)">
              <span>{{ s.notice() }}</span>
              <button class="btn sm ghost" (click)="s.notice.set('')">✕</button>
            </div>
          }
          <router-outlet/>
        </main>
      </div>
    </div>
  `
})
export class Shell {
  s = inject(Store);
  r = inject(Router);
  a = inject(Auth);

  links = () => this.s.user()!.role === 'admin'
    ? [
        ['Dashboard', '/admin', '▦'],
        ['Gestionar Cabañas', '/admin/cabanas', '🏠'],
        ['Reservas', '/admin/reservas', '📅'],
        ['Usuarios', '/admin/usuarios', '👥'],
        ...(this.s.can().audit ? [['Auditoría', '/admin/auditoria', '🧾']] : []),
        ['Mensajes', '/admin/mensajes', '✉'],
        ['Mi Perfil', '/perfil', '👤']
      ]
    : [
        ['Inicio', '/', '⌂'],
        ['Mis Reservas', '/reservas', '📅'],
        ['Favoritos', '/favoritos', '♡'],
        ['Mensajes', '/mensajes', '✉'],
        ['Mi Perfil', '/perfil', '👤']
      ];

  search(e: Event) {
    this.s.query.set((e.target as HTMLInputElement).value);
    if (this.s.user()!.role === 'user') this.r.navigate(['/']);
  }

  out() {
    this.s.logout();
    this.r.navigate(['/login']);
  }
}
