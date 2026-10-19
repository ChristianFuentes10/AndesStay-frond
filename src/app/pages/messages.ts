import { Component, inject, signal } from '@angular/core';
import { Store } from '../core/store';
import { Chat } from './chat';
@Component({ selector: 'app-messages', standalone: true, imports: [Chat], styles: [`.g{display:grid;grid-template-columns:280px 1fr;gap:16px;height:70vh}.it{padding:10px;border-radius:10px;cursor:pointer}.it:hover,.it.on{background:var(--p2)}`], template: `
<div class="g"><div class="card"><h3 style="margin-bottom:8px">Conversaciones</h3>@for(c of s.cabins();track c.id){<div class="it" [class.on]="cur()===c.id" (click)="sel.set(c.id)"><b>{{c.name}}</b><div class="muted" style="font-size:12px">{{c.place}}</div></div>}</div>
<div class="card"><app-chat [id]="cur()"/></div></div>`})
export class Messages { s = inject(Store); sel = signal<number | null>(null); cur = () => this.sel() ?? this.s.cabins()[0]?.id ?? 0; }
