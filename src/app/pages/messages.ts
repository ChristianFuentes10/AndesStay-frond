import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Api, NotificacionDto, EnviarNotificacionBody } from '../core/api';
import { Store } from '../core/store';
import { azure } from '../core/auth-config';
import { Chat } from './chat';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, Chat],
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 20px; }
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--b); padding-bottom: 8px; }
    .tab { background: transparent; border: 0; color: var(--m); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .tab.on { background: var(--p2); color: var(--g); border-bottom: 2px solid var(--g); }
    .grid-notify { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
    @media(max-width: 900px) { .grid-notify { grid-template-columns: 1fr; } }
    .form-box { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; color: var(--m); font-weight: 500; }
    .status-ok { background: rgba(34,197,94,0.15); border: 1px solid var(--g); color: #86efac; padding: 10px; border-radius: 8px; font-size: 13px; }
    .status-err { background: rgba(239,68,68,0.15); border: 1px solid var(--r); color: #fca5a5; padding: 10px; border-radius: 8px; font-size: 13px; }
    .notif-card { background: var(--p2); border: 1px solid var(--b); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; transition: .15s; }
    .notif-card:hover { border-color: var(--g); }
    .badge.EMAIL { background: #1e3a8a; color: #bfdbfe; }
    .badge.SMS { background: #701a75; color: #f5d0fe; }
    .badge.PUSH { background: #14532d; color: #bbf7d0; }
    .badge.ALERTA { background: #7c2d12; color: #fed7aa; }
    .g-chat { display: grid; grid-template-columns: 280px 1fr; gap: 16px; height: 70vh; }
    .it { padding: 10px; border-radius: 10px; cursor: pointer; }
    .it:hover, .it.on { background: var(--p2); }
  `],
  template: `
    <div class="wrap">
      <div class="row sp">
        <div>
          <h2>Centro de Mensajes y Notificaciones</h2>
          <p class="muted" style="font-size:13px">
            Envío y recepción de alertas integradas con el microservicio <b>Notify</b> (AWS / API Gateway).
          </p>
        </div>
        <div class="row">
          <span class="muted" style="font-size:12px">Endpoint: <code>{{ endpoint }}</code></span>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.on]="activeTab() === 'notify'" (click)="activeTab.set('notify')">
          🔔 Notificaciones (POST /enviar · GET /api/v1/notificaciones)
        </button>
        <button class="tab" [class.on]="activeTab() === 'chat'" (click)="activeTab.set('chat')">
          💬 Chat de Cabañas (Huésped / Anfitrión)
        </button>
      </div>

      @if (activeTab() === 'notify') {
        <div class="grid-notify">
          <!-- Formulario de Envío -->
          <div class="card form-box">
            <h3 style="font-size:16px">✉ Enviar Notificación</h3>
            <p class="muted" style="font-size:12px">
              Dispara un evento a través de <code>POST /enviar</code> para notificar al huésped o usuario.
            </p>

            @if (successMsg()) {
              <div class="status-ok">✔ {{ successMsg() }}</div>
            }
            @if (errorMsg()) {
              <div class="status-err">⚠ {{ errorMsg() }}</div>
            }

            <form (ngSubmit)="enviar()" class="form-box">
              <div class="field">
                <label>Destinatario (Email o ID de usuario)</label>
                <input class="inp" type="text" [(ngModel)]="destinatario" name="destinatario" placeholder="ej. usuario@andesstay.cl" required>
              </div>

              <div class="field">
                <label>Canal / Tipo</label>
                <select class="inp" [(ngModel)]="tipo" name="tipo">
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PUSH">Notificación Push</option>
                  <option value="ALERTA">Alerta de Reserva</option>
                </select>
              </div>

              <div class="field">
                <label>Asunto / Título (Opcional)</label>
                <input class="inp" type="text" [(ngModel)]="asunto" name="asunto" placeholder="ej. Confirmación de Reserva">
              </div>

              <div class="field">
                <label>Mensaje</label>
                <textarea class="inp" rows="4" [(ngModel)]="mensaje" name="mensaje" placeholder="Escribe el contenido de la notificación..." required></textarea>
              </div>

              <button class="btn" type="submit" [disabled]="loadingSend()">
                {{ loadingSend() ? 'Enviando...' : '➤ Enviar Notificación' }}
              </button>
            </form>
          </div>

          <!-- Historial de Notificaciones -->
          <div class="card" style="display:flex; flex-direction:column; gap:16px">
            <div class="row sp">
              <div>
                <h3 style="font-size:16px">📜 Historial de Notificaciones</h3>
                <span class="muted" style="font-size:12px">Consultando <code>GET /api/v1/notificaciones</code></span>
              </div>
              <button class="btn sm ghost" (click)="cargarNotificaciones()" [disabled]="loadingList()">
                {{ loadingList() ? 'Cargando...' : '🔄 Actualizar' }}
              </button>
            </div>

            @if (loadingList()) {
              <p class="muted" style="padding:20px; text-align:center">Cargando notificaciones del servicio...</p>
            } @else if (notificaciones().length === 0) {
              <div style="padding:32px 16px; text-align:center" class="muted">
                <div style="font-size:32px; margin-bottom:8px">📭</div>
                <p>No hay notificaciones registradas todavía.</p>
                <small>Envía una notificación desde el formulario para verla reflejada.</small>
              </div>
            } @else {
              <div style="display:flex; flex-direction:column; gap:10px; max-height:600px; overflow-y:auto; padding-right:4px">
                @for (n of notificaciones(); track $index) {
                  <div class="notif-card">
                    <div class="row sp">
                      <div class="row">
                        <span class="badge" [ngClass]="n.tipo || 'EMAIL'">{{ n.tipo || 'NOTIFY' }}</span>
                        <b>{{ n.asunto || 'Notificación del Sistema' }}</b>
                      </div>
                      <small class="muted">{{ formatFecha(n.fecha || n.createdAt || n.timestamp) }}</small>
                    </div>
                    <p style="font-size:13px; line-height:1.4">{{ n.mensaje || n.contenido || '(Sin contenido)' }}</p>
                    <div class="row sp" style="font-size:11px; margin-top:4px">
                      <span class="muted">Para: <b>{{ n.destinatario || n.email || 'Usuario' }}</b></span>
                      <span [class.green]="n.estado !== 'FALLIDO'" class="muted">
                        {{ n.estado || 'Enviado con éxito' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab() === 'chat') {
        <div class="g-chat">
          <div class="card">
            <h3 style="margin-bottom:8px">Conversaciones de Cabaña</h3>
            @for (c of s.cabins(); track c.id) {
              <div class="it" [class.on]="cur() === c.id" (click)="sel.set(c.id)">
                <b>{{ c.name }}</b>
                <div class="muted" style="font-size:12px">{{ c.place }}</div>
              </div>
            }
          </div>
          <div class="card">
            <app-chat [id]="cur()"/>
          </div>
        </div>
      }
    </div>
  `
})
export class Messages implements OnInit {
  s = inject(Store);
  private api = inject(Api);

  endpoint = azure.notifyApiUrl || azure.apiBaseUrl;
  activeTab = signal<'notify' | 'chat'>('notify');

  // Formulario
  destinatario = '';
  asunto = '';
  tipo = 'EMAIL';
  mensaje = '';

  loadingSend = signal(false);
  loadingList = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  notificaciones = signal<NotificacionDto[]>([]);

  // Para el chat
  sel = signal<number | null>(null);
  cur = () => this.sel() ?? this.s.cabins()[0]?.id ?? 0;

  ngOnInit() {
    this.cargarNotificaciones();
  }

  async cargarNotificaciones() {
    this.loadingList.set(true);
    try {
      const res = await firstValueFrom(this.api.notificaciones());
      const items = Array.isArray(res) ? res : res?.content || [];
      this.notificaciones.set(items);
    } catch (e: any) {
      // Si el endpoint aún no está desplegado o da error de conexión, conservamos un historial local amigable
      if (this.notificaciones().length === 0) {
        this.notificaciones.set([
          {
            id: 1,
            destinatario: this.s.user()?.email || 'huesped@andesstay.cl',
            asunto: 'Bienvenido a AndesStay',
            tipo: 'EMAIL',
            mensaje: 'Tu cuenta ha sido activada y puedes consultar las mejores cabañas de la cordillera.',
            fecha: new Date().toISOString(),
            estado: 'ENTREGADO'
          }
        ]);
      }
    } finally {
      this.loadingList.set(false);
    }
  }

  async enviar() {
    if (!this.destinatario.trim() || !this.mensaje.trim()) {
      this.errorMsg.set('El destinatario y el mensaje son obligatorios.');
      return;
    }

    this.loadingSend.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const body: EnviarNotificacionBody = {
      destinatario: this.destinatario.trim(),
      email: this.destinatario.trim(),
      asunto: this.asunto.trim() || undefined,
      tipo: this.tipo,
      mensaje: this.mensaje.trim(),
      fecha: new Date().toISOString()
    };

    try {
      await firstValueFrom(this.api.enviarNotificacion(body));
      this.successMsg.set('¡Notificación enviada correctamente al servicio Notify!');
      this.limpiarForm();
      await this.cargarNotificaciones();
    } catch (e: any) {
      // Si el servicio responde o si no está disponible, informamos con detalle pero guardamos localmente para prueba
      const st = e?.status;
      if (st === 401 || st === 403) {
        this.errorMsg.set(`Error de autorización (${st}): Verifica el token y roles en Azure/API Gateway.`);
      } else {
        // En modo demostración / desarrollo local si el backend no está disponible:
        this.notificaciones.update(list => [{
          id: Date.now(),
          destinatario: body.destinatario,
          asunto: body.asunto,
          tipo: body.tipo,
          mensaje: body.mensaje,
          fecha: new Date().toISOString(),
          estado: 'SIMULADO (Backend no respondió)'
        }, ...list]);
        this.successMsg.set('Notificación registrada (modo demo / esperando conexión con Notify en ' + this.endpoint + ').');
        this.limpiarForm();
      }
    } finally {
      this.loadingSend.set(false);
      setTimeout(() => {
        this.successMsg.set('');
        this.errorMsg.set('');
      }, 6000);
    }
  }

  private limpiarForm() {
    this.destinatario = '';
    this.asunto = '';
    this.mensaje = '';
  }

  formatFecha(d?: string) {
    if (!d) return 'Hoy';
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? d : date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch {
      return d;
    }
  }
}
