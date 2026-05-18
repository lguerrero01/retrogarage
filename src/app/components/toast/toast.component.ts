import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-angular';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed top-16 right-3 left-3 sm:left-auto sm:w-80 z-[200] space-y-2 pointer-events-none">
      <div *ngFor="let t of (toastService.toasts$ | async)"
           [class]="toastClass(t)"
           class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium cursor-pointer"
           (click)="toastService.dismiss(t.id)">
        <lucide-icon [img]="iconFor(t.type)" class="h-5 w-5 flex-shrink-0"></lucide-icon>
        <span class="flex-1 leading-snug">{{t.message}}</span>
        <lucide-icon [img]="X" class="h-4 w-4 flex-shrink-0 opacity-50"></lucide-icon>
      </div>
    </div>
  `
})
export class ToastComponent {
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Info = Info;
  AlertTriangle = AlertTriangle;
  X = X;

  constructor(public toastService: ToastService) {}

  toastClass(t: Toast): string {
    const base = t.leaving ? 'animate-toastOut' : 'animate-toastIn';
    const colors: Record<Toast['type'], string> = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error:   'bg-red-50 border-red-200 text-red-800',
      info:    'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800'
    };
    return `${base} ${colors[t.type]}`;
  }

  iconFor(type: Toast['type']) {
    const map: Record<Toast['type'], any> = {
      success: this.CheckCircle,
      error:   this.XCircle,
      info:    this.Info,
      warning: this.AlertTriangle
    };
    return map[type];
  }
}
