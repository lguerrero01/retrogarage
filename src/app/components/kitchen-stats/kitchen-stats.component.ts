import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { Order } from '../../models/types';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-kitchen-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kitchen-stats.component.html',
  styleUrls: ['./kitchen-stats.component.css']
})
export class KitchenStatsComponent implements OnInit, OnDestroy {
  Clock = Clock;
  CheckCircle = CheckCircle;
  AlertCircle = AlertCircle;
  TrendingUp = TrendingUp;

  orders: Order[] = [];
  archivedOrders: Order[] = [];
  statCards: any[] = [];

  private sub?: Subscription;

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.sub = combineLatest([
      this.appService.orders$,
      this.appService.archivedOrders$
    ]).subscribe(([orders, archived]) => {
      this.orders = orders;
      this.archivedOrders = archived;
      this.updateStats();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private updateStats() {
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      pending: this.orders.filter(o => o.status === 'pending').length,
      preparing: this.orders.filter(o => o.status === 'preparing').length,
      ready: this.orders.filter(o => o.status === 'ready').length,
    };

    // Los pedidos completados van al historial (archivedOrders), no quedan en orders
    const completedToday = this.archivedOrders.filter(o =>
      o.status === 'completed' &&
      new Date(o.timestamp).toISOString().split('T')[0] === today
    );

    const totalRevenue = completedToday.reduce((sum, o) => sum + o.total, 0);

    this.statCards = [
      {
        title: 'Pendientes',
        value: stats.pending,
        icon: this.AlertCircle,
        color: 'bg-[#fac20a] text-[#2a23b8]',
        bgColor: 'bg-[#fac20a]/10 border-[#fac20a]/20'
      },
      {
        title: 'Preparando',
        value: stats.preparing,
        icon: this.Clock,
        color: 'bg-[#ed450d] text-white',
        bgColor: 'bg-[#ed450d]/10 border-[#ed450d]/20'
      },
      {
        title: 'Listos',
        value: stats.ready,
        icon: this.CheckCircle,
        color: 'bg-[#8624ce] text-white',
        bgColor: 'bg-[#8624ce]/10 border-[#8624ce]/20'
      },
      {
        title: 'Ingresos',
        value: `$${totalRevenue.toFixed(2)}`,
        icon: this.TrendingUp,
        color: 'bg-green-500 text-white',
        bgColor: 'bg-green-50 border-green-200'
      }
    ];
  }
}