import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '../core/store';
import { Auth } from '../core/auth';
@Component({ selector: 'app-login', standalone: true, imports: [FormsModule], styles: [`
.wrap{min-height:100vh;display:grid;grid-template-columns:1fr 420px;background:linear-gradient(#0b1210cc,#0b1210ee),url('https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1600&q=70') center/cover}
.hero{display:grid;place-content:center;text-align:center;gap:10px;padding:30px}.hero .logo{font-size:40px}
.box{background:#0d1512ee;border-left:1px solid var(--b);padding:48px 34px;display:grid;align-content:center;gap:14px}
.or{text-align:center;color:var(--m);font-size:12px}.soc{display:grid;grid-template-columns:1fr 1fr;gap:10px}.soc .ms{grid-column:1/-1}
@media(max-width:800px){.wrap{grid-template-columns:1fr}.hero{display:none}}`], template: `
<div class="wrap"><div class="hero"><div class="logo">🏔️ Andes<b>Stay</b></div><p class="muted">Tu próxima escapada,<br>más cerca de lo que imaginas.</p></div>
<form class="box" (ngSubmit)="go()">
 <h2>{{reg()?'Crear cuenta':'Iniciar sesión'}}</h2><p class="muted">{{reg()?'Regístrate para reservar':'Accede a tu cuenta para continuar'}}</p>
 @if(reg()){<input class="inp" name="n" [(ngModel)]="name" placeholder="Nombre completo" required>}
 <input class="inp" name="e" type="email" [(ngModel)]="email" placeholder="Correo electrónico o usuario" required>
 <input class="inp" name="p" type="password" [(ngModel)]="pass" placeholder="Contraseña" required>
 <div class="row sp"><label class="row muted"><input type="checkbox" checked> Recordarme</label><a class="green" href="#" (click)="$event.preventDefault()">¿Olvidaste tu contraseña?</a></div>
 @if(err()||a.error()){<div style="color:var(--r)">{{err()||a.error()}}</div>}
 <button class="btn">{{reg()?'Registrarme':'Iniciar sesión'}}</button>
 <div class="or">o continúa con</div>
 <div class="soc"><button type="button" class="btn ghost" (click)="social('google@correo.cl')">Google</button><button type="button" class="btn ghost" (click)="social('apple@correo.cl')">Apple</button><button type="button" class="btn ghost ms" (click)="microsoft()">Microsoft (cuenta AndesStay)</button></div>
 <p class="or">{{reg()?'¿Ya tienes cuenta?':'¿No tienes una cuenta?'}} <a class="green" href="#" (click)="$event.preventDefault();reg.set(!reg())">{{reg()?'Inicia sesión':'Regístrate'}}</a></p>
 <p class="or">Demo: usa «admin&#64;andesstay.cl» para entrar como administrador</p>
</form></div>`})
export class Login {
  s = inject(Store); r = inject(Router); a = inject(Auth); email = ''; pass = ''; name = ''; reg = signal(false); err = signal('');
  constructor() { const u = this.s.user(); if (u) this.r.navigate([u.role === 'admin' ? '/admin' : '/']); }
  go() { if (this.pass.length < 4) { this.err.set('La contraseña debe tener al menos 4 caracteres'); return; } this.done(this.email, this.name); }
  social(e: string) { this.done(e); }
  microsoft() { this.err.set(''); this.a.login(this.email.trim() || undefined); }
  done(e: string, n?: string) { const u = this.s.login(e, n || undefined); this.r.navigate([u.role === 'admin' ? '/admin' : '/']); }
}
