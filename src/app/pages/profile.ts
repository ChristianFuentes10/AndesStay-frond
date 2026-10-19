import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { Auth } from '../core/auth';
@Component({ selector: 'app-profile', standalone: true, imports: [FormsModule], template: `
<h2 style="margin-bottom:14px">Mi Perfil</h2><form class="card" style="max-width:420px;display:grid;gap:10px" (ngSubmit)="save()">
<label class="muted">Nombre</label><input class="inp" name="n" [(ngModel)]="name"><label class="muted">Correo</label><input class="inp" name="e" [(ngModel)]="email" [readonly]="!!a.claims">
<button class="btn">Guardar cambios</button>@if(ok){<span class="green">✔ Guardado</span>}</form>
@if(a.claims){<div class="card" style="max-width:420px;display:grid;gap:8px;margin-top:14px"><h3>Sesión Microsoft</h3>
<div class="row sp"><span class="muted">Roles</span><span class="row">@for(r of s.user()!.roles||[];track r){<span class="badge">{{r}}</span>}@empty{<span class="muted">sin roles asignados</span>}</span></div>
@for(k of rows();track k[0]){<div class="row sp"><span class="muted">{{k[0]}}</span><span style="word-break:break-all;text-align:right">{{k[1]}}</span></div>}</div>}`})
export class Profile { s = inject(Store); a = inject(Auth); name = this.s.user()!.name; email = this.s.user()!.email; ok = false;
  rows = () => { const c = this.a.claims || {}; return [['Alcance', c['scp']], ['Audiencia', c['aud']], ['Versión token', c['ver']], ['Tenant', c['tid']], ['Expira', c['exp'] ? new Date(c['exp'] * 1000).toLocaleString('es-CL') : '']].filter(x => x[1]); };
  save() { const u = { ...this.s.user()!, name: this.name, email: this.email }; this.s.user.set(u); if (!this.a.claims) localStorage.setItem('cg_user', JSON.stringify(u)); this.ok = true; } }
