import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cabin, Store } from '../core/store';
@Component({
    selector: 'app-card', standalone: true, imports: [RouterLink], template: `
<div class="cab"><img [src]="c().imgs[0]" [alt]="c().name"><button class="heart" [class.on]="s.favs().includes(c().id)" (click)="s.toggleFav(c().id)">{{s.favs().includes(c().id)?'♥':'♡'}}</button>
<div class="in"><div class="row sp"><b>{{c().name}}</b><b>{{s.money(c().price)}}</b></div>
<div class="muted">📍 {{c().place}} <span style="float:right">/ noche</span></div>
<div class="row sp" style="margin-top:8px">@if(c().reviews){<span style="color:var(--y)">★ {{c().rating}} <span class="muted">({{c().reviews}} reseñas)</span></span>}@else{<span class="muted">Nueva</span>}<a class="btn sm" [routerLink]="['/cabana',c().id]">Ver detalles</a></div></div></div>`})
export class CabinCard { c = input.required<Cabin>(); s = inject(Store); }
