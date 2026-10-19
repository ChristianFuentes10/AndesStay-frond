import { Component, inject } from '@angular/core';
import { Store } from '../core/store';
@Component({ selector: 'app-users', standalone: true, template: `<h2 style="margin-bottom:14px">Usuarios</h2><div class="card"><table><tr><th>Nombre</th><th>{{s.live?'ID':'Correo'}}</th><th>Rol</th><th></th></tr>
@for(u of s.users();track u.email){<tr><td>{{u.name}}</td><td>{{u.email}}</td><td><span class="badge">{{u.role}}</span></td><td>@if(u.role!=='admin'&&!s.live){<button class="btn sm red" (click)="del(u.email)">Eliminar</button>}</td></tr>}</table></div>`})
export class AdminUsers { s = inject(Store); del(e: string) { this.s.users.update(l => l.filter(u => u.email !== e)); } }
