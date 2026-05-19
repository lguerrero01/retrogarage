import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, Minus, Edit, Trash2, History, AlertTriangle } from 'lucide-angular';
import { InventoryItem } from '../../models/types';

@Component({
  selector: 'app-inventory-item-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-lift">
      <div class="h-1.5" [class]="accentClass"></div>

      <div class="p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-extrabold text-gray-900 truncate">{{ item.name }}</h3>
            <p class="text-xs text-gray-400 font-medium mt-0.5">
              {{ item.category || 'Sin categoría' }}
            </p>
          </div>
          <span class="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full" [class]="badgeClass">
            {{ statusLabel }}
          </span>
        </div>

        <div class="mt-4 flex items-end gap-1.5">
          <span class="text-3xl font-extrabold text-gray-900 leading-none">{{ item.quantity }}</span>
          <span class="text-sm text-gray-400 font-medium mb-0.5">{{ item.unit }}</span>
        </div>
        <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <lucide-icon *ngIf="isLow" [img]="AlertTriangle" class="h-3.5 w-3.5 text-[#ed450d]"></lucide-icon>
          Mínimo: {{ item.minQuantity }} {{ item.unit }}
        </p>

        <p *ngIf="item.notes" class="text-xs text-gray-500 mt-2 line-clamp-2">{{ item.notes }}</p>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <button (click)="movement.emit('entrada')"
            class="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="Plus" class="h-4 w-4"></lucide-icon> Entrada
          </button>
          <button (click)="movement.emit('salida')"
            class="flex items-center justify-center gap-1.5 bg-[#ed450d] hover:bg-[#ed450d]/90 text-white text-sm font-semibold py-2.5 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="Minus" class="h-4 w-4"></lucide-icon> Salida
          </button>
        </div>

        <div class="mt-2 flex items-center gap-2">
          <button (click)="history.emit()"
            class="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="History" class="h-4 w-4"></lucide-icon> Historial
          </button>
          <button *ngIf="isAdmin" (click)="edit.emit()" title="Editar"
            class="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="Edit" class="h-4 w-4"></lucide-icon>
          </button>
          <button *ngIf="isAdmin" (click)="remove.emit()" title="Eliminar"
            class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl press-effect transition-colors">
            <lucide-icon [img]="Trash2" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class InventoryItemCardComponent {
  @Input() item!: InventoryItem;
  @Input() isAdmin = false;

  @Output() movement = new EventEmitter<'entrada' | 'salida'>();
  @Output() edit = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
  @Output() history = new EventEmitter<void>();

  Plus = Plus;
  Minus = Minus;
  Edit = Edit;
  Trash2 = Trash2;
  History = History;
  AlertTriangle = AlertTriangle;

  get isOut(): boolean {
    return this.item.quantity <= 0;
  }

  get isLow(): boolean {
    return !this.isOut && this.item.quantity <= this.item.minQuantity;
  }

  get statusLabel(): string {
    if (this.isOut) return 'Agotado';
    if (this.isLow) return 'Bajo';
    return 'En stock';
  }

  get badgeClass(): string {
    if (this.isOut) return 'bg-red-500 text-white';
    if (this.isLow) return 'bg-[#fac20a] text-[#2a23b8]';
    return 'bg-green-500 text-white';
  }

  get accentClass(): string {
    if (this.isOut) return 'bg-red-500';
    if (this.isLow) return 'bg-[#fac20a]';
    return 'bg-green-500';
  }
}
