import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Printer, X, ChefHat } from 'lucide-angular';
import { Order } from '../../models/types';
import { KitchenComandaService } from '../../services/kitchen-comanda.service';

@Component({
  selector: 'app-comanda-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="open && order"
         class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
         (click)="onBackdrop($event)">

      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh]
                  overflow-hidden flex flex-col animate-scaleIn">

        <div class="bg-gradient-to-r from-[#2a23b8] to-[#8624ce] text-white px-5 py-3
                    flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <lucide-icon [img]="ChefHat" class="h-5 w-5"></lucide-icon>
            <h2 class="font-bold">Comanda de cocina</h2>
          </div>
          <button (click)="close.emit()"
                  class="p-1 rounded-full hover:bg-white/15 transition-colors"
                  aria-label="Cerrar">
            <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div class="comanda-ticket bg-white mx-auto p-4 shadow"
               [style.maxWidth.px]="320">

            <div class="text-center mb-2">
              <div class="font-bold text-base">RETRO GARAGE</div>
              <div class="font-bold text-sm">COMANDA DE COCINA</div>
            </div>
            <div class="border-t-2 border-black my-2"></div>

            <div class="text-[11px] leading-relaxed">
              <div class="flex justify-between">
                <span class="font-bold">Pedido:</span>
                <span class="font-bold text-base">#{{ order.id.slice(-6) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Fecha:</span><span>{{ formatDate(order.timestamp) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Hora:</span><span>{{ formatTime(order.timestamp) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Tipo:</span><span class="font-bold">{{ formatType(order.orderType) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Cliente:</span><span>{{ order.customer.name || '-' }}</span>
              </div>
              <div *ngIf="order.customer.table" class="flex justify-between">
                <span>Mesa:</span><span class="font-bold">{{ order.customer.table }}</span>
              </div>
              <div *ngIf="order.customer.phone" class="flex justify-between">
                <span>Tel:</span><span>{{ order.customer.phone }}</span>
              </div>
            </div>

            <div class="border-t border-dashed border-black my-2"></div>
            <div class="text-center font-bold text-xs">
              ARTICULOS ({{ totalUnits() }})
            </div>
            <div class="border-t border-dashed border-black my-2"></div>

            <div *ngFor="let item of order.items" class="my-2">
              <div class="flex items-start">
                <span class="font-bold text-sm w-8 flex-shrink-0">{{ item.quantity }}x</span>
                <span class="font-bold text-sm uppercase break-words">{{ item.name }}</span>
              </div>
              <div *ngIf="item.selectedIngredients?.length"
                   class="text-[11px] italic ml-8">
                + {{ item.selectedIngredients?.join(', ') }}
              </div>
              <div *ngIf="item.removedIngredients?.length"
                   class="text-[11px] italic ml-8 line-through">
                SIN: {{ item.removedIngredients?.join(', ') }}
              </div>
            </div>

            <ng-container *ngIf="order.customer.notes">
              <div class="border-t border-dashed border-black my-2"></div>
              <div class="font-bold text-xs mb-1">NOTAS DEL PEDIDO:</div>
              <div class="border border-black p-2 text-[11px]">
                {{ order.customer.notes }}
              </div>
            </ng-container>

            <div class="border-t-2 border-black my-2"></div>
            <div class="text-center text-[10px]">
              -- RETRO GARAGE --
            </div>
          </div>
        </div>

        <div class="flex gap-2 p-4 border-t bg-white">
          <button (click)="close.emit()"
                  class="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700
                         font-medium text-sm hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
          <button (click)="print()"
                  class="flex-1 py-2.5 rounded-xl bg-[#ed450d] hover:bg-[#ed450d]/90
                         text-white font-bold text-sm transition-colors
                         flex items-center justify-center space-x-2">
            <lucide-icon [img]="Printer" class="h-4 w-4"></lucide-icon>
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.94) translateY(6px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }
    .animate-scaleIn { animation: scaleIn 0.18s ease-out both; }
    .comanda-ticket {
      font-family: 'Courier New', monospace;
      color: #000;
    }
  `]
})
export class ComandaModalComponent {
  @Input() open = false;
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();

  Printer = Printer;
  X = X;
  ChefHat = ChefHat;

  constructor(private comandaService: KitchenComandaService) {}

  print() {
    if (!this.order) return;
    this.comandaService.printComanda(this.order);
  }

  totalUnits(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((acc, it) => acc + it.quantity, 0);
  }

  formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('es-ES');
  }

  formatTime(d: Date): string {
    return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatType(type?: Order['orderType']): string {
    switch (type) {
      case 'dine-in-customer':
      case 'dine-in-staff':
        return 'EN MESA';
      case 'delivery':
        return 'A DOMICILIO';
      default:
        return 'EN LOCAL';
    }
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
