import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, Filter, Volume2, VolumeX } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';
import { OrderCardComponent } from '../order-card/order-card.component';
import { KitchenStatsComponent } from '../kitchen-stats/kitchen-stats.component';
import { DailySummaryComponent } from '../daily-summary/daily-summary.component';
import { Order, OrderStatus } from '../../models/types';
import { Subscription } from 'rxjs';

interface StatusOption {
  value: OrderStatus | 'all';
  label: string;
  color: string;
}

@Component({
  selector: 'app-kitchen-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, OrderCardComponent, KitchenStatsComponent, DailySummaryComponent],
  templateUrl: './kitchen-view.component.html',
  styleUrls: ['./kitchen-view.component.css']
})
export class KitchenViewComponent implements OnInit, OnDestroy {
  Bell = Bell;
  Filter = Filter;
  Volume2 = Volume2;
  VolumeX = VolumeX;
  
  orders: Order[] = [];
  statusFilter: OrderStatus | 'all' = 'all';
  filteredOrders: Order[] = [];
  hasNewOrders = false;
  newOrdersCount = 0;
  isConnected = false;
  soundEnabled = true;
  lastOrderCount = 0;

  private subscriptions: Subscription[] = [];

  statusOptions: StatusOption[] = [
    { value: 'all', label: 'Todas', color: 'bg-gray-500' },
    { value: 'pending', label: 'Pendientes', color: 'bg-[#fac20a]' },
    { value: 'preparing', label: 'Preparando', color: 'bg-[#ed450d]' },
    { value: 'ready', label: 'Listos', color: 'bg-[#8624ce]' },
    { value: 'completed', label: 'Completados', color: 'bg-green-500' }
  ];

  constructor(
    private appService: AppService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Suscribirse a las órdenes
    this.subscriptions.push(
      this.appService.orders$.subscribe(orders => {
        const previousPendingCount = this.orders.filter(o => o.status === 'pending').length;
        this.orders = orders;
        
        const currentPendingCount = orders.filter(o => o.status === 'pending').length;
        
        // Detectar nuevas órdenes pendientes
        if (currentPendingCount > previousPendingCount) {
          this.hasNewOrders = true;
          this.newOrdersCount = currentPendingCount;
          
          // Auto-ocultar la alerta después de 10 segundos
          setTimeout(() => {
            this.hasNewOrders = false;
          }, 10000);
        }
        
        this.updateFilteredOrders();
      })
    );

    // Suscribirse al estado de conexión WebSocket
    this.subscriptions.push(
      this.webSocketService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );

    // Cargar preferencia de sonido
    this.soundEnabled = this.notificationService.isSoundEnabled();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setStatusFilter(status: OrderStatus | 'all') {
    this.statusFilter = status;
    this.updateFilteredOrders();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.notificationService.setSoundEnabled(this.soundEnabled);
  }

  private updateFilteredOrders() {
    this.filteredOrders = this.statusFilter === 'all' 
      ? this.orders 
      : this.orders.filter(order => order.status === this.statusFilter);
  }

  getSelectedStatusLabel(): string {
    const option = this.statusOptions.find(opt => opt.value === this.statusFilter);
    return option ? option.label.toLowerCase() : '';
  }

  getOrderCountByStatus(status: OrderStatus | 'all'): number {
    if (status === 'all') {
      return this.orders.length;
    }
    return this.orders.filter(order => order.status === status).length;
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  isNewOrder(order: Order): boolean {
    // Considerar una orden como "nueva" si fue creada en los últimos 30 segundos
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    return order.timestamp > thirtySecondsAgo;
  }
}