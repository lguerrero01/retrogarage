import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Minus, ShoppingBag } from 'lucide-angular';
import { AppService } from '../../services/app.service';
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
  
  cart: CartItem[] = [];
  showCheckout = false;
  customer: Customer = {
    name: '',
    phone: '',
    table: '',
    notes: ''
  };

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.appService.cart$.subscribe(cart => {
      this.cart = cart;
    });
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
    }
  }
}