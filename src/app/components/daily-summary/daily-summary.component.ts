import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Printer, Calendar, TrendingUp, DollarSign } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { BillingService } from '../../services/billing.service';
import { OrderApiService } from '../../services/order-api.service';
import { Order, DailySummary } from '../../models/types';
import { apiOrderToOrder } from '../../models/adapters';

@Component({
  selector: 'app-daily-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './daily-summary.component.html',
  styleUrls: ['./daily-summary.component.css']
})
export class DailySummaryComponent implements OnInit {
  FileText = FileText;
  Printer = Printer;
  Calendar = Calendar;
  TrendingUp = TrendingUp;
  DollarSign = DollarSign;

  activeOrders: Order[] = [];
  archivedOrders: Order[] = [];
  dailySummary: DailySummary | null = null;
  selectedDate = new Date();
  isLoadingHistory = false;

  constructor(
    private appService: AppService,
    private billingService: BillingService,
    private orderApiService: OrderApiService
  ) {}

  ngOnInit() {
    this.appService.orders$.subscribe(orders => {
      this.activeOrders = orders;
      this.generateSummary();
    });
    this.loadArchivedOrders();
  }

  private loadArchivedOrders() {
    this.isLoadingHistory = true;
    this.orderApiService.getArchivedOrders()
      .then(apiOrders => {
        this.archivedOrders = apiOrders.map(o => apiOrderToOrder(o));
        this.generateSummary();
      })
      .catch(() => {
        // Continuar solo con órdenes activas si falla el historial
      })
      .finally(() => {
        this.isLoadingHistory = false;
      });
  }

  selectDate() {
    const dateInput = prompt('Ingresa la fecha (YYYY-MM-DD):', this.selectedDate.toISOString().split('T')[0]);
    if (dateInput) {
      const newDate = new Date(dateInput);
      if (!isNaN(newDate.getTime())) {
        this.selectedDate = newDate;
        this.loadArchivedOrders();
      }
    }
  }

  generateSummary() {
    const allOrders = [...this.activeOrders, ...this.archivedOrders];
    this.dailySummary = this.billingService.generateDailySummary(allOrders, this.selectedDate);
  }

  printSummary() {
    if (this.dailySummary) {
      const allOrders = [...this.activeOrders, ...this.archivedOrders];
      this.billingService.printDailySummary(this.dailySummary, allOrders);
    }
  }

  getCategoriesArray() {
    if (!this.dailySummary) return [];
    return Object.entries(this.dailySummary.ordersByCategory)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  getAverageOrderValue(): string {
    if (!this.dailySummary || this.dailySummary.totalOrders === 0) return '$0.00';
    const average = this.dailySummary.totalRevenue / this.dailySummary.totalOrders;
    return `$${average.toFixed(2)}`;
  }
}