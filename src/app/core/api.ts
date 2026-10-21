import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { azure } from './auth-config';

// Contratos del BFF (ms-andesstay-bff). El token lo adjunta MsalInterceptor.
export interface UnitDto { id: number; name: string; type: string; capacity: number; pricePerNight: number; available: boolean; }
export interface UnitBody { name: string; type: string; capacity: number; pricePerNight: number; available: boolean; }
export interface ReservationDto { id: number; unitId: number; guestId: string; checkIn: string; checkOut: string; guestsCount: number; pricePerNight: number; totalPrice: number; estado: string; createdAt: string; updatedAt: string; }
export interface ReservationBody { unitId: number; checkIn: string; checkOut: string; guestsCount: number; }
export interface AuditEventDto { id: number; eventType: string; aggregateId: string; actor: string; occurredAt: string; receivedAt: string; traceId: string; correlationId: string; }
export interface PageDto<T> { content: T[]; number: number; size: number; totalElements: number; totalPages: number; first: boolean; last: boolean; }
export type ReservationAction = 'confirmar' | 'checkin' | 'checkout' | 'cancelar';

export interface NotificacionDto {
  id?: number | string;
  destinatario?: string;
  email?: string;
  mensaje?: string;
  asunto?: string;
  tipo?: string;
  estado?: string;
  fecha?: string;
  createdAt?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface EnviarNotificacionBody {
  destinatario: string;
  mensaje: string;
  asunto?: string;
  tipo?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private base = azure.apiBaseUrl;
  private notifyBase = azure.notifyApiUrl || azure.apiBaseUrl;

  units() { return this.http.get<UnitDto[]>(`${this.base}/api/catalog/units`); }
  createUnit(b: UnitBody) { return this.http.post<UnitDto>(`${this.base}/api/catalog/units`, b); }
  updateUnit(id: number, b: UnitBody) { return this.http.put<UnitDto>(`${this.base}/api/catalog/units/${id}`, b); }
  deleteUnit(id: number) { return this.http.delete<void>(`${this.base}/api/catalog/units/${id}`); }

  reservations(page = 0, size = 100) { return this.http.get<PageDto<ReservationDto>>(`${this.base}/api/reservations`, { params: { page, size } }); }
  myReservations() { return this.http.get<ReservationDto[]>(`${this.base}/api/reservations/mias`); }
  createReservation(b: ReservationBody) { return this.http.post<ReservationDto>(`${this.base}/api/reservations`, b); }
  reservationAction(id: number, a: ReservationAction) { return this.http.put<ReservationDto>(`${this.base}/api/reservations/${id}/${a}`, {}); }
  deleteReservation(id: number) { return this.http.delete<void>(`${this.base}/api/reservations/${id}`); }

  audit(f: { tipoEvento?: string; desde?: string; hasta?: string; page?: number; size?: number }) {
    let p = new HttpParams().set('page', f.page ?? 0).set('size', f.size ?? 20);
    if (f.tipoEvento) p = p.set('tipoEvento', f.tipoEvento);
    if (f.desde) p = p.set('desde', f.desde);
    if (f.hasta) p = p.set('hasta', f.hasta);
    return this.http.get<PageDto<AuditEventDto>>(`${this.base}/api/audit`, { params: p });
  }

  // Servicio Notify (API Gateway / Lambda)
  notificaciones() {
    return this.http.get<NotificacionDto[] | PageDto<NotificacionDto> | any>(`${this.notifyBase}/api/v1/notificaciones`);
  }

  enviarNotificacion(b: EnviarNotificacionBody) {
    return this.http.post<any>(`${this.notifyBase}/enviar`, b);
  }
}
