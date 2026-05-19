import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, X, Store, Bike, MapPin, CheckCircle, Upload, Copy, ArrowLeft
} from 'lucide-angular';
import { CartItem, CustomerAddress, DeliveryAddress } from '../../models/types';
import { RestaurantConfigService, PagoMovil } from '../../services/restaurant-config.service';
import { CustomerService } from '../../services/customer.service';
import { OrderSupabaseService } from '../../services/order-supabase.service';
import { AuthService } from '../../services/auth.service';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-customer-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
       (click)="close.emit()">
    <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto animate-slideInUp sm:animate-scaleIn"
         (click)="$event.stopPropagation()">

      <div class="bg-gradient-to-br from-[#2a23b8] to-[#8624ce] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div class="flex items-center gap-2">
          <button *ngIf="step === 'pay'" (click)="step = 'type'" class="p-1 hover:bg-white/15 rounded-lg press-effect">
            <lucide-icon [img]="ArrowLeft" class="h-5 w-5"></lucide-icon>
          </button>
          <div>
            <h2 class="font-extrabold text-lg">
              {{ step === 'type' ? 'Tu pedido' : step === 'pay' ? 'Pago Móvil' : '¡Pedido enviado!' }}
            </h2>
            <p class="text-white/70 text-xs">Total: \${{ grandTotal.toFixed(2) }}</p>
          </div>
        </div>
        <button (click)="close.emit()" class="p-1.5 hover:bg-white/15 rounded-lg press-effect">
          <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
        </button>
      </div>

      <!-- PASO 1: tipo + contacto + dirección -->
      <div *ngIf="step === 'type'" class="p-6 space-y-5">
        <div class="grid grid-cols-2 gap-3">
          <button (click)="orderType = 'dine-in-customer'"
            class="flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-bold text-sm press-effect transition-all"
            [class]="orderType === 'dine-in-customer' ? 'border-[#2a23b8] bg-[#2a23b8]/5 text-[#2a23b8]' : 'border-gray-200 text-gray-500'">
            <lucide-icon [img]="Store" class="h-7 w-7"></lucide-icon>
            Comer en el local
          </button>
          <button (click)="orderType = 'delivery'"
            class="flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-bold text-sm press-effect transition-all"
            [class]="orderType === 'delivery' ? 'border-[#ed450d] bg-[#ed450d]/5 text-[#ed450d]' : 'border-gray-200 text-gray-500'">
            <lucide-icon [img]="Bike" class="h-7 w-7"></lucide-icon>
            Delivery a casa
          </button>
        </div>

        <div class="space-y-3">
          <input [(ngModel)]="name" placeholder="Nombre"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
          <input [(ngModel)]="phone" placeholder="Teléfono" inputmode="tel"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
        </div>

        <div *ngIf="orderType === 'delivery'" class="space-y-3">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Dirección de entrega</p>
          <div *ngFor="let a of addresses"
            (click)="selectAddress(a)"
            class="flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer press-effect transition-all"
            [class]="selectedAddressId === a.id ? 'border-[#ed450d] bg-[#ed450d]/5' : 'border-gray-200'">
            <lucide-icon [img]="MapPin" class="h-4 w-4 text-[#ed450d] mt-0.5 flex-shrink-0"></lucide-icon>
            <div class="min-w-0 text-sm">
              <p class="font-semibold text-gray-800">{{ a.label || 'Dirección' }}</p>
              <p class="text-gray-500 truncate">{{ a.address }}</p>
            </div>
          </div>
          <button (click)="addingAddress = !addingAddress"
            class="text-sm font-semibold text-[#2a23b8]">+ Usar otra dirección</button>
          <div *ngIf="addingAddress || addresses.length === 0" class="space-y-2">
            <input [(ngModel)]="newAddress.address" placeholder="Dirección completa"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
            <input [(ngModel)]="newAddress.reference" placeholder="Punto de referencia (opcional)"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">
            <label class="flex items-center gap-2 text-sm text-gray-500">
              <input type="checkbox" [(ngModel)]="saveAddress" class="accent-[#ed450d]"> Guardar esta dirección
            </label>
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <div class="flex justify-between text-gray-500"><span>Subtotal</span><span>\${{ itemsTotal.toFixed(2) }}</span></div>
          <div *ngIf="orderType === 'delivery'" class="flex justify-between text-gray-500">
            <span>Envío</span><span>\${{ deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-extrabold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span><span class="text-[#ed450d]">\${{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>

        <button (click)="goToPay()"
          class="w-full bg-[#ed450d] hover:bg-[#ed450d]/90 text-white py-3.5 rounded-xl font-bold press-effect transition-colors">
          Continuar al pago
        </button>
      </div>

      <!-- PASO 2: Pago Móvil + comprobante -->
      <div *ngIf="step === 'pay'" class="p-6 space-y-4">
        <div class="bg-[#2a23b8]/5 border border-[#2a23b8]/15 rounded-xl p-4 space-y-2">
          <p class="text-xs font-bold text-[#2a23b8] uppercase tracking-wide">Datos para Pago Móvil</p>
          <div class="text-sm space-y-1 text-gray-700">
            <p><span class="text-gray-400">Banco:</span> <strong>{{ pago.bank || '—' }}</strong></p>
            <p><span class="text-gray-400">Cédula/RIF:</span> <strong>{{ pago.id_number || '—' }}</strong></p>
            <p class="flex items-center gap-2">
              <span class="text-gray-400">Teléfono:</span> <strong>{{ pago.phone || '—' }}</strong>
              <button *ngIf="pago.phone" (click)="copyPhone()" class="text-[#2a23b8]"><lucide-icon [img]="Copy" class="h-3.5 w-3.5"></lucide-icon></button>
            </p>
            <p><span class="text-gray-400">Titular:</span> <strong>{{ pago.holder || '—' }}</strong></p>
            <p class="pt-1 text-base"><span class="text-gray-400">Monto:</span> <strong class="text-[#ed450d]">\${{ grandTotal.toFixed(2) }}</strong></p>
          </div>
        </div>

        <input [(ngModel)]="reference" placeholder="Número de referencia del pago"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed450d] focus:border-transparent transition-colors">

        <label class="flex items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm text-gray-600 transition-colors">
          <lucide-icon [img]="Upload" class="h-5 w-5"></lucide-icon>
          <span>{{ file ? file.name : 'Subir comprobante (imagen)' }}</span>
          <input type="file" accept="image/*" class="hidden" (change)="onFile($event)">
        </label>

        <button (click)="submit()" [disabled]="submitting || !file || !reference.trim()"
          class="w-full bg-[#ed450d] hover:bg-[#ed450d]/90 text-white py-3.5 rounded-xl font-bold press-effect transition-colors disabled:opacity-50">
          {{ submitting ? 'Enviando...' : 'Enviar pedido y comprobante' }}
        </button>
        <p class="text-center text-xs text-gray-400">El admin revisará tu pago antes de enviarlo a cocina.</p>
      </div>

      <!-- PASO 3: confirmación -->
      <div *ngIf="step === 'done'" class="p-8 text-center space-y-3">
        <div class="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto animate-scaleIn">
          <lucide-icon [img]="CheckCircle" class="h-9 w-9 text-green-600"></lucide-icon>
        </div>
        <h3 class="text-xl font-extrabold text-gray-900">¡Pedido recibido!</h3>
        <p class="text-sm text-gray-500">
          Tu pago está <strong>en revisión</strong>. Te avisaremos cuando sea aprobado y tu pedido pase a cocina.
          Puedes seguir el estado en "Mis pedidos".
        </p>
        <button (click)="close.emit()"
          class="w-full bg-[#2a23b8] hover:bg-[#2a23b8]/90 text-white py-3 rounded-xl font-bold press-effect transition-colors">
          Entendido
        </button>
      </div>
    </div>
  </div>
  `
})
export class CustomerCheckoutComponent implements OnInit {
  @Input() cart: CartItem[] = [];
  @Output() close = new EventEmitter<void>();

  X = X; Store = Store; Bike = Bike; MapPin = MapPin;
  CheckCircle = CheckCircle; Upload = Upload; Copy = Copy; ArrowLeft = ArrowLeft;

  step: 'type' | 'pay' | 'done' = 'type';
  orderType: 'dine-in-customer' | 'delivery' = 'dine-in-customer';

  name = '';
  phone = '';
  addresses: CustomerAddress[] = [];
  selectedAddressId: string | null = null;
  addingAddress = false;
  saveAddress = true;
  newAddress = { address: '', reference: '' };

  pago: PagoMovil = { bank: '', id_number: '', phone: '', holder: '' };
  deliveryFee = 0;
  reference = '';
  file: File | null = null;
  submitting = false;

  constructor(
    private config: RestaurantConfigService,
    private customerSvc: CustomerService,
    private orderSvc: OrderSupabaseService,
    private auth: AuthService,
    private app: AppService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.name = this.auth.getCurrentUser()?.name ?? '';
    this.config.load().then(c => {
      this.pago = c.pago_movil;
      this.deliveryFee = c.delivery_fee || 0;
    }).catch(() => {});
    this.customerSvc.loadAddresses().then(list => {
      this.addresses = list;
      const def = list.find(a => a.isDefault) ?? list[0];
      if (def) { this.selectedAddressId = def.id; }
    }).catch(() => {});
  }

  get itemsTotal(): number {
    return this.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  get grandTotal(): number {
    return this.itemsTotal + (this.orderType === 'delivery' ? this.deliveryFee : 0);
  }

  selectAddress(a: CustomerAddress): void {
    this.selectedAddressId = a.id;
    this.addingAddress = false;
  }

  copyPhone(): void {
    navigator.clipboard?.writeText(this.pago.phone).then(() => this.toast.info('Teléfono copiado'));
  }

  onFile(e: Event): void {
    this.file = (e.target as HTMLInputElement).files?.[0] ?? null;
  }

  private buildDeliveryAddress(): DeliveryAddress | null {
    if (this.orderType !== 'delivery') return null;
    if (this.selectedAddressId && !this.addingAddress) {
      const a = this.addresses.find(x => x.id === this.selectedAddressId);
      if (a) return { label: a.label, address: a.address, reference: a.reference, phone: a.phone };
    }
    return { address: this.newAddress.address.trim(), reference: this.newAddress.reference.trim(), phone: this.phone };
  }

  goToPay(): void {
    if (!this.name.trim() || !this.phone.trim()) {
      this.toast.warning('Completa nombre y teléfono');
      return;
    }
    if (this.orderType === 'delivery') {
      const da = this.buildDeliveryAddress();
      if (!da || !da.address) { this.toast.warning('Indica la dirección de entrega'); return; }
    }
    this.step = 'pay';
  }

  async submit(): Promise<void> {
    if (this.submitting || !this.file || !this.reference.trim()) return;
    this.submitting = true;
    try {
      const da = this.buildDeliveryAddress();
      if (this.orderType === 'delivery' && this.saveAddress && this.addingAddress && da) {
        await this.customerSvc.addAddress({
          label: 'Mi dirección', address: da.address, reference: da.reference ?? '',
          phone: this.phone, isDefault: this.addresses.length === 0
        }).catch(() => {});
      }
      const order = await this.orderSvc.submitCustomerOrder(
        this.cart,
        { name: this.name.trim(), phone: this.phone.trim() },
        this.orderType,
        da,
        this.orderType === 'delivery' ? this.deliveryFee : 0
      );
      const uid = this.auth.getCurrentUser()!.id;
      await this.orderSvc.submitPaymentProof(order.id, this.file, this.reference.trim(), uid);
      this.app.clearCart();
      // No cerrar la hoja del carrito aquí: destruiría este modal antes
      // de mostrar la confirmación. Se cierra al pulsar "Entendido".
      this.step = 'done';
    } catch (e: any) {
      const msg = e?.message?.includes('STORE_CLOSED')
        ? 'El local está cerrado en este momento.'
        : (e?.message ?? 'No se pudo enviar el pedido');
      this.toast.error(msg);
    } finally {
      this.submitting = false;
    }
  }
}
