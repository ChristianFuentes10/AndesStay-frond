import { Component, inject, OnInit, signal } from '@angular/core';
import { Store, User } from '../core/store';
import { Api } from '../core/api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div>
        <h2 style="margin: 0 0 4px">Gestión de Usuarios</h2>
        <p class="muted" style="margin: 0; font-size: 13px">
          Usuarios registrados en AndesStay sincronizados con AWS Cognito y el microservicio de usuarios (BFF :8080)
        </p>
      </div>
      <button class="btn sm ghost" (click)="load()" [disabled]="loading()">
        {{ loading() ? 'Cargando…' : '↻ Actualizar lista' }}
      </button>
    </div>

    @if (error()) {
      <div class="card" style="margin-bottom: 14px; border-color: var(--r); color: var(--r)">
        {{ error() }}
      </div>
    }

    <div class="card" style="overflow-x: auto; padding: 0;">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo electrónico</th>
            <th>Teléfono</th>
            <th>Roles asignados</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (u of s.users(); track u.email) {
            <tr>
              <td>
                <div style="font-weight: 600">{{ u.name }}</div>
                @if (u.firstName && u.lastName) {
                  <div class="muted" style="font-size: 11px">{{ u.firstName }} {{ u.lastName }}</div>
                }
              </td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone || '—' }}</td>
              <td>
                @if (u.roles && u.roles.length > 0) {
                  <div class="row" style="gap: 4px; flex-wrap: wrap;">
                    @for (r of u.roles; track r) {
                      <span class="badge" [style.background]="badgeColor(r)">
                        {{ r }}
                      </span>
                    }
                  </div>
                } @else {
                  <span class="badge">{{ u.role }}</span>
                }
              </td>
              <td>
                @if (canDelete(u)) {
                  <button class="btn sm red" (click)="deleteUser(u)">
                    Eliminar
                  </button>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" style="text-align: center; padding: 24px" class="muted">
                No hay usuarios registrados o no se pudieron cargar.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      text-align: left;
      padding: 12px 16px;
      color: var(--m);
      font-weight: 600;
      border-bottom: 1px solid var(--b);
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--b);
    }
    tr:last-child td {
      border-bottom: none;
    }
  `],
})
export class AdminUsers implements OnInit {
  s = inject(Store);
  api = inject(Api);

  loading = signal(false);
  error = signal('');

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.s.loadUsers();
    } catch (e: any) {
      this.error.set('No se pudieron cargar los usuarios desde el BFF.');
    } finally {
      this.loading.set(false);
    }
  }

  canDelete(u: User): boolean {
    const myEmail = this.s.user()?.email;
    if (u.email === myEmail) return false;
    const isUserAdmin = u.roles?.includes('ADMIN') || u.role === 'admin';
    return !isUserAdmin;
  }

  async deleteUser(u: User) {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${u.name} (${u.email})?`)) return;

    if (!this.s.live) {
      this.s.users.update((l) => l.filter((x) => x.email !== u.email));
      return;
    }

    try {
      // Si u tiene id o podemos usar email/id
      const id = (u as any).id || u.email;
      await firstValueFrom(this.api.deleteUser(id));
      await this.load();
    } catch (e: any) {
      this.error.set('No se pudo eliminar el usuario. ' + (e?.error?.message || e?.message || ''));
    }
  }

  badgeColor(role: string): string {
    switch (role) {
      case 'ADMIN':
        return '#dc2626';
      case 'RECEPCIONISTA':
        return '#2563eb';
      case 'AUDITOR':
        return '#7c3aed';
      case 'HUESPED':
      default:
        return '#14532d';
    }
  }
}
