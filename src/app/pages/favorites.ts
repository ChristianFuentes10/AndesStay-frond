import { Component, computed, inject } from '@angular/core';
import { Store } from '../core/store';
import { CabinCard } from './card';
@Component({ selector: 'app-fav', standalone: true, imports: [CabinCard], template: `<h2 style="margin-bottom:14px">Favoritos</h2><div class="grid">@for(c of list();track c.id){<app-card [c]="c"/>}@empty{<p class="muted">Aún no tienes favoritos. Toca ♡ en una cabaña.</p>}</div>`})
export class Favorites { s = inject(Store); list = computed(() => this.s.cabins().filter(c => this.s.favs().includes(c.id))); }
