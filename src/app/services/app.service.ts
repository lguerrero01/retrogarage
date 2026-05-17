import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Order, Customer, MenuItem } from '../models/types';
import { menuItems as defaultMenuItems } from '../data/menu-items';
import { NotificationService } from './notification.service';
import { SupabaseRealtimeService } from './supabase-realtime.service';
import { AuthService } from './auth.service';
import { ProductSupabaseService } from './product-supabase.service';
import { OrderSupabaseService } from './order-supabase.service';
import { dbOrderToOrder } from './order-supabase.service';

interface DbOrder {
  id: string;
  waiter_id: string | null;
  table_number: number;
  items: CartItem[];
  total: number;
  status: Order['status'];
  customer_preferences: { name?: string; phone?: string; notes?: string } | null;
  created_at: string;
  updated_at: string;
}

interface DbProduct {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  images: string[];
  is_available: boolean;
  category: string;
}

function dbProductToMenuItem(p: DbProduct): MenuItem {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    category: p.category ?? '',
    image: p.images?.[0] ?? '',
    available: p.is_available ?? true,
    customizable: (p.ingredients?.length ?? 0) > 0,
    ingredients: p.ingredients ?? []
  };
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private cartSubject = new BehaviorSubject<CartItem[]>(this.getStoredCart());
  private ordersSubject = new BehaviorSubject<Order[]>(this.getStoredOrders());
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>(this.getStoredMenuItems());

  cart$ = this.cartSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();
  menuItems$ = this.menuItemsSubject.asObservable();

  constructor(
    private notificationService: NotificationService,
    private realtimeService: SupabaseRealtimeService,
    private authService: AuthService,
    private productService: ProductSupabaseService,
    private orderService: OrderSupabaseService
  ) {
    this.initRealtimeListeners();
  }

  private initRealtimeListeners() {
    this.realtimeService.listenToTable<DbOrder>('orders', (rows) => {
      const orders = rows.map(dbOrderToOrder);
      this.ordersSubject.next(orders);
      localStorage.setItem('restaurant-orders', JSON.stringify(orders));
    });

    this.realtimeService.listenToTable<DbProduct>('products', (rows) => {
      const items = rows.map(dbProductToMenuItem);
      this.menuItemsSubject.next(items);
      localStorage.setItem('restaurant-menu-items', JSON.stringify(items));
    });
  }

  private getStoredCart(): CartItem[] {
    try { return JSON.parse(localStorage.getItem('restaurant-cart') ?? '[]'); } catch { return []; }
  }

  private getStoredOrders(): Order[] {
    try {
      const orders = JSON.parse(localStorage.getItem('restaurant-orders') ?? '[]');
      return orders.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
    } catch { return []; }
  }

  private getStoredMenuItems(): MenuItem[] {
    try {
      const stored = localStorage.getItem('restaurant-menu-items');
      return stored ? JSON.parse(stored) : defaultMenuItems;
    } catch { return defaultMenuItems; }
  }

  private updateCartStorage(cart: CartItem[]) {
    localStorage.setItem('restaurant-cart', JSON.stringify(cart));
    this.cartSubject.next(cart);
  }

  addToCart(item: CartItem) {
    const currentCart = this.cartSubject.value;
    const idx = currentCart.findIndex(c =>
      c.id === item.id &&
      JSON.stringify(c.selectedIngredients) === JSON.stringify(item.selectedIngredients) &&
      JSON.stringify(c.removedIngredients) === JSON.stringify(item.removedIngredients)
    );
    if (idx !== -1) {
      const updated = [...currentCart];
      updated[idx].quantity += item.quantity;
      this.updateCartStorage(updated);
    } else {
      this.updateCartStorage([...currentCart, item]);
    }
  }

  removeFromCart(itemId: string) {
    this.updateCartStorage(this.cartSubject.value.filter(i => i.id !== itemId));
  }

  updateCartItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) { this.removeFromCart(itemId); return; }
    this.updateCartStorage(this.cartSubject.value.map(i => i.id === itemId ? { ...i, quantity } : i));
  }

  clearCart() {
    this.updateCartStorage([]);
  }

  createOrder(customer: Customer) {
    const items = this.cartSubject.value;
    if (!items.length) return;
    const waiterId = this.authService.getCurrentUser()?.id ?? '';
    this.orderService.createOrder(items, customer, waiterId)
      .then(order => {
        this.clearCart();
        this.notificationService.notifyNewOrder(order.id, customer.name);
      })
      .catch(err => console.error('Error creating order:', err));
  }

  updateOrderStatus(orderId: string, status: Order['status']) {
    this.orderService.updateStatus(orderId, status)
      .then(() => {
        if (status === 'completed') {
          const order = this.ordersSubject.value.find(o => o.id === orderId);
          if (order) this.orderService.archiveOrder({ ...order, status }).catch(console.error);
        }
      })
      .catch(err => console.error('Error updating status:', err));

    const updated = this.ordersSubject.value.map(o => o.id === orderId ? { ...o, status } : o);
    this.ordersSubject.next(updated);
    this.notificationService.notifyOrderStatusUpdate(orderId, status);
  }

  addMenuItem(item: MenuItem) {
    this.productService.create(item).catch(err => console.error('Error creating product:', err));
  }

  updateMenuItem(itemId: string, updates: Partial<MenuItem>) {
    this.productService.update(itemId, updates).catch(err => console.error('Error updating product:', err));
  }

  deleteMenuItem(itemId: string) {
    this.productService.delete(itemId).catch(err => console.error('Error deleting product:', err));
  }

  getCartTotal(): number {
    return this.cartSubject.value.reduce((t, i) => t + i.price * i.quantity, 0);
  }

  getCartItemCount(): number {
    return this.cartSubject.value.reduce((c, i) => c + i.quantity, 0);
  }

  getCurrentCart(): CartItem[] { return this.cartSubject.value; }
  getCurrentOrders(): Order[] { return this.ordersSubject.value; }
  getCurrentMenuItems(): MenuItem[] { return this.menuItemsSubject.value; }
}
