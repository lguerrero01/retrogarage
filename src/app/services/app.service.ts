import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Order, Customer, MenuItem } from '../models/types';
import { menuItems as defaultMenuItems } from '../data/menu-items';
import { NotificationService } from './notification.service';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { ProductApiService } from './product-api.service';
import { OrderApiService } from './order-api.service';
import {
  apiProductToMenuItem,
  apiOrderToOrder,
  cartToCreateOrderRequest,
  frontendStatusToApi,
  menuItemToCreateApiProduct,
  menuItemUpdatesToApi
} from '../models/adapters';
import { ApiOrder } from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private cartSubject = new BehaviorSubject<CartItem[]>(this.getStoredCart());
  private ordersSubject = new BehaviorSubject<Order[]>(this.getStoredOrders());
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>(this.getStoredMenuItems());
  private productCategories: Record<string, string> = this.loadCategoryMap();

  cart$ = this.cartSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();
  menuItems$ = this.menuItemsSubject.asObservable();

  constructor(
    private notificationService: NotificationService,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private productApiService: ProductApiService,
    private orderApiService: OrderApiService
  ) {
    this.initializeFirestoreListener();
    this.loadProductsFromApi();
  }

  private initializeFirestoreListener() {
    this.firebaseService.listenToCollection<ApiOrder>('pedidos_activos')
      .subscribe({
        next: (update) => {
          if (update.error) {
            console.error('Error listening to pedidos_activos:', update.error);
            return;
          }

          const menuMap = new Map(this.menuItemsSubject.value.map(m => [m.id, m]));
          const orders = update.data.map(o => {
            const order = apiOrderToOrder(o);
            order.items = order.items.map(item => ({
              ...item,
              category: menuMap.get(item.id)?.category || item.category || 'Sin categoría'
            }));
            return order;
          });
          this.ordersSubject.next(orders);
          localStorage.setItem('restaurant-orders', JSON.stringify(orders));
        },
        error: (err) => {
          console.error('Subscription error:', err);
        }
      });
  }

  private loadProductsFromApi() {
    this.productApiService.getProducts()
      .then(ps => {
        const items = this.applyCategoryMap(ps.map(apiProductToMenuItem));
        this.menuItemsSubject.next(items);
        localStorage.setItem('restaurant-menu-items', JSON.stringify(items));
        console.log('Products loaded from API');
      })
      .catch(() => {
        // Fallback: keep items already loaded from localStorage
      });

    // Real-time sync after mutations
    this.firebaseService.listenToCollection<any>('products')
      .subscribe({
        next: (update) => {
          if (update.error || !update.data.length) return;
          const items = this.applyCategoryMap(update.data.map(apiProductToMenuItem));
          this.menuItemsSubject.next(items);
          localStorage.setItem('restaurant-menu-items', JSON.stringify(items));
        },
        error: (err) => console.error('Products listener error:', err)
      });
  }

  private loadCategoryMap(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem('product-categories') ?? '{}');
    } catch {
      return {};
    }
  }

  private saveCategoryMap() {
    localStorage.setItem('product-categories', JSON.stringify(this.productCategories));
  }

  private applyCategoryMap(items: MenuItem[]): MenuItem[] {
    return items.map(item => ({
      ...item,
      category: item.category || this.productCategories[item.id] || ''
    }));
  }

  private getStoredCart(): CartItem[] {
    try {
      const stored = localStorage.getItem('restaurant-cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getStoredOrders(): Order[] {
    try {
      const stored = localStorage.getItem('restaurant-orders');
      const orders = stored ? JSON.parse(stored) : [];
      return orders.map((order: any) => ({
        ...order,
        timestamp: new Date(order.timestamp)
      }));
    } catch {
      return [];
    }
  }

  private getStoredMenuItems(): MenuItem[] {
    try {
      const stored = localStorage.getItem('restaurant-menu-items');
      return stored ? JSON.parse(stored) : defaultMenuItems;
    } catch {
      return defaultMenuItems;
    }
  }

  private updateCartStorage(cart: CartItem[]) {
    localStorage.setItem('restaurant-cart', JSON.stringify(cart));
    this.cartSubject.next(cart);
  }

  addToCart(item: CartItem) {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.findIndex(cartItem =>
      cartItem.id === item.id &&
      JSON.stringify(cartItem.selectedIngredients) === JSON.stringify(item.selectedIngredients) &&
      JSON.stringify(cartItem.removedIngredients) === JSON.stringify(item.removedIngredients)
    );

    if (existingItemIndex !== -1) {
      const updatedCart = [...currentCart];
      updatedCart[existingItemIndex].quantity += item.quantity;
      this.updateCartStorage(updatedCart);
    } else {
      this.updateCartStorage([...currentCart, item]);
    }
  }

  removeFromCart(itemId: string) {
    const updatedCart = this.cartSubject.value.filter(item => item.id !== itemId);
    this.updateCartStorage(updatedCart);
  }

  updateCartItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const updatedCart = this.cartSubject.value.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    this.updateCartStorage(updatedCart);
  }

  clearCart() {
    this.updateCartStorage([]);
  }

  createOrder(customer: Customer) {
    const items = this.cartSubject.value;
    if (!items.length) return;

    const waiterId = this.authService.getCurrentUser()?.id ?? 'anonymous';
    const request = cartToCreateOrderRequest(items, customer, waiterId);

    this.orderApiService.createOrder(request)
      .then(apiOrder => {
        this.clearCart();
        this.notificationService.notifyNewOrder(apiOrder.id, customer.name);
      })
      .catch(err => console.error('Error creating order:', err));
  }

  updateOrderStatus(orderId: string, status: Order['status']) {
    const apiStatus = frontendStatusToApi(status);

    this.orderApiService.updateStatus(orderId, apiStatus)
      .then(() => {
        if (status === 'completed') {
          this.orderApiService.archiveOrder(orderId).catch(console.error);
        }
      })
      .catch(err => console.error('Error updating order status:', err));

    // Optimistic update — Firestore listener will sync after
    const updated = this.ordersSubject.value.map(o =>
      o.id === orderId ? { ...o, status } : o
    );
    this.ordersSubject.next(updated);
    this.notificationService.notifyOrderStatusUpdate(orderId, status);
  }

  // Menu Management Methods
  addMenuItem(item: MenuItem) {
    const data = menuItemToCreateApiProduct(item);
    this.productApiService.createProduct(data)
      .then(apiProduct => {
        if (item.category) {
          this.productCategories[apiProduct.id] = item.category;
          this.saveCategoryMap();
        }
      })
      .catch(err => console.error('Error creating product:', err));
  }

  updateMenuItem(itemId: string, updates: Partial<MenuItem>) {
    if (updates.category !== undefined) {
      this.productCategories[itemId] = updates.category;
      this.saveCategoryMap();
    }
    const data = menuItemUpdatesToApi(updates);
    this.productApiService.updateProduct(itemId, data)
      .catch(err => console.error('Error updating product:', err));
  }

  deleteMenuItem(itemId: string) {
    delete this.productCategories[itemId];
    this.saveCategoryMap();
    this.productApiService.deleteProduct(itemId)
      .catch(err => console.error('Error deleting product:', err));
  }

  getCartTotal(): number {
    return this.cartSubject.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartSubject.value.reduce((count, item) => count + item.quantity, 0);
  }

  getCurrentCart(): CartItem[] {
    return this.cartSubject.value;
  }

  getCurrentOrders(): Order[] {
    return this.ordersSubject.value;
  }

  getCurrentMenuItems(): MenuItem[] {
    return this.menuItemsSubject.value;
  }
}
