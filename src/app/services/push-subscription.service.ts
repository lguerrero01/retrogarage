import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../config/supabase.client';
import { environment } from '../../environments/environment';

const VAPID_PUBLIC_KEY = 'BGs7-MqCP7QfhnolxteCyb9qNSTtQ9PUeBNyf9NixGL_nRX1DanWENsdOP4wxG2_oXzMVrIHcPE2rPg3s9j-L2Y';

@Injectable({ providedIn: 'root' })
export class PushSubscriptionService {
  private swReg: ServiceWorkerRegistration | null = null;

  async subscribeUser(userId: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.subscribeNative(userId);
    } else {
      await this.subscribeWeb(userId);
    }
  }

  async unsubscribeUser(userId: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
    } else if (this.swReg) {
      const sub = await this.swReg.pushManager.getSubscription().catch(() => null);
      await sub?.unsubscribe();
    }
    await supabase.from('push_subscriptions').delete().eq('user_id', userId);
  }

  async sendToChefs(orderId: string, customerName: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${environment.supabase.url}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId, customerName }),
      });
    } catch (err) {
      console.warn('[Push] sendToChefs failed:', err);
    }
  }

  // ── Nativo (Capacitor / Android / iOS) ──────────────────────

  private async subscribeNative(userId: string): Promise<void> {
    let status = await PushNotifications.checkPermissions();

    if (status.receive === 'prompt') {
      status = await PushNotifications.requestPermissions();
    }
    if (status.receive !== 'granted') {
      console.warn('[Push] Native permission not granted');
      return;
    }

    // Create high-priority notification channel (Android 8+ / API 26+)
    await PushNotifications.createChannel({
      id: 'orders',
      name: 'Nuevos Pedidos',
      description: 'Notificaciones de pedidos entrantes',
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1, // VISIBILITY_PUBLIC
      sound: 'default',
      vibration: true,
      lights: true,
    });

    await PushNotifications.register();

    // Listener para recibir el token FCM
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] FCM token:', token.value);
      await supabase.from('push_subscriptions').upsert(
        { user_id: userId, type: 'fcm', fcm_token: token.value, subscription: null },
        { onConflict: 'user_id' }
      );
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] FCM registration error:', err);
    });

    // Manejar notificaciones recibidas con la app abierta
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notification received in foreground:', notification);
    });

    // Manejar tap en la notificación
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification tapped:', action);
    });
  }

  // ── Web (Chrome / Firefox / Edge) ───────────────────────────

  private async subscribeWeb(userId: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      await navigator.serviceWorker.register('/sw.js');
      this.swReg = await navigator.serviceWorker.ready;
    } catch (err) {
      console.warn('[Push] SW registration failed:', err);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
      const existing = await this.swReg.pushManager.getSubscription();
      const sub = existing ?? await this.swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from('push_subscriptions').upsert(
        { user_id: userId, type: 'web', subscription: sub.toJSON(), fcm_token: null },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.warn('[Push] Web push subscribe failed:', err);
    }
  }

  private urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from([...atob(b64)].map(c => c.charCodeAt(0)));
  }
}
