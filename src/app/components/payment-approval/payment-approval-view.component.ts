import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LucideAngularModule, CheckCircle, XCircle, Eye, Bike, Store, Receipt } from 'lucide-angular';
import { Order } from '../../models/types';
import { AppService } from '../../services/app.service';
import { OrderSupabaseService } from '../../services/order-supabase.service';
import { PushSubscriptionService } from '../../services/push-subscription.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-payment-approval-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 page-with-bottom-nav">
    <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 animate-fadeInUp">
      <lucide-icon [img]="Receipt" class="h-7 w-7 text-[#2a23b8]"></lucide-icon>
      Pagos por aprobar
      <span *ngIf="pending.length" class="text-sm bg-[#ed450d] text-white rounded-full px-2.5 py-0.5">{{ pending.length }}</span>
    </h1>

    <div *ngIf="pending.length === 0" class="text-center py-20 text-gray-400 animate-fadeIn">
      <lucide-icon [img]="CheckCircle" class="h-12 w-12 mx-auto mb-3 opacity-40"></lucide-icon>
      <p class="font-semibold">No hay pagos pendientes de revisión</p>
    </div>

    <div class="space-y-4 mt-6">
      <div *ngFor="let o of pending; let i = index"
           class="bg-white rounded-2xl shadow-lg p-5 animate-fadeInUp" [class]="'stagger-' + (i % 8 + 1)">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-bold text-gray-900">{{ o.customer.name || 'Cliente' }}</p>
            <p class="text-xs text-gray-400">{{ o.customer.phone }} · #{{ o.id.slice(0, 8) }}</p>
            <p class="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <lucide-icon [img]="o.orderType === 'delivery' ? Bike : Store" class="h-4 w-4"></lucide-icon>
              {{ o.orderType === 'delivery' ? 'A domicilio' : 'En el local' }}
              <span *ngIf="o.orderType === 'delivery' && o.deliveryAddress" class="text-gray-400 truncate">
                — {{ o.deliveryAddress.address }}
              </span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-xl font-extrabold text-[#ed450d]">\${{ o.total.toFixed(2) }}</p>
            <p class="text-xs text-gray-400">Ref: {{ o.paymentReference || '—' }}</p>
          </div>
        </div>

        <div class="mt-3 text-sm text-gray-500">{{ o.items.length }} ítem(s)</div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button (click)="viewProof(o)"
            class="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm press-effect transition-colors">
            <lucide-icon [img]="Eye" class="h-4 w-4"></lucide-icon> Ver comprobante
          </button>
          <button (click)="approve(o)" [disabled]="busyId === o.id"
            class="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm press-effect transition-colors disabled:opacity-50">
            <lucide-icon [img]="CheckCircle" class="h-4 w-4"></lucide-icon> Aprobar
          </button>
          <button (click)="reject(o)" [disabled]="busyId === o.id"
            class="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm press-effect transition-colors disabled:opacity-50">
            <lucide-icon [img]="XCircle" class="h-4 w-4"></lucide-icon> Rechazar
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Visor de comprobante -->
  <div *ngIf="proofUrl" class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fadeIn"
       (click)="proofUrl = null">
    <img [src]="proofUrl" class="max-h-[90vh] max-w-full rounded-xl animate-scaleIn" (click)="$event.stopPropagation()">
  </div>
  `
})
export class PaymentApprovalViewComponent implements OnInit, OnDestroy {
  CheckCircle = CheckCircle; XCircle = XCircle; Eye = Eye;
  Bike = Bike; Store = Store; Receipt = Receipt;

  pending: Order[] = [];
  proofUrl: string | null = null;
  busyId: string | null = null;

  private subs: Subscription[] = [];

  constructor(
    private app: AppService,
    private orderSvc: OrderSupabaseService,
    private push: PushSubscriptionService,
    private toast: ToastService,
    private confirm: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.subs.push(this.app.orders$.subscribe(list => {
      this.pending = list
        .filter(o => o.paymentStatus === 'in-review')
        .sort((a, b) => +a.timestamp - +b.timestamp);
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  async viewProof(o: Order): Promise<void> {
    if (!o.paymentProofUrl) { this.toast.warning('Sin comprobante'); return; }
    try {
      const url = await this.orderSvc.getProofSignedUrl(o.paymentProofUrl);
      if (url) this.proofUrl = url;
      else this.toast.error('No se pudo abrir el comprobante');
    } catch {
      this.toast.error('No se pudo abrir el comprobante');
    }
  }

  async approve(o: Order): Promise<void> {
    this.busyId = o.id;
    try {
      await this.orderSvc.approvePayment(o.id);
      this.push.sendToChefs(o.id, o.customer.name).catch(() => {});
      this.toast.success('Pago aprobado — enviado a cocina');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'No se pudo aprobar');
    } finally {
      this.busyId = null;
    }
  }

  async reject(o: Order): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Rechazar pago',
      message: `¿Rechazar el pago de ${o.customer.name || 'este cliente'}? Podrá reenviar el comprobante.`,
      confirmText: 'Rechazar', cancelText: 'Cancelar', danger: true
    });
    if (!ok) return;
    this.busyId = o.id;
    try {
      await this.orderSvc.rejectPayment(o.id);
      this.toast.success('Pago rechazado');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'No se pudo rechazar');
    } finally {
      this.busyId = null;
    }
  }
}
