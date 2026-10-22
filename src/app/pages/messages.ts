import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NotifyService, NotificacionDto, EnviarDto } from '../core/notify';
import { Store } from '../core/store';
import { azure } from '../core/auth-config';
import { Chat } from './chat';

type Canal = 'EMAIL' | 'VOUCHER' | 'HOUSEKEEPING';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, Chat],
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 20px; }

    /* Pestañas */
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--b); padding-bottom: 8px; }
    .tab { background: transparent; border: 0; color: var(--m); padding: 8px 16px;
           border-radius: 8px 8px 0 0; cursor: pointer; font-weight: 600; font: inherit; }
    .tab.on { background: var(--p2); color: var(--g); border-bottom: 2px solid var(--g); }

    /* Grid principal notify */
    .notify-grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; }
    @media(max-width: 1000px) { .notify-grid { grid-template-columns: 1fr; } }

    /* Formulario */
    .form-wrap { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; color: var(--m); font-weight: 600;
                   text-transform: uppercase; letter-spacing: 0.5px; }

    /* Selector de canal */
    .canal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .canal-btn { border: 1px solid var(--b); background: var(--p2); color: var(--m);
                 border-radius: 10px; padding: 10px 6px; cursor: pointer; font: inherit;
                 font-size: 12px; font-weight: 600; text-align: center;
                 display: flex; flex-direction: column; align-items: center; gap: 4px;
                 transition: .15s; }
    .canal-btn:hover { border-color: var(--g); color: var(--t); }
    .canal-btn.sel { border-color: var(--g); background: rgba(34,197,94,0.12);
                     color: var(--g); }
    .canal-btn span.ic { font-size: 20px; }

    /* Alertas de estado */
    .alert { padding: 10px 14px; border-radius: 8px; font-size: 13px; }
    .alert.ok  { background: rgba(34,197,94,.12); border: 1px solid var(--g); color: #86efac; }
    .alert.err { background: rgba(239,68,68,.12);  border: 1px solid var(--r); color: #fca5a5; }
    .alert.warn{ background: rgba(234,179,8,.12);  border: 1px solid var(--y); color: #fde68a; }

    /* Tabla historial */
    .hist-header { display: flex; align-items: center; justify-content: space-between; }
    .estado-badge { padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .estado-badge.ENVIADA      { background:#14532d; color:#4ade80; }
    .estado-badge.PENDIENTE    { background:#1e3a8a; color:#93c5fd; }
    .estado-badge.FALLIDA      { background:#7f1d1d; color:#fca5a5; }
    .estado-badge.SIMULADO     { background:#3b3200; color:#fde68a; }

    /* Chat cabañas */
    .g-chat { display: grid; grid-template-columns: 280px 1fr; gap: 16px; height: 70vh; }
    .it { padding: 10px; border-radius: 10px; cursor: pointer; transition:.1s; }
    .it:hover, .it.on { background: var(--p2); }
    .empty-state { padding: 40px 16px; text-align: center; color: var(--m); }
    .empty-state .ic { font-size: 36px; margin-bottom: 8px; }
  `],
  template: `
    <div class="wrap">

      <!-- Encabezado -->
      <div class="row sp" style="flex-wrap:wrap; gap:12px">
        <div>
          <h2 style="margin-bottom:4px">Centro de Mensajes</h2>
          <p class="muted" style="font-size:12px">
            Notify · <code>{{ notifyUrl }}</code>
          </p>
        </div>
      </div>

      <!-- Pestañas -->
      <div class="tabs">
        <button class="tab" [class.on]="tab()==='notify'" (click)="tab.set('notify')">
          🔔 Notificaciones
        </button>
        <button class="tab" [class.on]="tab()==='chat'" (click)="tab.set('chat')">
          💬 Chat de Cabañas
        </button>
      </div>

      <!-- ===== PESTAÑA NOTIFY ===== -->
      @if (tab() === 'notify') {
        <div class="notify-grid">

          <!-- Formulario de envío -->
          <div class="card form-wrap">
            <h3 style="font-size:15px; margin-bottom:4px">✉ Enviar Notificación</h3>
            <p class="muted" style="font-size:12px">
              POST <code>/api/v1/notificaciones/enviar</code>
            </p>

            @if (okMsg()) { <div class="alert ok">✔ {{ okMsg() }}</div> }
            @if (errMsg()) { <div class="alert err">⚠ {{ errMsg() }}</div> }
            @if (warnMsg()){ <div class="alert warn">⏳ {{ warnMsg() }}</div> }

            <form (ngSubmit)="enviar()" class="form-wrap">

              <!-- Selector de canal -->
              <div class="field">
                <label>Canal</label>
                <div class="canal-grid">
                  <button type="button" class="canal-btn" [class.sel]="canal==='EMAIL'"
                          (click)="canal='EMAIL'">
                    <span class="ic">📧</span>Email
                  </button>
                  <button type="button" class="canal-btn" [class.sel]="canal==='VOUCHER'"
                          (click)="canal='VOUCHER'">
                    <span class="ic">🎟️</span>Voucher
                  </button>
                  <button type="button" class="canal-btn" [class.sel]="canal==='HOUSEKEEPING'"
                          (click)="canal='HOUSEKEEPING'">
                    <span class="ic">🛎️</span>Housekeeping
                  </button>
                </div>
              </div>

              <div class="field">
                <label>Nombre del Destinatario</label>
                <input class="inp" name="nombre" [(ngModel)]="nombre"
                       placeholder="Nombre completo">
              </div>

              <div class="field">
                <label>Email del Destinatario</label>
                <input class="inp" name="email" type="email" [(ngModel)]="email"
                       placeholder="correo@ejemplo.cl" required>
              </div>

              <div class="field">
                <label>Asunto</label>
                <input class="inp" name="asunto" [(ngModel)]="asunto"
                       placeholder="ej. Confirmación de Reserva">
              </div>

              <div class="field">
                <label>Mensaje</label>
                <textarea class="inp" name="mensaje" rows="4" [(ngModel)]="mensaje"
                          placeholder="Contenido de la notificación..." required></textarea>
              </div>

              <button class="btn" type="submit" [disabled]="sending()">
                {{ sending() ? 'Enviando...' : '➤ Enviar' }}
              </button>
            </form>
          </div>

          <!-- Historial -->
          <div class="card" style="display:flex;flex-direction:column;gap:14px">
            <div class="hist-header">
              <div>
                <h3 style="font-size:15px; margin-bottom:2px">📜 Historial</h3>
                <span class="muted" style="font-size:12px">
                  GET <code>/api/v1/notificaciones</code>
                </span>
              </div>
              <button class="btn sm ghost" (click)="cargar()" [disabled]="loading()">
                {{ loading() ? '⏳' : '🔄' }} Actualizar
              </button>
            </div>

            @if (loading()) {
              <p class="muted" style="text-align:center; padding:20px">
                Cargando historial...
              </p>
            } @else if (lista().length === 0) {
              <div class="empty-state">
                <div class="ic">📭</div>
                <p>Sin notificaciones todavía.</p>
                <small>Envía una para verla aquí. El consumer procesa de forma asíncrona.</small>
              </div>
            } @else {
              <div style="overflow-x:auto">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Canal</th>
                      <th>Destinatario</th>
                      <th>Asunto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (n of lista(); track $index) {
                      <tr>
                        <td style="font-size:12px; white-space:nowrap">
                          {{ fmt(n.fecha || n.createdAt || n.timestamp) }}
                        </td>
                        <td>
                          <span class="badge">{{ n.canal || n.tipo || '—' }}</span>
                        </td>
                        <td style="font-size:12px; max-width:160px; overflow:hidden;
                                   text-overflow:ellipsis; white-space:nowrap">
                          {{ n.destinatario || n.email || '—' }}
                        </td>
                        <td style="font-size:12px">{{ n.asunto || n.mensaje || '—' }}</td>
                        <td>
                          <span class="estado-badge"
                                [ngClass]="estadoClass(n.estado)">
                            {{ n.estado || 'ENVIADA' }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

        </div>
      }

      <!-- ===== PESTAÑA CHAT ===== -->
      @if (tab() === 'chat') {
        <div class="g-chat">
          <div class="card">
            <h3 style="margin-bottom:8px">Conversaciones</h3>
            @for (c of s.cabins(); track c.id) {
              <div class="it" [class.on]="cur()===c.id" (click)="sel.set(c.id)">
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
  private notify = inject(NotifyService);

  readonly notifyUrl = azure.notifyBaseUrl || azure.notifyApiUrl || azure.apiBaseUrl;

  // Pestaña activa
  tab = signal<'notify' | 'chat'>('notify');

  // Formulario — se precargan datos del usuario logueado
  canal: Canal = 'EMAIL';
  nombre  = this.s.user()?.name  || '';
  email   = this.s.user()?.email || '';
  asunto  = '';
  mensaje = '';

  // Estados UI
  sending  = signal(false);
  loading  = signal(false);
  okMsg    = signal('');
  errMsg   = signal('');
  warnMsg  = signal('');

  // Historial
  lista = signal<NotificacionDto[]>([]);

  // Chat
  sel = signal<number | null>(null);
  cur = () => this.sel() ?? this.s.cabins()[0]?.id ?? 0;

  ngOnInit() { this.cargar(); }

  // ─── Cargar historial ────────────────────────────────────────────────────
  async cargar() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.notify.historial());
      const items: NotificacionDto[] = Array.isArray(res)
        ? res
        : res?.content ?? [];
      this.lista.set(items);
    } catch (e: any) {
      console.error('[notify] cargar historial falló:', e);
      // Si notify aún no está levantado, mantenemos lo que hay (o vacío)
      if (this.lista().length === 0) {
        this.errMsg.set(this.httpError(e, 'GET /api/v1/notificaciones'));
        this.clearMsg(6000);
      }
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Enviar ──────────────────────────────────────────────────────────────
  async enviar() {
    if (!this.email.trim() || !this.mensaje.trim()) {
      this.errMsg.set('El email y el mensaje son obligatorios.');
      this.clearMsg(4000);
      return;
    }

    this.sending.set(true);
    this.okMsg.set(''); this.errMsg.set(''); this.warnMsg.set('');

    const body: EnviarDto = {
      canal:        this.canal,
      destinatario: this.nombre.trim() || this.email.trim(),
      email:        this.email.trim(),
      nombre:       this.nombre.trim() || undefined,
      asunto:       this.asunto.trim() || undefined,
      mensaje:      this.mensaje.trim(),
    };

    try {
      await firstValueFrom(this.notify.enviar(body));
      this.okMsg.set('Notificación enviada al producer. El consumer la procesa en breve.');
      this.limpiar();
      // Refresco automático con delay (consumer asíncrono con RabbitMQ)
      this.warnMsg.set('Actualizando historial en 3 s...');
      setTimeout(() => { this.warnMsg.set(''); this.cargar(); }, 3000);
    } catch (e: any) {
      console.error('[notify] enviar falló:', e);
      const st = e?.status;
      if (e?.name?.includes('Auth') || e?.errorCode || e?.errorMessage) {
        this.errMsg.set(`Error de sesión Azure (${e.errorCode || e.name}): Limpia los datos de sitio en F12 -> Application -> Storage -> Clear site data y vuelve a iniciar sesión.`);
      } else if (!st || st === 0) {
        // notify caído, CORS o fallo antes de enviar HTTP
        this.errMsg.set('No se pudo conectar con notify en ' + this.notifyUrl +
          '. Revisa la consola de F12 (ver [notify] enviar falló).');
      } else {
        this.errMsg.set(this.httpError(e, 'POST /enviar'));
        // En demo local: agregar al listado como simulado
        this.lista.update(l => [{
          ...body,
          id: Date.now(),
          fecha: new Date().toISOString(),
          estado: 'PENDIENTE',
        }, ...l]);
      }
    } finally {
      this.sending.set(false);
      this.clearMsg(7000);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  private limpiar() {
    this.asunto = ''; this.mensaje = '';
  }

  private clearMsg(ms: number) {
    setTimeout(() => { this.okMsg.set(''); this.errMsg.set(''); this.warnMsg.set(''); }, ms);
  }

  private httpError(e: any, ctx: string): string {
    const st = e?.status;
    const msg = e?.error?.message || e?.error || '';
    if (st === 400) return `400 Bad Request en ${ctx}: ${msg || 'Datos inválidos.'}`;
    if (st === 401) return `401 No autorizado en ${ctx}. Verifica el token JWT de Azure.`;
    if (st === 403) return `403 Acceso denegado en ${ctx}. Verifica los roles del token.`;
    if (st === 503) return `503 Servicio no disponible en ${ctx}. RabbitMQ o notify no responden.`;
    return `Error ${st || 'de red'} en ${ctx}. ${msg}`;
  }

  estadoClass(estado?: string): string {
    if (!estado) return 'ENVIADA';
    if (estado.startsWith('SIM'))  return 'SIMULADO';
    return estado;
  }

  fmt(d?: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return d; }
  }
}
