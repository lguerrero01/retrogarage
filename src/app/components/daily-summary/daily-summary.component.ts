import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Printer, Calendar, TrendingUp, DollarSign } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { BillingService } from '../../services/billing.service';
import { Order, DailySummary } from '../../models/types';

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

  orders: Order[] = [];
  dailySummary: DailySummary | null = null;
  selectedDate = new Date();

  constructor(
    private appService: AppService,
    private billingService: BillingService
  ) {}

  ngOnInit() {
    this.appService.orders$.subscribe(orders => {
      this.orders = orders;
      this.generateSummary();
    });
  }

  selectDate() {
    const dateInput = prompt('Ingresa la fecha (YYYY-MM-DD):', this.selectedDate.toISOString().split('T')[0]);
    if (dateInput) {
      const newDate = new Date(dateInput);
      if (!isNaN(newDate.getTime())) {
        this.selectedDate = newDate;
        this.generateSummary();
      }
    }
  }

  generateSummary() {
    this.dailySummary = this.billingService.generateDailySummary(this.orders, this.selectedDate);
  }

  printSummary() {
    if (this.dailySummary) {
      this.billingService.printDailySummary(this.dailySummary, this.orders);
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