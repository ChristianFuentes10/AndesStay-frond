import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div>
        <h2 style="margin: 0 0 4px">Reportes y KPIs</h2>
        <p class="muted" style="margin: 0; font-size: 13px">
          Métricas y reportería operativa de AndesStay (Grafana)
        </p>
      </div>
      <a
        [href]="grafanaRawUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn sm ghost"
        style="text-decoration: none"
      >
        Abrir en Grafana ↗
      </a>
    </div>

    <div
      class="card"
      style="padding: 0; overflow: hidden; border-radius: 12px; height: calc(100vh - 170px); background: #111217; border: 1px solid var(--b)"
    >
      <iframe
        [src]="grafanaSafeUrl"
        width="100%"
        height="100%"
        frameborder="0"
        style="display: block; border: none; width: 100%; height: 100%"
        title="Dashboard Grafana KPIs AndesStay"
      ></iframe>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class Reports {
  private sanitizer = inject(DomSanitizer);
  grafanaRawUrl =
    environment.grafanaUrl ||
    'http://localhost:3000/d/andesstay-kpi/andesstay-reporteria-kpi?orgId=1&kiosk';
  grafanaSafeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.grafanaRawUrl);
}

