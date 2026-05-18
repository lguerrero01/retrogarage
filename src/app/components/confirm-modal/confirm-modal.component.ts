import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmDialogService, ConfirmDialogOptions } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="dialog"
         class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
         (click)="onBackdrop($event)">

      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <!-- Card -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden
                  animate-scaleIn">

        <!-- Top accent bar -->
        <div [class]="'h-1.5 w-full ' + (dialog.danger ? 'bg-red-500' : 'bg-[#2a23b8]')"></div>

        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-2">{{ dialog.title }}</h2>
          <p class="text-sm text-gray-600 leading-relaxed">{{ dialog.message }}</p>
        </div>

        <div class="flex gap-3 px-6 pb-6">
          <button
            (click)="respond(false)"
            class="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700
                   font-medium text-sm hover:bg-gray-50 transition-colors">
            {{ dialog.cancelText || 'Cancelar' }}
          </button>
          <button
            (click)="respond(true)"
            [class]="'flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-colors ' +
                     (dialog.danger
                       ? 'bg-red-500 hover:bg-red-600'
                       : 'bg-[#2a23b8] hover:bg-[#2a23b8]/90')">
            {{ dialog.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92) translateY(8px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);   }
    }
    .animate-scaleIn { animation: scaleIn 0.18s ease-out both; }
  `]
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  dialog: ConfirmDialogOptions | null = null;
  private sub!: Subscription;

  constructor(private confirmService: ConfirmDialogService) {}

  ngOnInit() {
    this.sub = this.confirmService.dialog$.subscribe(state => {
      this.dialog = state;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  respond(result: boolean) {
    this.confirmService.respond(result);
  }

  onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.confirmService.respond(false);
    }
  }
}
