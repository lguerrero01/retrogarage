import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, X, Check, CheckCheck, Trash2 } from 'lucide-angular';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.css']
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  Bell = Bell;
  X = X;
  Check = Check;
  CheckCheck = CheckCheck;
  Trash2 = Trash2;

  notifications: Notification[] = [];
  unreadCount = 0;
  showPanel = false;

  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      }),
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  togglePanel() {
    this.showPanel = !this.showPanel;
  }

  markAsRead(notificationId: string) {
    this.notificationService.markAsRead(notificationId);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifications() {
    this.notificationService.clearNotifications();
    this.showPanel = false;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  getNotificationIcon(type: string) {
    switch (type) {
      case 'new-order':
        return Bell;
      case 'order-update':
        return Check;
      default:
        return Bell;
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'new-order':
        return 'bg-[#ed450d] text-white';
      case 'order-update':
        return 'bg-[#8624ce] text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      case 'warning':
        return 'bg-[#fac20a] text-[#2a23b8]';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'hace un momento';
    }
  }
}