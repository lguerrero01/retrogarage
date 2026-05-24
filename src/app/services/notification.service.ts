import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'new-order' | 'order-update' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>(this.getStoredNotifications());
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private soundEnabled = true;

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Solicitar permisos de notificación del navegador
    this.requestNotificationPermission();
    
    // Cargar configuración de sonido
    this.soundEnabled = localStorage.getItem('notifications-sound-enabled') !== 'false';
    
    // Calcular contador inicial
    this.updateUnreadCount();
  }

  private getStoredNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem('restaurant-notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      return notifications.map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
    } catch {
      return [];
    }
  }

  private saveNotifications(notifications: Notification[]) {
    try {
      localStorage.setItem('restaurant-notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.log('Notification permission request failed:', error);
      }
    }
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    const currentNotifications = this.notificationsSubject.value;
    
    // Evitar duplicados basados en orderId y tipo
    const isDuplicate = currentNotifications.some(existing => 
      existing.orderId === newNotification.orderId && 
      existing.type === newNotification.type &&
      Math.abs(existing.timestamp.getTime() - newNotification.timestamp.getTime()) < 5000 // 5 segundos
    );

    if (isDuplicate) {
      console.log('Duplicate notification prevented:', newNotification);
      return;
    }

    // Mantener solo las últimas 50 notificaciones
    const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50);
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
    this.updateUnreadCount();

    // Mostrar notificación del navegador si está permitido
    this.showBrowserNotification(newNotification);

    // Reproducir sonido de notificación si está habilitado
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
  }

  markAsRead(notificationId: string) {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
    this.updateUnreadCount();
  }

  markAllAsRead() {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
    this.updateUnreadCount();
  }

  clearNotifications() {
    this.notificationsSubject.next([]);
    this.saveNotifications([]);
    this.updateUnreadCount();
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('notifications-sound-enabled', enabled.toString());
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private updateUnreadCount() {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          requireInteraction: false
        });

        // Auto cerrar después de 5 segundos
        setTimeout(() => {
          browserNotification.close();
        }, 5000);

        // Manejar click en la notificación
        browserNotification.onclick = () => {
          window.focus();
          this.markAsRead(notification.id);
          browserNotification.close();
        };
      } catch (error) {
        console.log('Error showing browser notification:', error);
      }
    }
  }

  private playNotificationSound() {
    try {
      // Crear un sonido de notificación simple usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear un sonido más suave y agradable
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar frecuencias para un sonido más agradable
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      
      // Configurar volumen más bajo
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.type = 'sine'; // Sonido más suave
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  // Métodos para crear notificaciones específicas
  notifyNewOrder(orderId: string, customerName: string) {
    this.addNotification({
      type: 'new-order',
      title: '🍔 ¡Nuevo Pedido!',
      message: `Pedido #${orderId.slice(-6)} de ${customerName}`,
      orderId
    });
  }

  notifyOrderStatusUpdate(orderId: string, status: string) {
    const statusText = this.getStatusText(status);
    const statusEmoji = this.getStatusEmoji(status);
    
    this.addNotification({
      type: 'order-update',
      title: `${statusEmoji} Estado Actualizado`,
      message: `Pedido #${orderId.slice(-6)} ahora está ${statusText}`,
      orderId
    });
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'awaiting-payment':
        return 'esperando pago';
      case 'pending':
        return 'pendiente';
      case 'preparing':
        return 'en preparación';
      case 'ready':
        return 'listo para entregar';
      case 'completed':
        return 'completado';
      case 'cancelled':
        return 'cancelado';
      default:
        return status;
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'awaiting-payment':
        return '💳';
      case 'pending':
        return '⏳';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '✅';
      case 'completed':
        return '🎉';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  }
}