import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  leaving?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  success(message: string, duration = 3500) { this.show(message, 'success', duration); }
  error(message: string, duration = 4500)   { this.show(message, 'error', duration); }
  info(message: string, duration = 3000)    { this.show(message, 'info', duration); }
  warning(message: string, duration = 3500) { this.show(message, 'warning', duration); }

  private show(message: string, type: Toast['type'], duration: number) {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, message, type };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number) {
    const toasts = this.toastsSubject.value.map(t =>
      t.id === id ? { ...t, leaving: true } : t
    );
    this.toastsSubject.next(toasts);
    setTimeout(() => {
      this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
    }, 300);
  }
}
