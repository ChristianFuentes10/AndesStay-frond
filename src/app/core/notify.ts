import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { azure } from './auth-config';

// DTO de respuesta del historial (GET /api/v1/notificaciones)
export interface NotificacionDto {
  id?: string | number;
  canal?: string;        // EMAIL | VOUCHER | HOUSEKEEPING
  tipo?: string;         // alias de canal
  destinatario?: string;
  email?: string;
  nombre?: string;
  asunto?: string;
  mensaje?: string;
  contenido?: string;
  estado?: string;       // ENVIADA | PENDIENTE | FALLIDA
  fecha?: string;
  createdAt?: string;
  timestamp?: string;
  [key: string]: any;
}

// Body para POST /api/v1/notificaciones/enviar
export interface EnviarDto {
  canal: 'EMAIL' | 'VOUCHER' | 'HOUSEKEEPING';
  destinatario: string;
  email: string;
  nombre?: string;
  asunto?: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private http = inject(HttpClient);
  // Usa notifyBaseUrl (puerto 8082 de Docker) si existe, si no cae al BFF
  private base = azure.notifyBaseUrl || azure.notifyApiUrl || azure.apiBaseUrl;

  /** Envía una notificación al producer (RabbitMQ → consumer) */
  enviar(body: EnviarDto) {
    return this.http.post<any>(`${this.base}/api/v1/notificaciones/enviar`, body);
  }

  /** Obtiene el historial de notificaciones */
  historial() {
    return this.http.get<NotificacionDto[] | { content: NotificacionDto[] } | any>(
      `${this.base}/api/v1/notificaciones`
    );
  }
}
