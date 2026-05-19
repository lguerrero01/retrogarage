import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, ShoppingBag, LogIn } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { RestaurantConfigService, OpenState } from '../../services/restaurant-config.service';
import { CustomerCheckoutComponent } from '../customer-checkout/customer-checkout.component';
import { CartItem, Customer } from '../../models/types';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CustomerCheckoutComponent],
  templateUrl: './cart-summary.component.html',
  styleUrls: ['./cart-summary.component.css']
})
export class CartSummaryComponent implements OnInit {
  X = X;
  Plus = Plus;
  Minus = Minus;
  ShoppingBag = ShoppingBag;
  LogIn = LogIn;

  cart: CartItem[] = [];
  showCheckout = false;
  showCustomerCheckout = false;
  isAuthenticated = false;
  openState: OpenState = { open: true, label: '' };
  customer: Customer = {
    name: '',
    phone: '',
    table: '',
    notes: ''
  };

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private toast: ToastService,
    private configService: RestaurantConfigService,
  ) {}

  ngOnInit() {
    this.appService.cart$.subscribe(cart => {
      this.cart = cart;
    });
    this.authService.authState$.subscribe(state => {
      this.isAuthenticated = state.isAuthenticated;
      if (!state.isAuthenticated) this.showCheckout = false;
    });
    this.configService.openState$.subscribe(s => (this.openState = s));
  }

  /** El local está cerrado y el usuario NO es staff (staff puede ordenar en sitio). */
  get blockedByHours(): boolean {
    return !this.openState.open && !this.authService.isStaff();
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  proceedToCheckout() {
    if (!this.isAuthenticated) {
      this.toast.warning('Inicia sesión o crea tu cuenta para pedir');
      this.authService.requestLogin();
      return;
    }
    if (this.blockedByHours) {
      this.toast.warning(this.openState.label || 'El local está cerrado en este momento');
      return;
    }
    if (this.isCustomer) {
      this.showCustomerCheckout = true;
      return;
    }
    this.showCheckout = true;
  }

  updateQuantity(itemId: string, quantity: number) {
    this.appService.updateCartItemQuantity(itemId, quantity);
  }

  removeItem(itemId: string) {
    this.appService.removeFromCart(itemId);
  }

  getTotal(): number {
    return this.appService.getCartTotal();
  }

  submitOrder() {
    if (this.blockedByHours) {
      this.toast.warning(this.openState.label || 'El local está cerrado en este momento');
      return;
    }
    if (this.customer.name && this.customer.phone) {
      this.appService.createOrder(this.customer);
      this.showCheckout = false;
      this.customer = { name: '', phone: '', table: '', notes: '' };
      this.toast.success('Pedido enviado a cocina');
    }
  }
}