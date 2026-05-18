import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface DialogState extends ConfirmDialogOptions {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private stateSubject = new BehaviorSubject<DialogState | null>(null);
  dialog$ = this.stateSubject.asObservable();

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.stateSubject.next({ ...options, resolve });
    });
  }

  respond(result: boolean): void {
    this.stateSubject.value?.resolve(result);
    this.stateSubject.next(null);
  }
}
