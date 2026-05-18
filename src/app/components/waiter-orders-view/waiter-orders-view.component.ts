import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, ClipboardList } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { OrderCardComponent } from '../order-card/order-card.component';
import { SkeletonCardComponent } from '../skeleton/skeleton-card.component';
import { Order } from '../../models/types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-waiter-orders-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, OrderCardComponent, SkeletonCardComponent],
  templateUrl: './waiter-orders-view.component.html'
})
export class WaiterOrdersViewComponent implements OnInit, OnDestroy {
  Bell = Bell;
  ClipboardList = ClipboardList;

  isLoading = true;
  skeletons = Array(2);

  readyOrders: Order[] = [];
  preparingOrders: Order[] = [];
  pendingOrders: Order[] = [];

  private subs: Subscription[] = [];

  constructor(
    private appService: AppService,
    private authService: AuthService
  ) {}

  get activeOrders(): Order[] {
    return [...this.readyOrders, ...this.preparingOrders, ...this.pendingOrders];
  }

  ngOnInit() {
    this.subs.push(
      this.appService.loadingOrders$.subscribe(l => this.isLoading = l)
    );

    this.subs.push(
      this.appService.orders$.subscribe(orders => {
        const userId = this.authService.getCurrentUser()?.id;
        const mine = userId ? orders.filter(o => o.waiterId === userId) : [];

        this.readyOrders = mine.filter(o => o.status === 'ready');
        this.preparingOrders = mine.filter(o => o.status === 'preparing');
        this.pendingOrders = mine.filter(o => o.status === 'pending');
        this.isLoading = false;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  trackById(_: number, order: Order): string {
    return order.id;
  }
}
