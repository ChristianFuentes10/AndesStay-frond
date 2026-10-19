import { Component, computed, inject } from '@angular/core';
import { Store } from '../core/store';
import { CabinCard } from './card';
@Component({ selector: 'app-home', standalone: true, imports: [CabinCard], styles: [`.ban{border-radius:16px;padding:60px 36px;margin-bottom:24px;background:linear-gradient(90deg,#0b1210f0 30%,#0b121033),url('https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=70') center/cover}.ban h1{font-size:34px;margin-bottom:8px}`], template: `
<div class="ban"><h1>Encuentra tu<br><span class="green">cabaña ideal</span></h1><p class="muted" style="margin-bottom:16px">Descansa, desconecta y vive una experiencia única.</p><button class="btn" (click)="el.scrollIntoView({behavior:'smooth'})">Explorar cabañas →</button></div>
<div #el class="row sp" style="margin-bottom:12px"><h2>Nuestras Cabañas</h2><span class="green">{{list().length}} resultados</span></div>
<div class="grid">@for(c of list();track c.id){<app-card [c]="c"/>}@empty{<p class="muted">Sin resultados.</p>}</div>`})
export class Home { s = inject(Store); list = computed(() => this.s.cabins().filter(c => c.active && (c.name + c.place).toLowerCase().includes(this.s.query().toLowerCase()))); }
