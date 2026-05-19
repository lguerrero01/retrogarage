import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LucideAngularModule, User, MapPin, Plus, Trash2, Edit, Save, LogOut } from 'lucide-angular';
import { CustomerAddress } from '../../models/types';
import { AuthService } from '../../services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-6 page-with-bottom-nav space-y-6">
    <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 animate-fadeInUp">
      <lucide-icon [img]="User" class="h-7 w-7 text-[#2a23b8]"></lucide-icon>
      Mi cuenta
    </h1>

    <!-- Perfil -->
    <div class="bg-white rounded-2xl shadow-lg p-5 animate-fadeInUp stagger-1">
      <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Perfil</p>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
      <div class="flex gap-2">
        <input [(ngModel)]="name"
          class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
        <button (click)="saveName()" [disabled]="savingName || !name.trim()"
          class="flex items-center gap-1.5 bg-[#2a23b8] hover:bg-[#2a23b8]/90 text-white px-4 rounded-lg font-semibold press-effect disabled:opacity-50">
          <lucide-icon [img]="Save" class="h-4 w-4"></lucide-icon>
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-2">{{ email }}</p>
    </div>

    <!-- Direcciones -->
    <div class="bg-white rounded-2xl shadow-lg p-5 animate-fadeInUp stagger-2">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Direcciones de entrega</p>
        <button (click)="startAdd()" class="flex items-center gap-1 text-sm font-semibold text-[#2a23b8]">
          <lucide-icon [img]="Plus" class="h-4 w-4"></lucide-icon> Agregar
        </button>
      </div>

      <div *ngIf="addresses.length === 0 && !editing" class="text-sm text-gray-400 py-4 text-center">
        No tienes direcciones guardadas
      </div>

      <div class="space-y-2">
        <div *ngFor="let a of addresses"
             class="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
          <lucide-icon [img]="MapPin" class="h-4 w-4 text-[#ed450d] mt-0.5 flex-shrink-0"></lucide-icon>
          <div class="min-w-0 flex-1 text-sm">
            <p class="font-semibold text-gray-800">
              {{ a.label || 'Dirección' }}
              <span *ngIf="a.isDefault" class="ml-1 text-[10px] bg-[#2a23b8] text-white px-1.5 py-0.5 rounded-full">Principal</span>
            </p>
            <p class="text-gray-500">{{ a.address }}</p>
            <p *ngIf="a.reference" class="text-gray-400 text-xs">{{ a.reference }}</p>
          </div>
          <button (click)="startEdit(a)" class="p-1.5 text-gray-400 hover:text-gray-700"><lucide-icon [img]="Edit" class="h-4 w-4"></lucide-icon></button>
          <button (click)="del(a)" class="p-1.5 text-red-400 hover:text-red-600"><lucide-icon [img]="Trash2" class="h-4 w-4"></lucide-icon></button>
        </div>
      </div>

      <div *ngIf="editing" class="mt-3 space-y-2 border-t border-gray-100 pt-3">
        <input [(ngModel)]="form.label" placeholder="Etiqueta (Casa, Trabajo...)"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
        <input [(ngModel)]="form.address" placeholder="Dirección completa"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
        <input [(ngModel)]="form.reference" placeholder="Punto de referencia"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
        <input [(ngModel)]="form.phone" placeholder="Teléfono de contacto"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
        <label class="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" [(ngModel)]="form.isDefault" class="accent-[#ed450d]"> Marcar como principal
        </label>
        <div class="flex gap-2">
          <button (click)="editing = false" class="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold press-effect">Cancelar</button>
          <button (click)="saveAddress()" [disabled]="!form.address.trim()"
            class="flex-1 py-2.5 rounded-lg bg-[#2a23b8] text-white font-semibold press-effect disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>

    <button (click)="logout()"
      class="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-semibold press-effect transition-colors animate-fadeInUp stagger-3">
      <lucide-icon [img]="LogOut" class="h-4 w-4"></lucide-icon> Cerrar sesión
    </button>
  </div>
  `
})
export class AccountViewComponent implements OnInit, OnDestroy {
  User = User; MapPin = MapPin; Plus = Plus; Trash2 = Trash2; Edit = Edit; Save = Save; LogOut = LogOut;

  name = '';
  email = '';
  savingName = false;
  addresses: CustomerAddress[] = [];
  editing = false;
  editId: string | null = null;
  form = { label: '', address: '', reference: '', phone: '', isDefault: false };

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private customerSvc: CustomerService,
    private toast: ToastService,
    private confirm: ConfirmDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    this.name = u?.name ?? '';
    this.email = u?.email ?? '';
    this.subs.push(this.customerSvc.addresses$.subscribe(a => (this.addresses = a)));
    this.customerSvc.loadAddresses().catch(() => {});
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  async saveName(): Promise<void> {
    if (!this.name.trim()) return;
    this.savingName = true;
    try {
      await this.auth.updateName(this.name.trim());
      this.toast.success('Nombre actualizado');
    } catch {
      this.toast.error('No se pudo actualizar');
    } finally {
      this.savingName = false;
    }
  }

  startAdd(): void {
    this.editId = null;
    this.form = { label: '', address: '', reference: '', phone: '', isDefault: this.addresses.length === 0 };
    this.editing = true;
  }

  startEdit(a: CustomerAddress): void {
    this.editId = a.id;
    this.form = { label: a.label, address: a.address, reference: a.reference, phone: a.phone, isDefault: a.isDefault };
    this.editing = true;
  }

  async saveAddress(): Promise<void> {
    if (!this.form.address.trim()) return;
    try {
      if (this.editId) {
        await this.customerSvc.updateAddress(this.editId, this.form);
      } else {
        await this.customerSvc.addAddress(this.form);
      }
      this.toast.success('Dirección guardada');
      this.editing = false;
    } catch {
      this.toast.error('No se pudo guardar la dirección');
    }
  }

  async del(a: CustomerAddress): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar dirección',
      message: `¿Eliminar "${a.label || a.address}"?`,
      confirmText: 'Eliminar', cancelText: 'Cancelar', danger: true
    });
    if (!ok) return;
    try {
      await this.customerSvc.deleteAddress(a.id);
      this.toast.success('Dirección eliminada');
    } catch {
      this.toast.error('No se pudo eliminar');
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/menu']);
  }
}
