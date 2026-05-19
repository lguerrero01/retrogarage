import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, Edit } from 'lucide-angular';
import { InventoryItem, InventoryMovement, InventoryMovementType } from '../../models/types';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex justify-end animate-fadeIn" (click)="close.emit()">
      <div class="bg-white w-full max-w-md h-full overflow-y-auto animate-slideInRight flex flex-col"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-[#2a23b8] to-[#8624ce] text-white sticky top-0 z-10">
          <div class="min-w-0">
            <h2 class="font-extrabold text-lg truncate">Historial</h2>
            <p class="text-xs text-white/70 truncate">{{ item ? item.name : 'Todos los ítems' }}</p>
          </div>
          <button (click)="close.emit()" class="p-1 hover:bg-white/15 rounded-lg press-effect">
            <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <div class="p-4 flex gap-2 border-b border-gray-100">
          <input type="date" [(ngModel)]="fromDate" (change)="load()"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
          <select [(ngModel)]="filterType"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
            <option value="all">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
        </div>

        <div class="flex-1 p-4 space-y-2">
          <div *ngIf="loading" class="space-y-2">
            <div class="h-16 skeleton rounded-xl" *ngFor="let _ of [1,2,3,4]"></div>
          </div>

          <div *ngIf="!loading && filtered.length === 0"
               class="text-center text-gray-400 py-16 text-sm">
            Sin movimientos registrados.
          </div>

          <div *ngFor="let m of filtered; let i = index"
               class="flex items-center gap-3 bg-gray-50 rounded-xl p-3 animate-fadeInUp"
               [class]="'stagger-' + (i % 8 + 1)">
            <div class="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" [class]="iconBg(m.type)">
              <lucide-icon [img]="icon(m.type)" class="h-4 w-4 text-white"></lucide-icon>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-800 capitalize">
                {{ m.type }} · {{ m.quantity }}
              </p>
              <p class="text-xs text-gray-400 truncate">{{ m.reason || 'Sin motivo' }}</p>
            </div>
            <span class="text-[11px] text-gray-400 flex-shrink-0">{{ m.createdAt | date:'dd/MM HH:mm' }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryHistoryComponent implements OnInit {
  @Input() item: InventoryItem | null = null;
  @Output() close = new EventEmitter<void>();

  X = X;
  Plus = Plus;
  Minus = Minus;
  Edit = Edit;

  movements: InventoryMovement[] = [];
  loading = true;
  fromDate = '';
  filterType: 'all' | InventoryMovementType = 'all';

  constructor(private inventory: InventoryService) {}

  ngOnInit(): void {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    this.fromDate = d.toISOString().slice(0, 10);
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const from = this.fromDate ? new Date(this.fromDate).toISOString() : undefined;
      this.movements = await this.inventory.getMovements(this.item?.id, from);
    } catch {
      this.movements = [];
    } finally {
      this.loading = false;
    }
  }

  get filtered(): InventoryMovement[] {
    if (this.filterType === 'all') return this.movements;
    return this.movements.filter(m => m.type === this.filterType);
  }

  icon(t: InventoryMovementType) {
    return t === 'entrada' ? this.Plus : t === 'salida' ? this.Minus : this.Edit;
  }

  iconBg(t: InventoryMovementType): string {
    return t === 'entrada' ? 'bg-green-500' : t === 'salida' ? 'bg-[#ed450d]' : 'bg-[#8624ce]';
  }
}
