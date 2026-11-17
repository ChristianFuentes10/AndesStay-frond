import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Store, Cabin, Booking } from '../core/store';
import { Api } from '../core/api';
import { Auth } from '../core/auth';

const TYPES: Record<string, string> = {
  CABANA: 'Cabaña',
  HABITACION: 'Habitación',
  LODGE: 'Lodge',
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    .ck { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
    .summary h3 { margin-bottom: 12px; }
    .summary .line { display: flex; justify-content: space-between; padding: 6px 0;
      border-bottom: 1px solid var(--b); font-size: 13px; }
    .summary .line.total { font-size: 16px; font-weight: 700; border-bottom: none;
      margin-top: 8px; color: var(--g); }
    .form-grid { display: grid; gap: 12px; }
    .success { text-align: center; padding: 40px 20px; }
    .success h2 { color: var(--g); margin-bottom: 8px; }
    .success .detail { text-align: left; margin: 20px auto; max-width: 400px; }
    .success .detail .line { display: flex; justify-content: space-between; padding: 6px 0;
      border-bottom: 1px solid var(--b); font-size: 13px; }
    @media(max-width: 900px) { .ck { grid-template-columns: 1fr; } }
  `],
  template: `
    @if (loading()) {
      <p class="muted">Cargando…</p>
    } @else {
      @if (success(); as res) {
        <div class="card success">
          <h2>🎉 ¡Reserva creada!</h2>
          <p style="font-size: 18px; margin-bottom: 4px">
            Reserva <b>#{{ res.id }}</b>
          </p>
          <p class="muted">
            <span class="badge Pendiente">Pendiente</span>
            — Será confirmada por recepción
          </p>
          <div class="detail card" style="margin-top: 16px">
            <div class="line"><span>Unidad</span><span>{{ cabinName() }}</span></div>
            <div class="line"><span>Entrada</span><span>{{ res.checkIn || res.date }}</span></div>
            <div class="line"><span>Salida</span><span>{{ res.checkOut }}</span></div>
            <div class="line"><span>Huéspedes</span><span>{{ res.guests ?? res.guestsCount }}</span></div>
            <div class="line total">
              <span>Total</span>
              <span>{{ s.money(res.total ?? res.totalPrice ?? 0) }}</span>
            </div>
          </div>
          <div class="row" style="justify-content: center; margin-top: 20px; gap: 12px">
            <a class="btn" routerLink="/reservas">Ver mis reservas</a>
            <a class="btn ghost" routerLink="/">Volver al catálogo</a>
          </div>
        </div>
      } @else if (unavailable() || !cabin()) {
        <div class="card" style="text-align: center; padding: 40px">
          <p style="margin-bottom: 16px">Esta unidad no está disponible actualmente.</p>
          <a class="btn" routerLink="/">Volver al catálogo</a>
        </div>
      } @else {
        @if (cabin(); as c) {
          <div class="ck">
            <div class="card form-grid">
              <h2>Reservar {{ c.name }}</h2>
              <div>
                <label class="muted" style="font-size: 12px">Fecha de entrada</label>
                <input class="inp" type="date" [min]="todayStr"
                  [(ngModel)]="checkIn" (ngModelChange)="onCheckInChange()">
              </div>
              <div>
                <label class="muted" style="font-size: 12px">Fecha de salida</label>
                <input class="inp" type="date" [min]="checkIn || todayStr"
                  [(ngModel)]="checkOut">
              </div>
              <div>
                <label class="muted" style="font-size: 12px">
                  Huéspedes (Máximo {{ c.guests }} personas)
                </label>
                <input class="inp" type="number" min="1" [max]="c.guests"
                  [(ngModel)]="guestsCount">
              </div>

              @if (err()) {
                <div style="color: var(--r); padding: 8px 0">
                  {{ err() }}
                  @if (is401()) {
                    <button type="button" class="btn sm" style="margin-left: 8px"
                      (click)="doLogin()">Iniciar sesión</button>
                  }
                </div>
              }

              <div class="row" style="gap: 12px; margin-top: 8px">
                <button type="button" class="btn" [disabled]="!formValid() || sending()"
                  (click)="submit()">
                  {{ sending() ? 'Reservando…' : 'Confirmar reserva' }}
                </button>
                <a class="btn ghost" [routerLink]="['/cabana', c.id]">Cancelar</a>
              </div>
            </div>

            <div class="card summary">
              <h3>Resumen</h3>
              <div class="line"><span>Unidad</span><span>{{ c.name }}</span></div>
              @if (c.type) {
                <div class="line"><span>Tipo</span><span>{{ c.type }}</span></div>
              }
              <div class="line">
                <span>Precio por noche</span>
                <span>{{ s.money(c.price) }}</span>
              </div>
              <div class="line">
                <span>Noches</span>
                <span>{{ nights() > 0 ? nights() : '—' }}</span>
              </div>
              <div class="line"><span>Huéspedes</span><span>{{ guestsCount }}</span></div>
              <div class="line total">
                <span>Total estimado</span>
                <span>{{ nights() > 0 ? s.money(c.price * nights()) : '—' }}</span>
              </div>
            </div>
          </div>
        }
      }
    }
  `,
})
export class Checkout implements OnInit {
  s = inject(Store);
  api = inject(Api);
  auth = inject(Auth);
  r = inject(Router);
  route = inject(ActivatedRoute);

  cabin = signal<Cabin | null>(null);
  unavailable = signal(false);
  success = signal<Booking | null>(null);
  err = signal('');
  is401 = signal(false);
  sending = signal(false);
  loading = signal(true);

  todayStr = '';
  checkIn = '';
  checkOut = '';
  guestsCount = 1;

  async ngOnInit() {
    const now = new Date();
    this.todayStr = this.fmtLocal(now);
    this.checkIn = this.todayStr;

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.checkOut = this.fmtLocal(tomorrow);

    const id = +this.route.snapshot.paramMap.get('id')!;
    if (isNaN(id) || id <= 0) {
      this.unavailable.set(true);
      this.loading.set(false);
      return;
    }

    const local = this.s.cabin(id);
    if (local) {
      if (!local.active) {
        this.unavailable.set(true);
      } else {
        this.cabin.set(local);
        this.guestsCount = Math.min(2, local.guests);
      }
      this.loading.set(false);
    } else if (this.s.live) {
      // Entrada directa por URL en modo live: cargar desde API
      await this.loadCabin(id);
      this.loading.set(false);
    } else {
      // Demo, cabaña no existe
      this.unavailable.set(true);
      this.loading.set(false);
    }
  }

  private async loadCabin(id: number) {
    try {
      const dto = await firstValueFrom(this.api.unitById(id));
      if (!dto.available) {
        this.unavailable.set(true);
        return;
      }
      const label = TYPES[dto.type] ?? dto.type;
      const c: Cabin = {
        id: dto.id,
        name: dto.name,
        type: label,
        price: Number(dto.pricePerNight),
        guests: dto.capacity,
        active: dto.available,
        place: `${label} · AndesStay`,
        rating: 0,
        reviews: 0,
        rooms: 0,
        baths: 0,
        desc: `${label} para ${dto.capacity} huéspedes en AndesStay.`,
        imgs: [],
      };
      this.cabin.set(c);
      this.guestsCount = Math.min(2, c.guests);
    } catch {
      this.unavailable.set(true);
    }
  }

  cabinName(): string {
    const fromCabin = this.cabin()?.name;
    if (fromCabin) return fromCabin;
    const fromSucc = this.success();
    if (fromSucc) {
      return this.s.cabin(fromSucc.cabinId)?.name ?? `Unidad #${fromSucc.cabinId}`;
    }
    return '';
  }

  onCheckInChange() {
    if (!this.checkIn || this.checkIn.length !== 10) return;
    if (!this.checkOut || this.checkOut <= this.checkIn) {
      const [y, m, d] = this.checkIn.split('-').map(Number);
      const next = new Date(y, m - 1, d + 1);
      this.checkOut = this.fmtLocal(next);
    }
  }

  nights(): number {
    if (!this.checkIn || !this.checkOut || this.checkIn.length !== 10 || this.checkOut.length !== 10) return 0;
    const [y1, m1, d1] = this.checkIn.split('-').map(Number);
    const [y2, m2, d2] = this.checkOut.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);
    const diff = Math.round((end.getTime() - start.getTime()) / 864e5);
    return diff > 0 ? diff : 0;
  }

  formValid(): boolean {
    const c = this.cabin();
    if (!c) return false;
    if (!this.checkIn || !this.checkOut || this.checkIn.length !== 10 || this.checkOut.length !== 10) return false;
    if (this.checkIn < this.todayStr) return false;
    if (this.checkOut <= this.checkIn) return false;
    const guests = Number(this.guestsCount);
    if (isNaN(guests) || guests < 1 || guests > c.guests) return false;
    return true;
  }

  async submit() {
    const c = this.cabin();
    if (!c || !this.formValid()) return;

    this.sending.set(true);
    this.err.set('');
    this.is401.set(false);

    const result = await this.s.book(c.id, this.checkIn, this.checkOut, Number(this.guestsCount));

    this.sending.set(false);

    if (typeof result !== 'string') {
      this.success.set(result);
    } else {
      this.err.set(result || 'No se pudo crear la reserva.');
      this.is401.set(result.includes('expirado'));
    }
  }

  doLogin() {
    this.s.logout();
    this.r.navigate(['/login']);
  }

  /** Formatea una Date a yyyy-MM-dd usando partes locales (NO toISOString). */
  private fmtLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
}
