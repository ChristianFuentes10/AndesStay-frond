import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '../core/store';
import { Chat } from './chat';
@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [Chat],
  styles: [`
    .g {
      display: grid;
      grid-template-columns: 1fr 90px 320px;
      gap: 16px;
    }
    .main {
      width: 100%;
      height: 320px;
      object-fit: cover;
      border-radius: 14px;
    }
    .th {
      display: grid;
      gap: 8px;
      align-content: start;
    }
    .th img {
      width: 100%;
      height: 72px;
      object-fit: cover;
      border-radius: 10px;
      cursor: pointer;
      opacity: .6;
    }
    .th img.on {
      opacity: 1;
      outline: 2px solid var(--g);
    }
    .feat {
      display: flex;
      gap: 18px;
      margin: 12px 0;
      color: var(--m);
    }
    @media(max-width: 1100px) {
      .g { grid-template-columns: 1fr; }
    }
  `],
  template: `
    @if (c(); as c) {
      <div class="g">
        <div>
          <img class="main" [src]="c.imgs[i()]" [alt]="c.name">
          <div class="row sp" style="margin-top:14px">
            <div>
              <h2>{{ c.name }}</h2>
              <p class="muted">
                📍 {{ c.place }}
                @if (c.reviews) {
                  · <span style="color:var(--y)">★ {{ c.rating }}</span>
                  ({{ c.reviews }} reseñas)
                }
              </p>
            </div>
            <div style="text-align:right">
              <h2>
                {{ s.money(c.price) }}
                <span class="muted" style="font-size:12px"> / noche</span>
              </h2>
            </div>
          </div>
          <div class="feat">
            <span>👥 {{ c.guests }} huéspedes</span>
            @if (c.rooms) { <span>🛏 {{ c.rooms }} habitaciones</span> }
            @if (c.baths) { <span>🚿 {{ c.baths }} baños</span> }
            <span>📶 WiFi</span>
            <span>🔥 Chimenea</span>
          </div>
          <div class="card">
            <h3>Descripción</h3>
            <p class="muted" style="margin:6px 0 12px">{{ c.desc }}</p>
            <div class="row">
              <button
                class="btn"
                [disabled]="!s.can().book || !c.active"
                (click)="goCheckout(c.id)">
                Reservar
              </button>
            </div>
            @if (!s.can().book) {
              <p class="muted" style="margin-top:8px">
                Tu rol no permite crear reservas.
              </p>
            }
            @if (!c.active) {
              <p class="muted" style="margin-top:8px">
                Esta unidad no está disponible actualmente.
              </p>
            }
          </div>
        </div>
        <div class="th">
          @for (im of c.imgs; track $index) {
            <img
              [src]="im"
              [class.on]="$index === i()"
              (click)="i.set($index)"
              alt="">
          }
        </div>
        <div class="card">
          <app-chat [id]="c.id"/>
        </div>
      </div>
    } @else {
      <p>{{ s.loading() ? 'Cargando…' : 'Cabaña no encontrada.' }}</p>
    }
  `,
})
export class Detail {
  s = inject(Store);
  r = inject(Router);
  route = inject(ActivatedRoute);
  i = signal(0);
  c = computed(() => this.s.cabin(+this.route.snapshot.paramMap.get('id')!));

  goCheckout(id: number) {
    this.r.navigate(['/cabana', id, 'reservar']);
  }
}
