import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Api, AuditEventDto, PageDto } from '../core/api';
import { Store } from '../core/store';
@Component({ selector: 'app-audit', standalone: true, imports: [FormsModule], template: `
<h2 style="margin-bottom:14px">Auditoría</h2>
<form class="card row" style="margin-bottom:14px;flex-wrap:wrap" (ngSubmit)="search(0)">
<select class="inp" name="t" style="max-width:220px" [(ngModel)]="tipo"><option value="">Todos los eventos</option><option value="RESERVA_CREADA">Reserva creada</option><option value="RESERVA_CONFIRMADA">Reserva confirmada</option><option value="CHECKIN">Check-in</option><option value="CHECKOUT">Check-out</option><option value="RESERVA_CANCELADA">Reserva cancelada</option></select>
<input class="inp" name="d" type="date" style="max-width:170px" [(ngModel)]="desde" title="Desde"><input class="inp" name="h" type="date" style="max-width:170px" [(ngModel)]="hasta" title="Hasta">
<button class="btn">Buscar</button></form>
<div class="card"><table><tr><th>Fecha</th><th>Evento</th><th>Reserva</th><th>Actor</th><th>Trace</th></tr>
@for(e of rows();track e.id){<tr><td>{{fmt(e.occurredAt)}}</td><td><span class="badge">{{e.eventType}}</span></td><td>{{e.aggregateId}}</td><td>{{e.actor}}</td><td class="muted">{{e.traceId}}</td></tr>}
@empty{<tr><td colspan="5" class="muted">{{loading()?'Cargando…':'Sin eventos.'}}</td></tr>}</table>
@if(pg(); as p){<div class="row sp" style="margin-top:12px"><span class="muted">{{p.totalElements}} eventos · página {{p.number+1}} de {{p.totalPages||1}}</span>
<span class="row"><button class="btn sm ghost" [disabled]="p.first" (click)="search(p.number-1)">← Anterior</button><button class="btn sm ghost" [disabled]="p.last" (click)="search(p.number+1)">Siguiente →</button></span></div>}</div>`})
export class AuditLog {
  api = inject(Api); s = inject(Store); tipo = ''; desde = ''; hasta = '';
  pg = signal<PageDto<AuditEventDto> | null>(null); rows = () => this.pg()?.content ?? []; loading = signal(false);
  constructor() { this.search(0); }
  fmt(d: string) { return new Date(d).toLocaleString('es-CL'); }
  async search(page: number) {
    this.loading.set(true);
    try {
      this.pg.set(await firstValueFrom(this.api.audit({ page, tipoEvento: this.tipo || undefined,
        desde: this.desde ? this.desde + 'T00:00:00Z' : undefined, hasta: this.hasta ? this.hasta + 'T23:59:59Z' : undefined })));
    } catch (e: any) { this.s.notice.set(e?.status === 403 ? 'Tu rol no tiene permiso para ver la auditoría (403).' : e?.error?.message || 'No se pudo cargar la auditoría.'); }
    finally { this.loading.set(false); }
  }
}
