import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { Order } from '../../models/types';

@Component({
  selector: 'app-kitchen-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kitchen-stats.component.html',
  styleUrls: ['./kitchen-stats.component.css']
})
export class KitchenStatsComponent implements OnInit {
  Clock = Clock;
  CheckCircle = CheckCircle;
  AlertCircle = AlertCircle;
  TrendingUp = TrendingUp;
  
  orders: Order[] = [];
  statCards: any[] = [];

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.appService.orders$.subscribe(orders => {
      this.orders = orders;
      this.updateStats();
    });
  }

  private updateStats() {
    const stats = {
      pending: this.orders.filter(order => order.status === 'pending').length,
      preparing: this.orders.filter(order => order.status === 'preparing').length,
      ready: this.orders.filter(order => order.status === 'ready').length,
      completed: this.orders.filter(order => order.status === 'completed').length,
    };

    const totalRevenue = this.orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0);

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