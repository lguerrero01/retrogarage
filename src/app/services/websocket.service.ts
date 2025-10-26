import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Order } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isSimulated = true; // Flag para modo simulación

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private newOrderSubject = new Subject<Order>();
  private orderStatusUpdateSubject = new Subject<{ orderId: string; status: string }>();

  connectionStatus$ = this.connectionStatusSubject.asObservable();
  newOrder$ = this.newOrderSubject.asObservable();
  orderStatusUpdate$ = this.orderStatusUpdateSubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      if (this.isSimulated) {
        this.simulateWebSocketConnection();
      } else {
        // En un entorno real, conectar al servidor WebSocket
        // this.socket = new WebSocket('ws://localhost:8080/ws');
        // this.setupSocketEventListeners();
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private simulateWebSocketConnection() {
    // Simulamos una conexión WebSocket exitosa
    setTimeout(() => {
      this.connectionStatusSubject.next(true);
      this.reconnectAttempts = 0;
      console.log('WebSocket connection simulated successfully');
    }, 1000);
  }

  private setupSocketEventListeners() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.connectionStatusSubject.next(true);
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.connectionStatusSubject.next(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatusSubject.next(false);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'new-order':
        this.newOrderSubject.next(data.order);
        break;
      case 'order-status-update':
        this.orderStatusUpdateSubject.next({
          orderId: data.orderId,
          status: data.status
        });
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Enviar nuevo pedido
  sendNewOrder(order: Order) {
    if (this.isSimulated) {
      // En modo simulación, no enviamos la notificación de vuelta
      // porque la orden ya se procesó localmente
      console.log('Order processed locally (simulation mode):', order);
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'new-order',
        order: order
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, order will be processed locally only');
    }
  }

  // Enviar actualización de estado de pedido
  sendOrderStatusUpdate(orderId: string, status: string) {
    if (this.isSimulated) {
      // En modo simulación, no enviamos notificaciones de vuelta
      console.log('Order status update processed locally (simulation mode):', { orderId, status });
      return;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'order-status-update',
        orderId: orderId,
        status: status
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, status update processed locally only');
    }
  }

  // Método para desconectar
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionStatusSubject.next(false);
  }

  // Método para reconectar manualmente
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  // Obtener estado de conexión actual
  isConnected(): boolean {
    return this.connectionStatusSubject.value;
  }

  // Método para cambiar entre modo simulado y real
  setSimulationMode(enabled: boolean) {
    this.isSimulated = enabled;
    if (enabled) {
      this.disconnect();
      this.simulateWebSocketConnection();
    } else {
      this.reconnect();
    }
  }
}