import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
       (click)="dismiss()">
    <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto animate-slideInUp sm:animate-scaleIn"
         (click)="$event.stopPropagation()">

      <div class="bg-gradient-to-br from-[#2a23b8] to-[#8624ce] text-white px-6 py-5 relative">
        <button (click)="dismiss()" class="absolute top-3 right-3 p-1.5 hover:bg-white/15 rounded-lg press-effect">
          <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
        </button>
        <h2 class="text-2xl font-extrabold">{{ tab === 'login' ? 'Bienvenido' : 'Crea tu cuenta' }}</h2>
        <p class="text-white/70 text-sm mt-0.5">
          {{ tab === 'login' ? 'Ingresa para continuar tu pedido' : 'Ordena delivery o para comer en el local' }}
        </p>
      </div>

      <div class="flex border-b">
        <button (click)="tab = 'login'"
          class="flex-1 py-3 text-sm font-bold transition-colors"
          [class]="tab === 'login' ? 'text-[#2a23b8] border-b-2 border-[#2a23b8]' : 'text-gray-400'">
          Ingresar
        </button>
        <button (click)="tab = 'signup'"
          class="flex-1 py-3 text-sm font-bold transition-colors"
          [class]="tab === 'signup' ? 'text-[#2a23b8] border-b-2 border-[#2a23b8]' : 'text-gray-400'">
          Crear cuenta
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
          {{ error }}
        </div>
        <div *ngIf="info" class="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2.5 text-sm">
          {{ info }}
        </div>

        <ng-container *ngIf="tab === 'signup'">
          <div class="relative">
            <lucide-icon [img]="User" class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
            <input [(ngModel)]="name" placeholder="Nombre completo"
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
          </div>
          <div class="relative">
            <lucide-icon [img]="Phone" class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
            <input [(ngModel)]="phone" placeholder="Teléfono" inputmode="tel"
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
          </div>
        </ng-container>

        <div class="relative">
          <lucide-icon [img]="Mail" class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
          <input [(ngModel)]="email" type="email" placeholder="Correo electrónico" autocomplete="email"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
        </div>

        <div class="relative">
          <lucide-icon [img]="Lock" class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
          <input [(ngModel)]="password" [type]="showPwd ? 'text' : 'password'" placeholder="Contraseña"
            class="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
          <button (click)="showPwd = !showPwd" type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <lucide-icon [img]="showPwd ? EyeOff : Eye" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <button (click)="submit()" [disabled]="loading"
          class="w-full bg-[#ed450d] hover:bg-[#ed450d]/90 text-white py-3.5 rounded-xl font-bold press-effect transition-colors disabled:opacity-60">
          {{ loading ? 'Procesando...' : (tab === 'login' ? 'Ingresar' : 'Crear cuenta') }}
        </button>

        <p class="text-center text-xs text-gray-400">
          {{ tab === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}
          <button (click)="switchTab()" class="text-[#2a23b8] font-bold ml-1">
            {{ tab === 'login' ? 'Crear cuenta' : 'Ingresar' }}
          </button>
        </p>
      </div>
    </div>
  </div>
  `
})
export class AuthModalComponent {
  X = X; Mail = Mail; Lock = Lock; User = User; Phone = Phone; Eye = Eye; EyeOff = EyeOff;

  tab: 'login' | 'signup' = 'login';
  name = '';
  phone = '';
  email = '';
  password = '';
  showPwd = false;
  loading = false;
  error = '';
  info = '';

  constructor(private auth: AuthService, private toast: ToastService) {}

  switchTab(): void {
    this.tab = this.tab === 'login' ? 'signup' : 'login';
    this.error = '';
    this.info = '';
  }

  dismiss(): void {
    this.auth.closeLoginModal();
  }

  async submit(): Promise<void> {
    this.error = '';
    this.info = '';
    if (!this.email.trim() || !this.password) {
      this.error = 'Completa correo y contraseña';
      return;
    }
    this.loading = true;
    try {
      if (this.tab === 'login') {
        const ok = await this.auth.login(this.email.trim(), this.password);
        if (!ok) { this.error = 'Credenciales inválidas'; return; }
        this.toast.success('Sesión iniciada');
        this.auth.closeLoginModal();
      } else {
        if (!this.name.trim()) { this.error = 'Ingresa tu nombre'; return; }
        const res = await this.auth.signUp(this.email.trim(), this.password, this.name.trim(), this.phone.trim());
        if (!res.ok) { this.error = res.error ?? 'No se pudo crear la cuenta'; return; }
        if (res.needsConfirmation) {
          this.info = 'Cuenta creada. Revisa tu correo para confirmarla y luego ingresa.';
          this.tab = 'login';
        } else {
          this.toast.success('¡Cuenta creada!');
          this.auth.closeLoginModal();
        }
      }
    } catch (e: any) {
      this.error = e?.message ?? 'Ocurrió un error';
    } finally {
      this.loading = false;
    }
  }
}
