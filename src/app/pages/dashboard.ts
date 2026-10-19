import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
@Component({ selector: 'app-dash', standalone: true, imports: [RouterLink], styles: [`.k{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:14px 0}.k h2{margin-top:4px}.two{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px}.q{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}.q a{background:var(--p2);padding:18px;border-radius:12px;text-align:center}@media(max-width:900px){.k{grid-template-columns:1fr 1fr}.two{grid-template-columns:1fr}}`], template: `
<h1>Dashboard</h1><p class="muted">Resumen general de la plataforma</p>
<div class="k"><div class="card"><span class="muted">Total Cabañas</span><h2>{{s.cabins().length}}</h2></div><div class="card"><span class="muted">Reservas Totales</span><h2>{{s.bookings().length}}</h2></div><div class="card"><span class="muted">Usuarios Registrados</span><h2>{{s.users().length}}</h2></div><div class="card"><span class="muted">Ingresos Totales</span><h2>{{s.money(income())}}</h2></div></div>
<div class="two"><div class="card"><h3>Reservas en el tiempo</h3>
<svg viewBox="0 0 400 140" style="width:100%;margin-top:10px"><polygon [attr.points]="area()" fill="#22c55e33"/><polyline [attr.points]="line()" fill="none" stroke="#22c55e" stroke-width="3"/></svg></div>
<div class="card"><h3 style="margin-bottom:8px">Reservas recientes</h3>@for(b of s.bookings().slice(0,4);track b.id){<div class="row sp" style="padding:6px 0"><span>{{s.cabin(b.cabinId)?.name}}<br><span class="muted" style="font-size:11px">{{b.date}}</span></span><span class="badge" [class]="'badge '+b.status">{{b.status}}</span></div>}</div></div>
<div class="card"><h3>Gestión rápida</h3><div class="q"><a routerLink="/admin/cabanas">🏠<br>Agregar Cabaña</a><a routerLink="/admin/reservas">📅<br>Ver Reservas</a><a routerLink="/admin/usuarios">👥<br>Gestionar Usuarios</a></div></div>`})
export class Dashboard {
  s = inject(Store); data = [12, 18, 15, 28, 24, 40, 36, 55, 62, 78];
  income = computed(() => this.s.bookings().filter(b => ['Confirmada', 'Check-in', 'Check-out'].includes(b.status)).reduce((t, b) => t + this.s.total(b), 0));
  pts = () => this.data.map((v, i) => `${i * (400 / 9)},${135 - v * 1.5}`);
  line = () => this.pts().join(' '); area = () => `0,140 ${this.pts().join(' ')} 400,140`;
}
