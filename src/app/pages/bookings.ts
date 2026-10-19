import { Component, computed, inject } from '@angular/core';
import { Booking, Store } from '../core/store';
@Component({ selector: 'app-bookings', standalone: true, template: `
<h2 style="margin-bottom:14px">{{admin?'Reservas':'Mis Reservas'}}</h2><div class="card"><table><tr><th>Cabaña</th>@if(admin){<th>Usuario</th>}<th>Fecha</th><th>Noches</th><th>Total</th><th>Estado</th><th></th></tr>
@for(b of list();track b.id){<tr><td>{{s.cabin(b.cabinId)?.name||('Unidad '+b.cabinId)}}</td>@if(admin){<td>{{b.user}}</td>}<td>{{b.date}}</td><td>{{b.nights}}</td><td>{{s.money(s.total(b))}}</td><td><span class="badge" [class]="'badge '+b.status">{{b.status}}</span></td>
<td class="row">@if(s.can().manage){@if(b.status==='Pendiente'){<button class="btn sm" (click)="s.act(b.id,'confirmar')">Confirmar</button>}@if(s.live&&b.status==='Confirmada'){<button class="btn sm" (click)="s.act(b.id,'checkin')">Check-in</button>}@if(s.live&&b.status==='Check-in'){<button class="btn sm" (click)="s.act(b.id,'checkout')">Check-out</button>}}
@if(cancelable(b)){<button class="btn sm red" (click)="s.act(b.id,'cancelar')">Cancelar</button>}
@if(s.live&&s.can().remove&&(b.status==='Cancelada'||b.status==='Check-out')){<button class="btn sm ghost" (click)="s.act(b.id,'eliminar')">Eliminar</button>}</td></tr>}
@empty{<tr><td colspan="7" class="muted">{{s.loading()?'Cargando…':'Sin reservas.'}}</td></tr>}</table></div>`})
export class Bookings { s = inject(Store); admin = this.s.user()!.role === 'admin';
  list = computed(() => this.s.bookings().filter(b => this.s.live || this.admin || b.user === this.s.user()!.name));
  cancelable(b: Booking) { return this.s.live ? this.s.can().manage && (b.status === 'Pendiente' || b.status === 'Confirmada') : b.status !== 'Cancelada'; } }
