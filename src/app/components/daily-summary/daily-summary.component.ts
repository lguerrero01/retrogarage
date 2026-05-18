import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Printer, Calendar, TrendingUp, DollarSign, ChevronLeft, ChevronRight, X } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { BillingService } from '../../services/billing.service';
import { OrderSupabaseService } from '../../services/order-supabase.service';
import { Order, DailySummary } from '../../models/types';
import { Subscription, combineLatest } from 'rxjs';

@Component({
  selector: 'app-daily-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './daily-summary.component.html',
  styleUrls: ['./daily-summary.component.css']
})
export class DailySummaryComponent implements OnInit, OnDestroy {
  FileText = FileText;
  Printer = Printer;
  Calendar = Calendar;
  TrendingUp = TrendingUp;
  DollarSign = DollarSign;
  ChevronLeft = ChevronLeft;
  ChevronRight = ChevronRight;
  X = X;

  activeOrders: Order[] = [];
  archivedOrders: Order[] = [];
  dailySummary: DailySummary | null = null;
  selectedDate = new Date();
  showDatePicker = false;
  tempDate = this.toDateString(new Date());

  get today(): Date { return new Date(); }
  get yesterday(): Date { const d = new Date(); d.setDate(d.getDate() - 1); return d; }
  get weekAgo(): Date { const d = new Date(); d.setDate(d.getDate() - 7); return d; }

  private sub?: Subscription;

  loadingHistory = false;

  constructor(
    private appService: AppService,
    private billingService: BillingService,
    private orderService: OrderSupabaseService
  ) {}

  ngOnInit() {
    this.sub = combineLatest([
      this.appService.orders$,
      this.appService.archivedOrders$
    ]).subscribe(([active, archived]) => {
      this.activeOrders = active;
      this.archivedOrders = archived;
      this.generateSummary();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toDateString(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  openDatePicker() {
    this.tempDate = this.toDateString(this.selectedDate);
    this.showDatePicker = true;
  }

  applyDate() {
    const d = new Date(this.tempDate + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      this.selectedDate = d;
      this.loadForDate(d);
    }
    this.showDatePicker = false;
  }

  shiftDay(delta: number) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + delta);
    this.selectedDate = d;
    this.tempDate = this.toDateString(d);
    this.loadForDate(d);
  }

  private isWithinLast30Days(date: Date): boolean {
    return date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  private async loadForDate(date: Date) {
    if (this.isWithinLast30Days(date)) {
      this.generateSummary();
      return;
    }
    this.loadingHistory = true;
    try {
      const dateStr = this.toDateString(date);
      const orders = await this.orderService.getArchivedOrdersForDate(dateStr);
      this.dailySummary = this.billingService.generateDailySummary(
        [...this.activeOrders, ...orders], date
      );
    } catch (err) {
      console.error('Error loading history for date:', err);
    } finally {
      this.loadingHistory = false;
    }
  }

  get isToday(): boolean {
    return this.toDateString(this.selectedDate) === this.toDateString(new Date());
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