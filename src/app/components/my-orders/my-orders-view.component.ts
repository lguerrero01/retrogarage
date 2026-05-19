import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Clock, CheckCircle, XCircle, Bike, Store, Upload, ClipboardList } from 'lucide-angular';
import { Order } from '../../models/types';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { OrderSupabaseService } from '../../services/order-supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-orders-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 page-with-bottom-nav">
    <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 animate-fadeInUp">
      <lucide-icon [img]="ClipboardList" class="h-7 w-7 text-[#2a23b8]"></lucide-icon>
      Mis pedidos
    </h1>

    <div *ngIf="orders.length === 0" class="text-center py-20 text-gray-400 animate-fadeIn">
      <lucide-icon [img]="ClipboardList" class="h-12 w-12 mx-auto mb-3 opacity-40"></lucide-icon>
      <p class="font-semibold">Aún no has hecho pedidos</p>
    </div>

    <div class="space-y-4 mt-6">
      <div *ngFor="let o of orders; let i = index"
           class="bg-white rounded-2xl shadow-lg overflow-hidden animate-fadeInUp" [class]="'stagger-' + (i % 8 + 1)">
        <div class="h-1.5" [class]="accent(o)"></div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs text-gray-400 font-semibold">#{{ o.id.slice(0, 8) }} · {{ o.timestamp | date:'dd/MM HH:mm' }}</p>
              <p class="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                <lucide-icon [img]="o.orderType === 'delivery' ? Bike : Store" class="h-4 w-4 text-gray-400"></lucide-icon>
                {{ o.orderType === 'delivery' ? 'Delivery' : 'En el local' }}
              </p>
            </div>
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-full" [class]="badge(o)">{{ statusLabel(o) }}</span>
          </div>

          <div class="mt-3 text-sm text-gray-500">
            {{ o.items.length }} ítem(s) · <strong class="text-[#ed450d]">\${{ o.total.toFixed(2) }}</strong>
            <span *ngIf="o.deliveryFee" class="text-xs text-gray-400">(incl. envío \${{ o.deliveryFee.toFixed(2) }})</span>
          </div>

          <!-- Stepper -->
          <div class="mt-4 flex items-center gap-1">
            <ng-container *ngFor="let s of steps; let last = last">
              <div class="flex-1 h-1.5 rounded-full transition-colors"
                   [class]="stepIndex(o) >= s.idx ? 'bg-[#2a23b8]' : 'bg-gray-200'"></div>
            </ng-container>
          </div>
          <p class="text-xs text-gray-400 mt-1.5">{{ stepHint(o) }}</p>

          <!-- Re-subir comprobante si fue rechazado -->
          <div *ngIf="o.paymentStatus === 'rejected'" class="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
            <p class="text-sm text-red-700 font-semibold flex items-center gap-1.5">
              <lucide-icon [img]="XCircle" class="h-4 w-4"></lucide-icon> Pago rechazado — vuelve a enviar el comprobante
            </p>
            <input [(ngModel)]="refMap[o.id]" placeholder="Número de referencia"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ed450d] focus:border-transparent">
            <label class="flex items-center justify-center gap-2 cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-lg py-2.5 text-sm text-gray-600">
              <lucide-icon [img]="Upload" class="h-4 w-4"></lucide-icon>
              <span>{{ fileMap[o.id]?.name || 'Subir comprobante' }}</span>
              <input type="file" accept="image/*" class="hidden" (change)="pickFile(o.id, $event)">
            </label>
            <button (click)="resend(o)" [disabled]="!fileMap[o.id] || !refMap[o.id] || busyId === o.id"
              class="w-full bg-[#ed450d] text-white py-2.5 rounded-lg font-bold text-sm press-effect disabled:opacity-50">
              {{ busyId === o.id ? 'Enviando...' : 'Reenviar comprobante' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class MyOrdersViewComponent implements OnInit, OnDestroy {
  Clock = Clock; CheckCircle = CheckCircle; XCircle = XCircle;
  Bike = Bike; Store = Store; Upload = Upload; ClipboardList = ClipboardList;

  orders: Order[] = [];
  steps = [{ idx: 0 }, { idx: 1 }, { idx: 2 }, { idx: 3 }];
  fileMap: { [id: string]: File | undefined } = {};
  refMap: { [id: string]: string } = {};
  busyId: string | null = null;

  private subs: Subscription[] = [];
  private archived: Order[] = [];

  constructor(
    private app: AppService,
    private auth: AuthService,
    private orderSvc: OrderSupabaseService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const uid = this.auth.getCurrentUser()?.id;
    this.subs.push(this.app.orders$.subscribe(list => {
      const active = list.filter(o => o.customerUserId === uid);
      this.orders = [...active, ...this.archived]
        .sort((a, b) => +b.timestamp - +a.timestamp);
    }));
    if (uid) {
      this.orderSvc.getMyArchivedOrders(uid).then(a => {
        this.archived = a;
        const active = this.app.getCurrentOrders().filter(o => o.customerUserId === uid);
        this.orders = [...active, ...a].sort((x, y) => +y.timestamp - +x.timestamp);
      }).catch(() => {});
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  stepIndex(o: Order): number {
    if (o.paymentStatus === 'in-review' || o.paymentStatus === 'pending-proof' || o.paymentStatus === 'rejected') return 0;
    if (o.status === 'pending') return 1;
    if (o.status === 'preparing') return 2;
    if (o.status === 'ready' || o.status === 'completed') return 3;
    return 0;
  }

  stepHint(o: Order): string {
    if (o.paymentStatus === 'rejected') return 'Pago rechazado';
    if (o.paymentStatus === 'in-review' || o.paymentStatus === 'pending-proof') return 'Pago en revisión';
    if (o.status === 'pending') return 'En cocina';
    if (o.status === 'preparing') return 'Preparando';
    if (o.status === 'ready') return o.orderType === 'delivery' ? 'En camino / listo' : 'Listo para retirar';
    if (o.status === 'completed') return 'Entregado';
    if (o.status === 'cancelled') return 'Cancelado';
    return '';
  }

  statusLabel(o: Order): string {
    if (o.paymentStatus === 'rejected') return 'Pago rechazado';
    if (o.paymentStatus === 'in-review' || o.paymentStatus === 'pending-proof') return 'En revisión';
    if (o.status === 'cancelled') return 'Cancelado';
    if (o.status === 'completed') return 'Entregado';
    return this.stepHint(o);
  }

  badge(o: Order): string {
    if (o.paymentStatus === 'rejected' || o.status === 'cancelled') return 'bg-red-500 text-white';
    if (o.paymentStatus === 'in-review' || o.paymentStatus === 'pending-proof') return 'bg-[#fac20a] text-[#2a23b8]';
    if (o.status === 'completed') return 'bg-green-500 text-white';
    return 'bg-[#2a23b8] text-white';
  }

  accent(o: Order): string {
    if (o.paymentStatus === 'rejected' || o.status === 'cancelled') return 'bg-red-500';
    if (o.paymentStatus === 'in-review' || o.paymentStatus === 'pending-proof') return 'bg-[#fac20a]';
    if (o.status === 'completed') return 'bg-green-500';
    return 'bg-[#2a23b8]';
  }

  pickFile(id: string, e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.fileMap[id] = f;
  }

  async resend(o: Order): Promise<void> {
    const file = this.fileMap[o.id];
    const ref = this.refMap[o.id];
    if (!file || !ref) return;
    this.busyId = o.id;
    try {
      const uid = this.auth.getCurrentUser()!.id;
      await this.orderSvc.submitPaymentProof(o.id, file, ref.trim(), uid);
      this.toast.success('Comprobante reenviado, en revisión');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'No se pudo reenviar');
    } finally {
      this.busyId = null;
    }
  }
}
