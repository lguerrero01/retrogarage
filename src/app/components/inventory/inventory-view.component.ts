import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Plus, Search, Boxes, AlertTriangle, History, PackageX } from 'lucide-angular';
import { InventoryItem, InventoryMovementType } from '../../models/types';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { InventoryItemCardComponent } from './inventory-item-card.component';
import { InventoryItemFormComponent } from './inventory-item-form.component';
import { InventoryMovementModalComponent } from './inventory-movement-modal.component';
import { InventoryHistoryComponent } from './inventory-history.component';
import { SkeletonCardComponent } from '../skeleton/skeleton-card.component';

@Component({
  selector: 'app-inventory-view',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    InventoryItemCardComponent, InventoryItemFormComponent,
    InventoryMovementModalComponent, InventoryHistoryComponent, SkeletonCardComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-with-bottom-nav">

      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeInUp">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <lucide-icon [img]="Boxes" class="h-7 w-7 text-[#2a23b8]"></lucide-icon>
            Inventario
          </h1>
          <p class="text-sm text-gray-400 mt-0.5">Gestión de insumos y existencias</p>
        </div>
        <div class="flex gap-2">
          <button (click)="openHistory(null)"
            class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="History" class="h-4 w-4"></lucide-icon>
            <span class="hidden sm:inline">Historial</span>
          </button>
          <button *ngIf="isAdmin" (click)="openForm(null)"
            class="flex items-center gap-2 bg-[#2a23b8] hover:bg-[#2a23b8]/90 text-white font-semibold px-4 py-2.5 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="Plus" class="h-4 w-4"></lucide-icon>
            Nuevo ítem
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-3 gap-3 mt-6 animate-fadeInUp stagger-1">
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide">Ítems</p>
          <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ items.length }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
            <lucide-icon [img]="AlertTriangle" class="h-3.5 w-3.5 text-[#fac20a]"></lucide-icon> Bajo
          </p>
          <p class="text-2xl font-extrabold text-[#ed450d] mt-1">{{ lowCount }}</p>
        </div>
        <div class="bg-white rounded-2xl shadow p-4">
          <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
            <lucide-icon [img]="PackageX" class="h-3.5 w-3.5 text-red-500"></lucide-icon> Agotados
          </p>
          <p class="text-2xl font-extrabold text-red-500 mt-1">{{ outCount }}</p>
        </div>
      </div>

      <!-- Búsqueda + filtro -->
      <div class="flex flex-col sm:flex-row gap-3 mt-6 animate-fadeInUp stagger-2">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <lucide-icon [img]="Search" class="h-5 w-5 text-gray-400"></lucide-icon>
          </div>
          <input [(ngModel)]="search" placeholder="Buscar ítem..."
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
        </div>
        <select [(ngModel)]="categoryFilter"
          class="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
          <option value="">Todas las categorías</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
      </div>

      <!-- Cargando -->
      <div *ngIf="!loaded" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        <app-skeleton-card *ngFor="let _ of [1,2,3,4,5,6]" imageHeight="h-2" [showActions]="true" [showSecondAction]="true"></app-skeleton-card>
      </div>

      <!-- Vacío -->
      <div *ngIf="loaded && filtered.length === 0"
           class="text-center py-20 text-gray-400 animate-fadeIn">
        <lucide-icon [img]="Boxes" class="h-12 w-12 mx-auto mb-3 opacity-40"></lucide-icon>
        <p class="font-semibold">{{ items.length === 0 ? 'Aún no hay ítems en el inventario' : 'Sin resultados' }}</p>
      </div>

      <!-- Grid -->
      <div *ngIf="loaded && filtered.length > 0"
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        <div *ngFor="let item of filtered; let i = index"
             class="animate-fadeInUp" [class]="'stagger-' + (i % 8 + 1)">
          <app-inventory-item-card
            [item]="item" [isAdmin]="isAdmin"
            (movement)="openMovement(item, $event)"
            (edit)="openForm(item)"
            (remove)="confirmDelete(item)"
            (history)="openHistory(item)">
          </app-inventory-item-card>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <app-inventory-item-form *ngIf="showForm"
      [item]="editing"
      (save)="saveItem($event)"
      (close)="showForm = false">
    </app-inventory-item-form>

    <app-inventory-movement-modal *ngIf="movementItem"
      [item]="movementItem"
      [initialType]="movementType"
      (submitMovement)="saveMovement($event)"
      (close)="movementItem = null">
    </app-inventory-movement-modal>

    <app-inventory-history *ngIf="showHistory"
      [item]="historyItem"
      (close)="showHistory = false">
    </app-inventory-history>
  `
})
export class InventoryViewComponent implements OnInit, OnDestroy {
  Plus = Plus;
  Search = Search;
  Boxes = Boxes;
  AlertTriangle = AlertTriangle;
  History = History;
  PackageX = PackageX;

  items: InventoryItem[] = [];
  loaded = false;
  isAdmin = false;

  search = '';
  categoryFilter = '';

  showForm = false;
  editing: InventoryItem | null = null;

  movementItem: InventoryItem | null = null;
  movementType: InventoryMovementType | null = null;

  showHistory = false;
  historyItem: InventoryItem | null = null;

  private subs: Subscription[] = [];

  constructor(
    private inventory: InventoryService,
    private auth: AuthService,
    private toast: ToastService,
    private confirm: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.auth.canAccessAdmin();
    this.inventory.start();
    this.subs.push(this.inventory.items$.subscribe(i => (this.items = i)));
    this.subs.push(this.inventory.loaded$.subscribe(l => (this.loaded = l)));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get categories(): string[] {
    return [...new Set(this.items.map(i => i.category).filter(Boolean))].sort();
  }

  get filtered(): InventoryItem[] {
    const q = this.search.trim().toLowerCase();
    return this.items.filter(i =>
      (!q || i.name.toLowerCase().includes(q)) &&
      (!this.categoryFilter || i.category === this.categoryFilter)
    );
  }

  get lowCount(): number {
    return this.items.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length;
  }

  get outCount(): number {
    return this.items.filter(i => i.quantity <= 0).length;
  }

  openForm(item: InventoryItem | null): void {
    this.editing = item;
    this.showForm = true;
  }

  async saveItem(payload: Partial<InventoryItem>): Promise<void> {
    try {
      if (this.editing) {
        await this.inventory.updateItem(this.editing.id, payload);
        this.toast.success('Ítem actualizado');
      } else {
        await this.inventory.createItem(payload as Omit<InventoryItem, 'id'>);
        this.toast.success('Ítem creado');
      }
      this.showForm = false;
    } catch (e: any) {
      this.toast.error(e?.message ?? 'No se pudo guardar');
    }
  }

  openMovement(item: InventoryItem, type: 'entrada' | 'salida'): void {
    this.movementType = type;
    this.movementItem = item;
  }

  async saveMovement(ev: { type: InventoryMovementType; quantity: number; reason: string }): Promise<void> {
    if (!this.movementItem) return;
    try {
      await this.inventory.addMovement(this.movementItem.id, ev.type, ev.quantity, ev.reason);
      this.toast.success('Movimiento registrado');
      this.movementItem = null;
    } catch (e: any) {
      this.toast.error(e?.message ?? 'No se pudo registrar');
    }
  }

  openHistory(item: InventoryItem | null): void {
    this.historyItem = item;
    this.showHistory = true;
  }

  async confirmDelete(item: InventoryItem): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar ítem',
      message: `¿Eliminar "${item.name}" del inventario? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    try {
      await this.inventory.deleteItem(item.id);
      this.toast.success('Ítem eliminado');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'No se pudo eliminar');
    }
  }
}
