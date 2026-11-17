import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Api, ReservationDto, PageDto, EstadoReserva } from '../core/api';
import { Store, Booking } from '../core/store';
import { translateReservationError } from '../core/errors';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
      margin-bottom: 14px; }
    .err { color: var(--r); padding: 8px 0; }
  `],
  template: `
    <h2 style="margin-bottom:14px">Reservas</h2>

    @if (s.live && s.can().manage) {
      <!-- Modo live con permisos de gestión -->
      <form class="card filters" (ngSubmit)="search(0)">
        <select class="inp" style="max-width:180px" [(ngModel)]="fEstado" name="est">
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="CHECKIN">Check-in</option>
          <option value="CHECKOUT">Check-out</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <input class="inp" type="date" style="max-width:170px" [(ngModel)]="fDesde"
          name="desde" title="Desde">
        <input class="inp" type="date" style="max-width:170px" [(ngModel)]="fHasta"
          name="hasta" title="Hasta">
        <button class="btn" type="submit">Buscar</button>
        <button class="btn ghost" type="button" (click)="clear()">Limpiar</button>
      </form>

      @if (error()) { <p class="err">{{ error() }}</p> }

      <div class="card">
        <table>
          <tr>
            <th>ID</th><th>Unidad</th><th>Entrada</th><th>Salida</th>
            <th>Huéspedes</th><th>Total</th><th>Estado</th><th>Acciones</th>
          </tr>
          @for (r of rows(); track r.id) {
            <tr>
              <td>#{{ r.id }}</td>
              <td>{{ unitName(r.unitId) }}</td>
              <td>{{ r.checkIn }}</td>
              <td>{{ r.checkOut }}</td>
              <td>{{ r.guestsCount }}</td>
              <td>{{ s.money(r.totalPrice) }}</td>
              <td>
                <span class="badge" [class]="badgeClass(r.estado)">
                  {{ statusLabel(r.estado) }}
                </span>
              </td>
              <td class="row">
                @if (r.estado === 'PENDIENTE') {
                  <button type="button" class="btn sm" (click)="doAction(r.id, 'confirmar')">
                    Confirmar
                  </button>
                }
                @if (r.estado === 'CONFIRMADA') {
                  <button type="button" class="btn sm" (click)="doAction(r.id, 'checkin')">
                    Check-in
                  </button>
                }
                @if (r.estado === 'CHECKIN') {
                  <button type="button" class="btn sm" (click)="doAction(r.id, 'checkout')">
                    Check-out
                  </button>
                }
                @if (r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') {
                  <button type="button" class="btn sm red" (click)="doCancel(r.id)">
                    Cancelar
                  </button>
                }
                @if (s.can().remove && r.estado === 'CANCELADA') {
                  <button type="button" class="btn sm ghost" (click)="doDelete(r.id)">
                    Eliminar
                  </button>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="muted">
                {{ loading() ? 'Cargando…' : 'Sin reservas.' }}
              </td>
            </tr>
          }
        </table>
        @if (pg(); as p) {
          <div class="row sp" style="margin-top:12px">
            <span class="muted">
              Página {{ p.number + 1 }} de {{ p.totalPages || 1 }}
              ({{ p.totalElements }} reservas)
            </span>
            <span class="row">
              <button type="button" class="btn sm ghost" [disabled]="p.first"
                (click)="search(p.number - 1)">← Anterior</button>
              <button type="button" class="btn sm ghost" [disabled]="p.last"
                (click)="search(p.number + 1)">Siguiente →</button>
            </span>
          </div>
        }
      </div>
    } @else {
      <!-- Modo demo: lista local del store -->
      <div class="card">
        <table>
          <tr>
            <th>Cabaña</th><th>Usuario</th><th>Fecha</th><th>Noches</th>
            <th>Total</th><th>Estado</th><th>Acciones</th>
          </tr>
          @for (b of demoList(); track b.id) {
            <tr>
              <td>{{ s.cabin(b.cabinId)?.name || ('Unidad ' + b.cabinId) }}</td>
              <td>{{ b.user }}</td>
              <td>{{ b.date }}</td>
              <td>{{ b.nights }}</td>
              <td>{{ s.money(s.total(b)) }}</td>
              <td>
                <span class="badge" [class]="badgeClass(b.status)">
                  {{ b.status }}
                </span>
              </td>
              <td class="row">
                @if (b.status === 'Pendiente') {
                  <button type="button" class="btn sm" (click)="demoAction(b.id, 'confirmar')">
                    Confirmar
                  </button>
                }
                @if (b.status === 'Confirmada') {
                  <button type="button" class="btn sm" (click)="demoAction(b.id, 'checkin')">
                    Check-in
                  </button>
                }
                @if (b.status === 'Check-in') {
                  <button type="button" class="btn sm" (click)="demoAction(b.id, 'checkout')">
                    Check-out
                  </button>
                }
                @if (b.status === 'Pendiente' || b.status === 'Confirmada') {
                  <button type="button" class="btn sm red"
                    (click)="demoCancel(b.id)">Cancelar</button>
                }
                @if (s.can().remove && b.status === 'Cancelada') {
                  <button type="button" class="btn sm ghost"
                    (click)="demoDelete(b.id)">Eliminar</button>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7" class="muted">
                {{ s.loading() ? 'Cargando…' : 'Sin reservas.' }}
              </td>
            </tr>
          }
        </table>
      </div>
    }
  `,
})
export class AdminBookings implements OnInit {
  s = inject(Store);
  api = inject(Api);

  fEstado = '';
  fDesde = '';
  fHasta = '';
  pg = signal<PageDto<ReservationDto> | null>(null);
  rows = () => this.pg()?.content ?? [];
  loading = signal(false);
  error = signal('');

  demoList = () => this.s.bookings();

  private statusLabels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    CHECKIN: 'Check-in',
    CHECKOUT: 'Check-out',
    CANCELADA: 'Cancelada',
  };

  ngOnInit() {
    if (this.s.live && this.s.can().manage) {
      this.search(0);
    }
  }

  statusLabel(estado: string): string {
    return this.statusLabels[estado] ?? estado;
  }

  badgeClass(estado: string): string {
    const label = this.statusLabels[estado] ?? estado;
    return 'badge ' + label.replace('-', '');
  }

  unitName(unitId: number): string {
    return this.s.cabin(unitId)?.name ?? `Unidad #${unitId}`;
  }

  async search(page: number) {
    this.loading.set(true);
    this.error.set('');
    try {
      this.pg.set(
        await firstValueFrom(
          this.api.searchReservations({
            page,
            estado: (this.fEstado as EstadoReserva) || undefined,
            desde: this.fDesde || undefined,
            hasta: this.fHasta || undefined,
          })
        )
      );
    } catch (e: any) {
      this.error.set(translateReservationError(e, 'general'));
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.fEstado = '';
    this.fDesde = '';
    this.fHasta = '';
    this.search(0);
  }

  async doAction(id: number, action: 'confirmar' | 'checkin' | 'checkout') {
    const labels = {
      confirmar: 'Confirmar',
      checkin: 'Hacer check-in de',
      checkout: 'Hacer check-out de',
    };
    if (!confirm(`¿${labels[action]} la reserva #${id}?`)) return;
    this.error.set('');
    try {
      await firstValueFrom(this.api.reservationAction(id, action));
      await this.search(this.pg()?.number ?? 0);
    } catch (e: any) {
      this.error.set(translateReservationError(e, 'general'));
    }
  }

  async doCancel(id: number) {
    if (!confirm(`¿Cancelar la reserva #${id}?`)) return;
    this.error.set('');
    try {
      await firstValueFrom(this.api.reservationAction(id, 'cancelar'));
      await this.search(this.pg()?.number ?? 0);
    } catch (e: any) {
      this.error.set(translateReservationError(e, 'cancel'));
    }
  }

  async doDelete(id: number) {
    if (
      !confirm(
        `¿Eliminar PERMANENTEMENTE la reserva #${id}? Esta acción no se puede deshacer.`
      )
    )
      return;
    this.error.set('');
    try {
      await firstValueFrom(this.api.deleteReservation(id));
      await this.search(this.pg()?.number ?? 0);
    } catch (e: any) {
      this.error.set(translateReservationError(e, 'general'));
    }
  }

  demoAction(id: number, action: 'confirmar' | 'checkin' | 'checkout') {
    const labels = {
      confirmar: 'Confirmar',
      checkin: 'Hacer check-in de',
      checkout: 'Hacer check-out de',
    };
    if (confirm(`¿${labels[action]} la reserva #${id}?`)) {
      this.s.act(id, action);
    }
  }

  demoCancel(id: number) {
    if (confirm(`¿Cancelar la reserva #${id}?`)) {
      this.s.act(id, 'cancelar');
    }
  }

  demoDelete(id: number) {
    if (
      confirm(
        `¿Eliminar PERMANENTEMENTE la reserva #${id}? Esta acción no se puede deshacer.`
      )
    ) {
      this.s.act(id, 'eliminar');
    }
  }
}
