import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, Filter, Volume2, VolumeX } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { SupabaseRealtimeService } from '../../services/supabase-realtime.service';
import { NotificationService } from '../../services/notification.service';
import { OrderCardComponent } from '../order-card/order-card.component';
import { KitchenStatsComponent } from '../kitchen-stats/kitchen-stats.component';
import { DailySummaryComponent } from '../daily-summary/daily-summary.component';
import { SkeletonCardComponent } from '../skeleton/skeleton-card.component';
import { PullToRefreshDirective } from '../../directives/pull-to-refresh.directive';
import { Order, OrderStatus } from '../../models/types';
import { Subscription, combineLatest } from 'rxjs';

interface StatusOption {
  value: OrderStatus | 'all';
  label: string;
  color: string;
}

@Component({
  selector: 'app-kitchen-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, OrderCardComponent, KitchenStatsComponent, DailySummaryComponent, SkeletonCardComponent, PullToRefreshDirective],
  templateUrl: './kitchen-view.component.html',
  styleUrls: ['./kitchen-view.component.css']
})
export class KitchenViewComponent implements OnInit, OnDestroy {
  Bell = Bell;
  Filter = Filter;
  Volume2 = Volume2;
  VolumeX = VolumeX;
  
  orders: Order[] = [];
  archivedOrders: Order[] = [];
  statusFilter: OrderStatus | 'all' = 'all';
  filteredOrders: Order[] = [];
  hasNewOrders = false;
  newOrdersCount = 0;
  isConnected = false;
  soundEnabled = true;
  lastOrderCount = 0;
  isLoading = true;
  skeletons = Array(3);

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
    private realtimeService: SupabaseRealtimeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.appService.loadingOrders$.subscribe(l => this.isLoading = l)
    );

    this.subscriptions.push(
      combineLatest([this.appService.orders$, this.appService.archivedOrders$]).subscribe(([orders, archived]) => {
        const previousPendingCount = this.orders.filter(o => o.status === 'pending').length;
        this.orders = orders;
        this.archivedOrders = archived.filter(o => o.status === 'completed');
        this.isLoading = false;

        const currentPendingCount = orders.filter(o => o.status === 'pending').length;
        if (currentPendingCount > previousPendingCount) {
          this.hasNewOrders = true;
          this.newOrdersCount = currentPendingCount;
          setTimeout(() => { this.hasNewOrders = false; }, 10000);
        }

        this.updateFilteredOrders();
      })
    );

    this.subscriptions.push(
      this.realtimeService.connected$.subscribe(status => {
        this.isConnected = status;
      })
    );

    // Cargar preferencia de sonido
    this.soundEnabled = this.notificationService.isSoundEnabled();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onPullRefresh(done: () => void) { setTimeout(done, 1200); }

  staggerClass(i: number): string {
    const d = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5'];
    return `animate-fadeInUp ${d[i % d.length]}`;
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
    if (this.statusFilter === 'all') {
      this.filteredOrders = this.orders;
    } else if (this.statusFilter === 'completed') {
      this.filteredOrders = this.archivedOrders;
    } else {
      this.filteredOrders = this.orders.filter(o => o.status === this.statusFilter);
    }
  }

  getSelectedStatusLabel(): string {
    const option = this.statusOptions.find(opt => opt.value === this.statusFilter);
    return option ? option.label.toLowerCase() : '';
  }

  getOrderCountByStatus(status: OrderStatus | 'all'): number {
    if (status === 'all') return this.orders.length;
    if (status === 'completed') return this.archivedOrders.length;
    return this.orders.filter(o => o.status === status).length;
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