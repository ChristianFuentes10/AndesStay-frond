import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking, Store } from '../core/store';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .empty { text-align: center; padding: 40px; }
    .booking-card { display: flex; flex-direction: column; gap: 8px; }
    .booking-card .row { flex-wrap: wrap; }
    .booking-meta { font-size: 12px; color: var(--m); display: flex;
      flex-wrap: wrap; gap: 10px; margin-top: 4px; }
  `],
  template: `
    <h2 style="margin-bottom:14px">Mis Reservas</h2>

    @if (list().length === 0) {
      <div class="card empty">
        <p class="muted" style="margin-bottom: 14px">
          {{ s.loading() ? 'Cargando…' : 'Aún no tienes reservas.' }}
        </p>
        @if (!s.loading()) {
          <a class="btn" routerLink="/">Explorar catálogo</a>
        }
      </div>
    } @else {
      <div class="grid">
        @for (b of list(); track b.id) {
          <div class="card booking-card">
            <div class="row sp">
              <b>#{{ b.id }}</b>
              <span class="badge" [class]="badgeClass(b.status)">
                {{ b.status }}
              </span>
            </div>
            <div>{{ cabinName(b.cabinId) }}</div>
            <div class="booking-meta">
              <span>📅 {{ b.date }} → {{ b.checkOut || '—' }}</span>
              <span>👥 {{ b.guests ?? b.nights }} huéspedes</span>
              <span>💰 {{ s.money(s.total(b)) }}</span>
            </div>
            @if (cancelable(b)) {
              <button class="btn sm red" (click)="cancel(b)">
                Cancelar
              </button>
            }
          </div>
        }
      </div>
    }
  `,
})
export class Bookings {
  s = inject(Store);

  list = computed(() => {
    const all = this.s.bookings();
    const filtered = this.s.live
      ? all
      : all.filter((b) => b.user === this.s.user()!.name);
    // Ordenar de más reciente a más antigua (id desc)
    return [...filtered].sort((a, b) => b.id - a.id);
  });

  cabinName(cabinId: number): string {
    return this.s.cabin(cabinId)?.name ?? `Unidad #${cabinId}`;
  }

  badgeClass(status: string): string {
    return 'badge ' + status.replace('-', '');
  }

  cancelable(b: Booking): boolean {
    return b.status === 'Pendiente' || b.status === 'Confirmada';
  }

  cancel(b: Booking) {
    if (confirm(`¿Cancelar la reserva #${b.id}?`)) {
      this.s.act(b.id, 'cancelar');
    }
  }
}
