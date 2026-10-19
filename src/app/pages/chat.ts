import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
@Component({ selector: 'app-chat', standalone: true, imports: [FormsModule], template: `
<div class="chat"><div class="row" style="border-bottom:1px solid var(--b);padding-bottom:10px"><div class="av2">M</div><div><b>María González</b><div class="muted" style="font-size:12px">Anfitriona · <span class="green">En línea</span></div></div></div>
<div class="list">@for(m of thread();track $index){<div class="bub" [class.me]="m.from===me()"><div>{{m.text}}</div><small>{{m.time}}</small></div>}</div>
<form class="row" (ngSubmit)="send()"><input class="inp" name="t" [(ngModel)]="text" placeholder="Escribe un mensaje..." autocomplete="off"><button class="btn">➤</button></form></div>`,
  styles: [`.av2{width:34px;height:34px;border-radius:50%;background:var(--g);color:#04130a;display:grid;place-items:center;font-weight:700}`]})
export class Chat {
  id = input.required<number>(); s = inject(Store); text = '';
  thread = computed(() => this.s.msgs().filter(m => m.cabinId === this.id()));
  me = () => this.s.user()!.role === 'admin' ? 'host' : 'user';
  send() { if (!this.text.trim()) return; this.s.send(this.id(), this.text.trim()); this.text = ''; }
}
