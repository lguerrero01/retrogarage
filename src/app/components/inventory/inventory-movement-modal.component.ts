import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, Edit } from 'lucide-angular';
import { InventoryItem, InventoryMovementType } from '../../models/types';

@Component({
  selector: 'app-inventory-movement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
         (click)="close.emit()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-[#2a23b8] to-[#8624ce] text-white rounded-t-2xl">
          <div class="min-w-0">
            <h2 class="font-extrabold text-lg truncate">Registrar movimiento</h2>
            <p class="text-xs text-white/70 truncate">{{ item.name }} · {{ item.quantity }} {{ item.unit }}</p>
          </div>
          <button (click)="close.emit()" class="p-1 hover:bg-white/15 rounded-lg press-effect">
            <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid grid-cols-3 gap-2">
            <button (click)="type = 'entrada'" [class]="tabClass('entrada', 'green')"
              class="flex flex-col items-center gap-1 py-3 rounded-xl font-semibold text-sm press-effect transition-all">
              <lucide-icon [img]="Plus" class="h-5 w-5"></lucide-icon> Entrada
            </button>
            <button (click)="type = 'salida'" [class]="tabClass('salida', 'orange')"
              class="flex flex-col items-center gap-1 py-3 rounded-xl font-semibold text-sm press-effect transition-all">
              <lucide-icon [img]="Minus" class="h-5 w-5"></lucide-icon> Salida
            </button>
            <button (click)="type = 'ajuste'" [class]="tabClass('ajuste', 'purple')"
              class="flex flex-col items-center gap-1 py-3 rounded-xl font-semibold text-sm press-effect transition-all">
              <lucide-icon [img]="Edit" class="h-5 w-5"></lucide-icon> Ajuste
            </button>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">
              {{ type === 'ajuste' ? 'Cantidad final' : 'Cantidad' }} ({{ item.unit }})
            </label>
            <input [(ngModel)]="quantity" type="number" min="0" step="0.01"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
            <p *ngIf="type !== 'ajuste'" class="text-xs text-gray-400 mt-1">
              Quedará en: <strong>{{ projected }} {{ item.unit }}</strong>
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Motivo</label>
            <input [(ngModel)]="reason"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors"
              placeholder="Compra, merma, conteo físico...">
          </div>

          <div class="flex gap-3 pt-1">
            <button (click)="close.emit()"
              class="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 press-effect transition-colors">
              Cancelar
            </button>
            <button (click)="submit()" [disabled]="!valid || saving"
              class="flex-1 py-3 rounded-xl font-semibold bg-[#2a23b8] hover:bg-[#2a23b8]/90 text-white press-effect transition-colors disabled:opacity-50">
              {{ saving ? 'Guardando...' : 'Registrar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryMovementModalComponent {
  @Input() item!: InventoryItem;
  @Input() set initialType(t: InventoryMovementType | null) {
    if (t) this.type = t;
  }
  @Output() submitMovement = new EventEmitter<{ type: InventoryMovementType; quantity: number; reason: string }>();
  @Output() close = new EventEmitter<void>();

  X = X;
  Plus = Plus;
  Minus = Minus;
  Edit = Edit;

  type: InventoryMovementType = 'entrada';
  quantity: number | null = null;
  reason = '';
  saving = false;

  get valid(): boolean {
    return this.quantity !== null && Number(this.quantity) >= 0 &&
      !(this.type !== 'ajuste' && Number(this.quantity) <= 0);
  }

  get projected(): number {
    const q = Number(this.quantity) || 0;
    if (this.type === 'entrada') return this.item.quantity + q;
    if (this.type === 'salida') return this.item.quantity - q;
    return q;
  }

  tabClass(t: InventoryMovementType, color: 'green' | 'orange' | 'purple'): string {
    if (this.type !== t) return 'bg-gray-100 text-gray-500';
    return color === 'green' ? 'bg-green-500 text-white'
      : color === 'orange' ? 'bg-[#ed450d] text-white'
      : 'bg-[#8624ce] text-white';
  }

  submit(): void {
    if (!this.valid || this.saving) return;
    this.saving = true;
    this.submitMovement.emit({
      type: this.type,
      quantity: Number(this.quantity),
      reason: this.reason.trim()
    });
  }
}
