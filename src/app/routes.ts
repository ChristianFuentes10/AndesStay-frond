import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from './core/store';
const auth = () => { const s = inject(Store); return s.user() ? true : inject(Router).parseUrl('/login'); };
const admin = () => { const s = inject(Store); return s.user()?.role === 'admin' ? true : inject(Router).parseUrl('/'); };
const audit = () => inject(Store).can().audit ? true : inject(Router).parseUrl('/admin');
const home = () => { const s = inject(Store); return s.user()?.role === 'admin' ? inject(Router).parseUrl('/admin') : true; };
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login').then(m => m.Login) },
  { path: '', loadComponent: () => import('./pages/shell').then(m => m.Shell), canActivate: [auth], children: [
    { path: '', pathMatch: 'full', canActivate: [home], loadComponent: () => import('./pages/home').then(m => m.Home) },
    { path: 'cabana/:id', loadComponent: () => import('./pages/detail').then(m => m.Detail) },
    { path: 'reservas', loadComponent: () => import('./pages/bookings').then(m => m.Bookings) },
    { path: 'favoritos', loadComponent: () => import('./pages/favorites').then(m => m.Favorites) },
    { path: 'mensajes', loadComponent: () => import('./pages/messages').then(m => m.Messages) },
    { path: 'perfil', loadComponent: () => import('./pages/profile').then(m => m.Profile) },
    { path: 'admin', canActivate: [admin], loadComponent: () => import('./pages/dashboard').then(m => m.Dashboard) },
    { path: 'admin/cabanas', canActivate: [admin], loadComponent: () => import('./pages/admin-cabins').then(m => m.AdminCabins) },
    { path: 'admin/reservas', canActivate: [admin], loadComponent: () => import('./pages/bookings').then(m => m.Bookings) },
    { path: 'admin/usuarios', canActivate: [admin], loadComponent: () => import('./pages/admin-users').then(m => m.AdminUsers) },
    { path: 'admin/auditoria', canActivate: [admin, audit], loadComponent: () => import('./pages/audit').then(m => m.AuditLog) },
    { path: 'admin/mensajes', canActivate: [admin], loadComponent: () => import('./pages/messages').then(m => m.Messages) },
  ]},
  { path: '**', redirectTo: '' }
];
