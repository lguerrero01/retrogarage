import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Save } from 'lucide-angular';
import { InventoryItem } from '../../models/types';

@Component({
  selector: 'app-inventory-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
         (click)="close.emit()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto animate-scaleIn"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-[#2a23b8] to-[#8624ce] text-white rounded-t-2xl">
          <h2 class="font-extrabold text-lg">{{ item ? 'Editar ítem' : 'Nuevo ítem' }}</h2>
          <button (click)="close.emit()" class="p-1 hover:bg-white/15 rounded-lg press-effect">
            <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="submit()" class="p-5 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
            <input [(ngModel)]="model.name" name="name" required
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors"
              placeholder="Ej. Harina de trigo">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
              <input [(ngModel)]="model.category" name="category"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors"
                placeholder="Ej. Secos">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Unidad</label>
              <input [(ngModel)]="model.unit" name="unit"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors"
                placeholder="kg, L, unidad">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div *ngIf="!item">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Cantidad inicial</label>
              <input [(ngModel)]="model.quantity" name="quantity" type="number" min="0" step="0.01"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
            </div>
            <div [class.col-span-2]="!!item">
              <label class="block text-sm font-semibold text-gray-700 mb-1">Stock mínimo</label>
              <input [(ngModel)]="model.minQuantity" name="minQuantity" type="number" min="0" step="0.01"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
            <textarea [(ngModel)]="model.notes" name="notes" rows="2"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors resize-none"
              placeholder="Proveedor, presentación, etc."></textarea>
          </div>

          <div class="flex gap-3 pt-1">
            <button type="button" (click)="close.emit()"
              class="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 press-effect transition-colors">
              Cancelar
            </button>
            <button type="submit" [disabled]="!model.name.trim() || saving"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-[#2a23b8] hover:bg-[#2a23b8]/90 text-white press-effect transition-colors disabled:opacity-50">
              <lucide-icon [img]="Save" class="h-4 w-4"></lucide-icon>
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class InventoryItemFormComponent implements OnInit {
  @Input() item: InventoryItem | null = null;
  @Output() save = new EventEmitter<Partial<InventoryItem>>();
  @Output() close = new EventEmitter<void>();

  X = X;
  Save = Save;
  saving = false;

  model: Omit<InventoryItem, 'id'> = {
    name: '', category: '', unit: 'unidad',
    quantity: 0, minQuantity: 0, notes: ''
  };

  ngOnInit(): void {
    if (this.item) {
      this.model = {
        name: this.item.name,
        category: this.item.category,
        unit: this.item.unit,
        quantity: this.item.quantity,
        minQuantity: this.item.minQuantity,
        notes: this.item.notes
      };
    }
  }

  submit(): void {
    if (!this.model.name.trim() || this.saving) return;
    this.saving = true;
    const payload: Partial<InventoryItem> = {
      name: this.model.name.trim(),
      category: (this.model.category || '').trim(),
      unit: (this.model.unit || 'unidad').trim(),
      minQuantity: Number(this.model.minQuantity) || 0,
      notes: (this.model.notes || '').trim()
    };
    if (!this.item) payload.quantity = Number(this.model.quantity) || 0;
    this.save.emit(payload);
  }
}
