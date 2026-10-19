import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Auth } from './auth';
import { Api, ReservationAction, ReservationDto, UnitDto } from './api';
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
export interface Cabin { id: number; name: string; place: string; price: number; rating: number; reviews: number; imgs: string[]; desc: string; guests: number; rooms: number; baths: number; active: boolean; type?: string; }
export interface Booking { id: number; cabinId: number; user: string; date: string; nights: number; status: Status; total?: number; }
export type Status = 'Confirmada' | 'Pendiente' | 'Cancelada' | 'Check-in' | 'Check-out';
export interface Msg { cabinId: number; from: 'user' | 'host'; text: string; time: string; }
export interface User { name: string; email: string; role: 'admin' | 'user'; roles?: string[]; }
const STATUS: Record<string, Status> = { PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', CHECKIN: 'Check-in', CHECKOUT: 'Check-out', CANCELADA: 'Cancelada' };
const TYPES: Record<string, string> = { CABANA: 'Cabaña', HABITACION: 'Habitación', LODGE: 'Lodge' };
const IMGS = [U('photo-1449158743715-0a90ebb6d2d8'), U('photo-1510798831971-661eb04b3739'), U('photo-1587061949409-02df41d5e562'), U('photo-1518780664697-55e3ad937233')];
const read = <T>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const now = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

@Injectable({ providedIn: 'root' })
export class Store {
  private auth = inject(Auth);
  private api = inject(Api);
  /** true cuando la sesión es Microsoft: los datos vienen del BFF; si no, se usan los datos de demostración. */
  live = !!this.auth.initialUser;
  loading = signal(false);
  notice = signal('');
  user = signal<User | null>(this.auth.initialUser ?? JSON.parse(localStorage.getItem('cg_user') || 'null'));
  query = signal('');
  favs = signal<number[]>(read<number[]>('cg_favs', this.live ? [] : [1]));
  private extras = signal<Record<number, Partial<Cabin>>>(read('cg_extras', {}));
  users = signal<User[]>([{ name: 'Matías P.', email: 'matias@correo.cl', role: 'user' }, { name: 'Camila R.', email: 'camila@correo.cl', role: 'user' }, { name: 'Admin', email: 'admin@andesstay.cl', role: 'admin' }]);
  cabins = signal<Cabin[]>([
    { id: 1, name: 'Cabaña del Bosque', place: 'Pucón, Araucanía', price: 75000, rating: 4.8, reviews: 124, active: true, guests: 4, rooms: 2, baths: 1, desc: 'Cabaña rodeada de bosque nativo con tinaja, chimenea y vista a la cordillera. Ideal para desconectarse y vivir una experiencia única en la naturaleza.', imgs: [U('photo-1449158743715-0a90ebb6d2d8'), U('photo-1510798831971-661eb04b3739'), U('photo-1587061949409-02df41d5e562'), U('photo-1518780664697-55e3ad937233')] },
    { id: 2, name: 'Cabaña Vista Cordillera', place: 'Pucón, Araucanía', price: 90000, rating: 4.9, reviews: 98, active: true, guests: 6, rooms: 3, baths: 2, desc: 'Amplia cabaña con tinaja caliente y terraza panorámica frente a los volcanes.', imgs: [U('photo-1510798831971-661eb04b3739'), U('photo-1449158743715-0a90ebb6d2d8'), U('photo-1518780664697-55e3ad937233'), U('photo-1587061949409-02df41d5e562')] },
    { id: 3, name: 'Domo Andino', place: 'Cunco, Araucanía', price: 65000, rating: 4.7, reviews: 76, active: true, guests: 2, rooms: 1, baths: 1, desc: 'Domo geodésico con techo transparente para ver las estrellas, ideal para parejas.', imgs: [U('photo-1518780664697-55e3ad937233'), U('photo-1449158743715-0a90ebb6d2d8'), U('photo-1510798831971-661eb04b3739'), U('photo-1587061949409-02df41d5e562')] },
    { id: 4, name: 'Cabaña Lago Azul', place: 'Pucón, Araucanía', price: 80000, rating: 4.8, reviews: 85, active: true, guests: 5, rooms: 2, baths: 2, desc: 'Frente al lago, con muelle privado, kayak y quincho para asados.', imgs: [U('photo-1587061949409-02df41d5e562'), U('photo-1510798831971-661eb04b3739'), U('photo-1449158743715-0a90ebb6d2d8'), U('photo-1518780664697-55e3ad937233')] },
  ]);
  bookings = signal<Booking[]>([
    { id: 1, cabinId: 1, user: 'Matías P.', date: '2026-09-24', nights: 2, status: 'Confirmada' },
    { id: 2, cabinId: 2, user: 'Camila R.', date: '2026-09-20', nights: 3, status: 'Confirmada' },
    { id: 3, cabinId: 3, user: 'Matías P.', date: '2026-09-18', nights: 1, status: 'Pendiente' },
    { id: 4, cabinId: 4, user: 'Camila R.', date: '2026-09-12', nights: 2, status: 'Confirmada' },
  ]);
  msgs = signal<Msg[]>([{ cabinId: 1, from: 'host', text: '¡Hola! ¿Tienes alguna duda sobre la cabaña?', time: '10:20' }]);

  login(email: string, name?: string) {
    const admin = email.toLowerCase().includes('admin');
    const u: User = { email, name: name || (admin ? 'Admin' : 'Matías P.'), role: admin ? 'admin' : 'user' };
    this.user.set(u); localStorage.setItem('cg_user', JSON.stringify(u)); return u;
  }
  logout() { this.user.set(null); localStorage.removeItem('cg_user'); if (this.auth.claims) this.auth.logout(); }
  cabin(id: number) { return this.cabins().find(c => c.id === id); }
  can = computed(() => {
    const r = this.user()?.roles ?? [], has = (...x: string[]) => x.some(y => r.includes(y));
    if (!this.live) { const a = this.user()?.role === 'admin'; return { catalog: true, manage: a, book: true, remove: false, audit: false }; }
    return { catalog: has('ADMIN'), manage: has('ADMIN', 'RECEPCIONISTA'), book: has('ADMIN', 'RECEPCIONISTA', 'HUESPED'), remove: has('ADMIN'), audit: has('ADMIN', 'AUDITOR') };
  });

  constructor() {
    if (!this.live) return;
    this.cabins.set([]); this.bookings.set([]); this.users.set([]); this.msgs.set([]);
    this.refresh();
  }

  // ---------- Conexión con el BFF ----------
  async refresh() {
    this.loading.set(true);
    try { await this.loadUnits(); await this.loadBookings(); } finally { this.loading.set(false); }
  }
  private async loadUnits() {
    try { this.cabins.set((await firstValueFrom(this.api.units())).map(u => this.toCabin(u))); } catch (e) { this.fail(e); }
  }
  private async loadBookings() {
    try {
      const list = this.can().manage ? (await firstValueFrom(this.api.reservations())).content : await firstValueFrom(this.api.myReservations());
      this.bookings.set(list.map(r => this.toBooking(r)));
      const ids = [...new Set(list.map(r => r.guestId))];
      this.users.set(ids.map(id => ({ name: this.guestName(id), email: id, role: 'user' as const })));
    } catch (e) { this.fail(e); }
  }
  private guestName(id: string) { return id === this.auth.claims?.['sub'] ? this.user()!.name : id.slice(0, 8); }
  private toCabin(u: UnitDto): Cabin {
    const x = this.extras()[u.id] ?? {}, label = TYPES[u.type] ?? u.type, k = u.id % 4;
    const imgs = [...IMGS.slice(k), ...IMGS.slice(0, k)];
    return { id: u.id, name: u.name, type: u.type, place: x.place || `${label} · AndesStay`, price: Number(u.pricePerNight), rating: 0, reviews: 0, guests: u.capacity, active: u.available,
      rooms: x.rooms ?? 0, baths: x.baths ?? 0, desc: x.desc || `${label} para ${u.capacity} huéspedes en AndesStay.`, imgs: x.imgs?.[0] ? [x.imgs[0], ...imgs.slice(1)] : imgs };
  }
  private toBooking(r: ReservationDto): Booking {
    const nights = Math.max(1, Math.round((Date.parse(r.checkOut) - Date.parse(r.checkIn)) / 864e5));
    return { id: r.id, cabinId: r.unitId, user: this.guestName(r.guestId), date: r.checkIn, nights, status: STATUS[r.estado] ?? 'Pendiente', total: Number(r.totalPrice) };
  }
  private fail(e: any) {
    const st = e?.status, msg = e?.error?.message;
    this.notice.set(st === 0 ? 'No se pudo conectar con el BFF. Revisa que esté arriba y que CORS permita http://localhost:4200.'
      : st === 401 ? 'Tu sesión no es válida para el BFF (401). Cierra sesión y vuelve a entrar.'
      : st === 403 ? 'Tu rol no tiene permiso para esta acción (403).'
      : msg || e?.message || 'Ocurrió un error al comunicarse con el servidor.');
    setTimeout(() => this.notice.set(''), 8000);
  }

  // ---------- Operaciones ----------
  /** Devuelve '' si salió bien o el mensaje de error. */
  async book(cabinId: number, date: string, nights: number, guests = 1): Promise<string> {
    if (!this.live) { this.bookings.update(b => [{ id: Date.now(), cabinId, user: this.user()!.name, date, nights, status: 'Pendiente', total: undefined }, ...b]); return ''; }
    const out = new Date(Date.parse(date) + nights * 864e5).toISOString().slice(0, 10);
    try { await firstValueFrom(this.api.createReservation({ unitId: cabinId, checkIn: date, checkOut: out, guestsCount: guests })); await this.loadBookings(); return ''; }
    catch (e: any) { this.fail(e); return e?.error?.message || 'No se pudo crear la reserva.'; }
  }
  async act(id: number, a: ReservationAction | 'eliminar') {
    if (!this.live) {
      if (a === 'eliminar') return;
      const m = { confirmar: 'Confirmada', checkin: 'Check-in', checkout: 'Check-out', cancelar: 'Cancelada' } as const;
      this.bookings.update(b => b.map(x => x.id === id ? { ...x, status: m[a] } : x)); return;
    }
    try {
      if (a === 'eliminar') {
        await firstValueFrom(this.api.deleteReservation(id));
      } else {
        await firstValueFrom(this.api.reservationAction(id, a));
      }
      await this.loadBookings();
    } catch (e) { this.fail(e); }
  }
  send(cabinId: number, text: string) {
    const from = this.user()?.role === 'admin' ? 'host' : 'user';
    this.msgs.update(m => [...m, { cabinId, from, text, time: now() }]);
    if (from === 'user') setTimeout(() => this.msgs.update(m => [...m, { cabinId, from: 'host', text: '¡Gracias por escribir! Te respondo en un momento 😊', time: now() }]), 1200);
  }
  async saveCabin(c: Cabin) {
    if (!this.live) { this.cabins.update(l => l.some(x => x.id === c.id) ? l.map(x => x.id === c.id ? c : x) : [...l, c]); return; }
    const body = { name: c.name, type: c.type || 'CABANA', capacity: Number(c.guests) || 1, pricePerNight: Number(c.price), available: c.active };
    try {
      const u = await firstValueFrom(c.id ? this.api.updateUnit(c.id, body) : this.api.createUnit(body));
      this.extras.update(x => ({ ...x, [u.id]: { place: c.place, desc: c.desc, rooms: c.rooms, baths: c.baths, imgs: [c.imgs[0]] } }));
      localStorage.setItem('cg_extras', JSON.stringify(this.extras()));
      await this.loadUnits();
    } catch (e) { this.fail(e); }
  }
  async deleteCabin(id: number) {
    if (!this.live) { this.cabins.update(l => l.filter(x => x.id !== id)); return; }
    try { await firstValueFrom(this.api.deleteUnit(id)); await this.loadUnits(); } catch (e) { this.fail(e); }
  }
  toggleFav(id: number) { this.favs.update(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]); localStorage.setItem('cg_favs', JSON.stringify(this.favs())); }
  total(b: Booking) { return b.total ?? (this.cabin(b.cabinId)?.price || 0) * b.nights; }
  money(n: number) { return '$' + n.toLocaleString('es-CL'); }
}
