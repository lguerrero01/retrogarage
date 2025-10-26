import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Order, Customer, MenuItem } from '../models/types';
import { menuItems as defaultMenuItems } from '../data/menu-items';
import { WebSocketService } from './websocket.service';
import { NotificationService } from './notification.service';

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
    private webSocketService: WebSocketService,
    private notificationService: NotificationService
  ) {
    // Suscribirse a las notificaciones de WebSocket solo si estamos en vista de cocina
    this.webSocketService.newOrder$.subscribe(order => {
      // Solo procesar si la orden no existe ya en la lista
      const currentOrders = this.ordersSubject.value;
      const orderExists = currentOrders.some(existingOrder => existingOrder.id === order.id);
      
      if (!orderExists) {
        const updatedOrders = [order, ...currentOrders];
        this.updateOrdersStorage(updatedOrders);
      }
    });

    this.webSocketService.orderStatusUpdate$.subscribe(({ orderId, status }) => {
      // Actualizar el estado de la orden cuando llegue una actualización por WebSocket
      const currentOrders = this.ordersSubject.value;
      const orderExists = currentOrders.some(order => order.id === orderId);
      
      if (orderExists) {
        this.updateOrderStatus(orderId, status as Order['status']);
      }
    });
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

  private updateOrdersStorage(orders: Order[]) {
    localStorage.setItem('restaurant-orders', JSON.stringify(orders));
    this.ordersSubject.next(orders);
  }

  private updateMenuItemsStorage(items: MenuItem[]) {
    localStorage.setItem('restaurant-menu-items', JSON.stringify(items));
    this.menuItemsSubject.next(items);
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
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.filter(item => item.id !== itemId);
    this.updateCartStorage(updatedCart);
  }

  updateCartItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }
    
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    this.updateCartStorage(updatedCart);
  }

  clearCart() {
    this.updateCartStorage([]);
  }

  createOrder(customer: Customer) {
    const currentCart = this.cartSubject.value;
    if (currentCart.length === 0) return;

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      customer,
      items: [...currentCart],
      total: this.getCartTotal(),
      status: 'pending',
      timestamp: new Date(),
      estimatedTime: Math.floor(Math.random() * 30) + 15
    };

    const currentOrders = this.ordersSubject.value;
    this.updateOrdersStorage([newOrder, ...currentOrders]);
    this.clearCart();

    // Enviar la nueva orden por WebSocket (esto simula el envío al servidor)
    this.webSocketService.sendNewOrder(newOrder);

    // Crear notificación para el panel de cocina
    this.notificationService.notifyNewOrder(newOrder.id, newOrder.customer.name);
  }

  updateOrderStatus(orderId: string, status: Order['status']) {
    const currentOrders = this.ordersSubject.value;
    const updatedOrders = currentOrders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );
    this.updateOrdersStorage(updatedOrders);

    // Enviar actualización de estado por WebSocket
    this.webSocketService.sendOrderStatusUpdate(orderId, status);

    // Crear notificación de actualización de estado
    this.notificationService.notifyOrderStatusUpdate(orderId, status);
  }

  // Menu Management Methods
  addMenuItem(item: MenuItem) {
    const currentItems = this.menuItemsSubject.value;
    const newItem = { ...item, id: `item-${Date.now()}` };
    this.updateMenuItemsStorage([...currentItems, newItem]);
  }

  updateMenuItem(itemId: string, updates: Partial<MenuItem>) {
    const currentItems = this.menuItemsSubject.value;
    const updatedItems = currentItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    this.updateMenuItemsStorage(updatedItems);
  }

  deleteMenuItem(itemId: string) {
    const currentItems = this.menuItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    this.updateMenuItemsStorage(updatedItems);
  }

  getCartTotal(): number {
    const currentCart = this.cartSubject.value;
    return currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    const currentCart = this.cartSubject.value;
    return currentCart.reduce((count, item) => count + item.quantity, 0);
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