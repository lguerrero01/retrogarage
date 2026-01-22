import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Order, Customer, MenuItem } from '../models/types';
import { menuItems as defaultMenuItems } from '../data/menu-items';
import { WebSocketService } from './websocket.service';
import { NotificationService } from './notification.service';
import { FirebaseService } from './firebase.service';
import { collection, updateDoc, doc, Timestamp, setDoc } from 'firebase/firestore';

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

  private isUpdatingFromFirestore = false; // Flag para evitar loops de actualización

  constructor(
    private webSocketService: WebSocketService,
    private notificationService: NotificationService,
    private firebaseService: FirebaseService
  ) {
    // Escuchar la colección 'orders' de Firestore en tiempo real
    this.initializeFirestoreListener();

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

  /**
   * Inicializa el listener de Firestore para la colección 'orders'
   * Sincroniza automáticamente las órdenes en tiempo real
   */
  private initializeFirestoreListener() {
    this.firebaseService.listenToCollection<any>('orders')
      .subscribe({
        next: (update) => {
          if (update.error) {
            console.error('Error listening to orders collection:', update.error);
            return;
          }

          // Convertir los datos de Firestore a objetos Order
          const firestoreOrders = update.data.map(orderData => this.convertFirestoreToOrder(orderData));

          // Actualizar el BehaviorSubject sin causar un loop
          this.isUpdatingFromFirestore = true;
          this.ordersSubject.next(firestoreOrders);
          localStorage.setItem('restaurant-orders', JSON.stringify(firestoreOrders));
          this.isUpdatingFromFirestore = false;

          console.log('Orders updated from Firestore:', firestoreOrders);
        },
        error: (err) => {
          console.error('Subscription error:', err);
        }
      });
  }

  /**
   * Convierte un documento de Firestore a un objeto Order
   * Maneja la conversión de Timestamps a Date
   */
  private convertFirestoreToOrder(firestoreData: any): Order {
    return {
      ...firestoreData,
      timestamp: firestoreData.timestamp?.toDate ? firestoreData.timestamp.toDate() : new Date(firestoreData.timestamp)
    };
  }

  /**
   * Convierte un objeto Order a formato compatible con Firestore
   * Convierte Date a Timestamp
   */
  private convertOrderToFirestore(order: Order): any {
    return {
      ...order,
      timestamp: Timestamp.fromDate(order.timestamp)
    };
  }

  /**
   * Guarda una nueva orden en Firestore
   * Usa el order.id como ID del documento para facilitar actualizaciones posteriores
   */
  private async saveOrderToFirestore(order: Order): Promise<void> {
    if (this.isUpdatingFromFirestore) {
      return; // Evitar loop: no guardar si estamos actualizando desde Firestore
    }

    try {
      const db = this.firebaseService.getFirestore();
      const orderRef = doc(db, 'orders', order.id);
      const orderData = this.convertOrderToFirestore(order);

      // Usar setDoc para especificar el ID del documento
      await setDoc(orderRef, orderData);
      console.log('Order saved to Firestore:', order.id);
    } catch (error) {
      console.error('Error saving order to Firestore:', error);
    }
  }

  /**
   * Actualiza una orden existente en Firestore
   * Usa el orderId como ID del documento de Firestore
   */
  private async updateOrderInFirestore(orderId: string, updates: Partial<Order>): Promise<void> {
    if (this.isUpdatingFromFirestore) {
      return; // Evitar loop
    }

    try {
      const db = this.firebaseService.getFirestore();
      const orderRef = doc(db, 'orders', orderId);

      // Convertir campos Date a Timestamp si existen
      const orderData: any = { ...updates };
      if (orderData.timestamp) {
        orderData.timestamp = Timestamp.fromDate(orderData.timestamp);
      }

      await updateDoc(orderRef, orderData);
      console.log('Order updated in Firestore:', orderId);
    } catch (error) {
      console.error('Error updating order in Firestore:', error);
    }
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

    // Guardar en Firestore
    this.saveOrderToFirestore(newOrder);

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

    // Actualizar en Firestore
    this.updateOrderInFirestore(orderId, { status });

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