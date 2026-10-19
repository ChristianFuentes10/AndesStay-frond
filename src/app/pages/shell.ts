import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '../core/store';
import { Auth } from '../core/auth';
@Component({ selector: 'app-shell', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive], styles: [`
.app{display:grid;grid-template-columns:200px 1fr;min-height:100vh}.side{background:var(--p);border-right:1px solid var(--b);padding:18px 12px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh}
.side a,.side button{display:flex;gap:10px;padding:10px 12px;border-radius:10px;color:var(--m);background:none;border:0;cursor:pointer;text-align:left}
.side a:hover,.side button:hover{background:var(--p2);color:var(--t)}.side a.on{background:#14532d;color:#4ade80}
.top{display:flex;gap:16px;align-items:center;padding:14px 24px;border-bottom:1px solid var(--b);position:sticky;top:0;background:var(--bg);z-index:5}
.av{width:32px;height:32px;border-radius:50%;background:var(--g);color:#04130a;display:grid;place-items:center;font-weight:700}main{padding:24px}`], template: `
<div class="app"><nav class="side"><div class="logo" style="margin:4px 8px 18px">🏔️ Andes<b>Stay</b></div>
@for(l of links();track l[1]){<a [routerLink]="l[1]" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">{{l[2]}} {{l[0]}}</a>}
<button style="margin-top:auto" (click)="out()">⎋ Cerrar sesión</button>
<p class="muted" style="font-size:11px;padding:8px">{{s.user()!.role==='admin'?'Panel de Administración':'Descubre, reserva, vive la experiencia'}}</p></nav>
<div><header class="top"><input class="inp" style="max-width:420px" placeholder="Buscar cabañas, destinos..." [value]="s.query()" (input)="search($event)"><span class="grow"></span><span>🔔</span><div class="row"><div class="av">{{s.user()!.name[0]}}</div><span>{{s.user()!.name}}</span></div></header>
<main>@if(s.notice()){<div class="card row sp" style="margin-bottom:14px;border-color:var(--r);color:var(--r)"><span>{{s.notice()}}</span><button class="btn sm ghost" (click)="s.notice.set('')">✕</button></div>}<router-outlet/></main></div></div>`})
export class Shell {
  s = inject(Store); r = inject(Router); a = inject(Auth);
  links = () => this.s.user()!.role === 'admin'
    ? [['Dashboard', '/admin', '▦'], ['Gestionar Cabañas', '/admin/cabanas', '🏠'], ['Reservas', '/admin/reservas', '📅'], ['Usuarios', '/admin/usuarios', '👥'], ...(this.s.can().audit ? [['Auditoría', '/admin/auditoria', '🧾']] : []), ['Mensajes', '/admin/mensajes', '✉']]
    : [['Inicio', '/', '⌂'], ['Mis Reservas', '/reservas', '📅'], ['Favoritos', '/favoritos', '♡'], ['Mensajes', '/mensajes', '✉'], ['Mi Perfil', '/perfil', '👤']];
  search(e: Event) { this.s.query.set((e.target as HTMLInputElement).value); if (this.s.user()!.role === 'user') this.r.navigate(['/']); }
  out() { this.s.logout(); this.r.navigate(['/login']); }
}
