import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, ShoppingBag, LogIn } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CartItem, Customer } from '../../models/types';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
  isAuthenticated = false;
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
  ) {}

  ngOnInit() {
    this.appService.cart$.subscribe(cart => {
      this.cart = cart;
    });
    this.authService.authState$.subscribe(state => {
      this.isAuthenticated = state.isAuthenticated;
      if (!state.isAuthenticated) this.showCheckout = false;
    });
  }

  proceedToCheckout() {
    if (!this.isAuthenticated) {
      this.toast.warning('Inicia sesión para continuar con tu pedido');
      this.authService.requestLogin();
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
    if (this.customer.name && this.customer.phone) {
      this.appService.createOrder(this.customer);
      this.showCheckout = false;
      this.customer = { name: '', phone: '', table: '', notes: '' };
      this.toast.success('Pedido enviado a cocina');
    }
  }
}