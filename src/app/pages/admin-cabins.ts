import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cabin, Store } from '../core/store';
@Component({
  selector: 'app-acabins', standalone: true, imports: [FormsModule], template: `
<div class="row sp" style="margin-bottom:14px"><h2>Gestionar Cabañas</h2>@if(s.can().catalog){<button class="btn" (click)="open()">+ Agregar cabaña</button>}</div>
<div class="card"><table><tr><th></th><th>Nombre</th><th>Ubicación</th><th>Precio</th><th>Estado</th><th></th></tr>
@for(c of s.cabins();track c.id){<tr><td><img [src]="c.imgs[0]" width="56" height="40" style="object-fit:cover;border-radius:6px" alt=""></td><td>{{c.name}}</td><td>{{c.place}}</td><td>{{s.money(c.price)}}</td>
<td><span class="badge" [class]="c.active?'badge':'badge Cancelada'">{{c.active?'Activa':'Oculta'}}</span></td>
<td class="row">@if(s.can().catalog){<button class="btn sm ghost" (click)="open(c)">Editar</button><button class="btn sm ghost" (click)="toggle(c)">{{c.active?'Ocultar':'Activar'}}</button><button class="btn sm red" (click)="s.deleteCabin(c.id)">Eliminar</button>}</td></tr>}</table></div>
@if(f(); as c){<div class="modal" (click)="f.set(null)"><form class="card" (click)="$event.stopPropagation()" (ngSubmit)="save()"><h3>{{c.id?'Editar':'Nueva'}} cabaña</h3>
<input class="inp" name="a" [(ngModel)]="c.name" placeholder="Nombre" required>@if(s.live){<select class="inp" name="t" [(ngModel)]="c.type"><option value="CABANA">Cabaña</option><option value="HABITACION">Habitación</option><option value="LODGE">Lodge</option></select>}<input class="inp" name="b" [(ngModel)]="c.place" placeholder="Ubicación" required>
<input class="inp" name="c" type="number" [(ngModel)]="c.price" placeholder="Precio por noche" required><input class="inp" name="d" [(ngModel)]="c.imgs[0]" placeholder="URL de imagen">
<div class="row"><input class="inp" name="e" type="number" [(ngModel)]="c.guests" placeholder="Huéspedes"><input class="inp" name="g" type="number" [(ngModel)]="c.rooms" placeholder="Habitaciones"><input class="inp" name="h" type="number" [(ngModel)]="c.baths" placeholder="Baños"></div>
<textarea class="inp" name="i" rows="3" [(ngModel)]="c.desc" placeholder="Descripción"></textarea>
<div class="row sp"><button type="button" class="btn ghost" (click)="f.set(null)">Cancelar</button><button class="btn">Guardar</button></div></form></div>}`})
export class AdminCabins {
  s = inject(Store); f = signal<Cabin | null>(null);
  open(c?: Cabin) { this.f.set(c ? { ...c, imgs: [...c.imgs] } : { id: 0, type: 'CABANA', name: '', place: '', price: 50000, rating: 5, reviews: 0, active: true, guests: 2, rooms: 1, baths: 1, desc: '', imgs: ['https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=70'] }); }
  save() { const c = this.f()!; if (!c.id && !this.s.live) c.id = Date.now(); this.s.saveCabin(c); this.f.set(null); }
  toggle(c: Cabin) { this.s.saveCabin({ ...c, active: !c.active }); }
}
