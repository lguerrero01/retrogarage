import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MenuCardComponent } from '../menu-card/menu-card.component';
import { CategoryFilterComponent } from '../category-filter/category-filter.component';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';
import { SkeletonCardComponent } from '../skeleton/skeleton-card.component';
import { PullToRefreshDirective } from '../../directives/pull-to-refresh.directive';
import { AppService } from '../../services/app.service';
import { RestaurantConfigService, DayHours, OpenState, DAY_NAMES } from '../../services/restaurant-config.service';
import { MenuItem } from '../../models/types';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [CommonModule, MenuCardComponent, CategoryFilterComponent, CartSummaryComponent, SkeletonCardComponent, PullToRefreshDirective],
  templateUrl: './menu-view.component.html',
  styleUrls: ['./menu-view.component.css']
})
export class MenuViewComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  categories: string[] = [];
  selectedCategory = 'all';
  filteredItems: MenuItem[] = [];
  cartItemCount = 0;
  showMobileCart = false;
  isLoading = true;
  skeletons = Array(4);

  sheetStartY = 0;
  sheetTranslate = 0;
  sheetDragging = false;

  openState: OpenState = { open: true, label: '' };
  businessHours: DayHours[] = [];
  showHours = false;

  private subs: Subscription[] = [];

  constructor(
    public appService: AppService,
    public configService: RestaurantConfigService
  ) {}

  ngOnInit() {
    this.configService.load().catch(() => {});

    this.subs.push(
      this.configService.openState$.subscribe(s => (this.openState = s))
    );

    this.subs.push(
      this.configService.config$.subscribe(c => {
        const order = [1, 2, 3, 4, 5, 6, 0];
        this.businessHours = order
          .map(day => (c.business_hours ?? []).find(h => h.day === day))
          .filter((h): h is DayHours => !!h);
      })
    );

    this.subs.push(
      this.appService.loadingMenu$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.subs.push(
      this.appService.menuItems$.subscribe(items => {
        this.menuItems = items;
        this.categories = [...new Set(items.map(i => i.category).filter(Boolean))];
        this.updateFilteredItems();
        if (items.length) this.isLoading = false;
      })
    );

    this.subs.push(
      this.appService.cart$.subscribe(cart => {
        this.cartItemCount = cart.reduce((n, i) => n + i.quantity, 0);
      })
    );

    this.subs.push(
      this.appService.cartOpen$.subscribe(open => {
        this.showMobileCart = open;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.updateFilteredItems();
  }

  onPullRefresh(done: () => void) {
    // Forzar recarga — el realtime service ya mantiene la conexión activa
    setTimeout(done, 1200);
  }

  staggerClass(index: number): string {
    const classes = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6','stagger-7','stagger-8'];
    return `animate-fadeInUp ${classes[index % classes.length]}`;
  }

  private updateFilteredItems() {
    this.filteredItems = this.selectedCategory === 'all'
      ? this.menuItems.filter(i => i.available)
      : this.menuItems.filter(i => i.category === this.selectedCategory && i.available);
  }

  toggleMobileCart() { this.appService.setCartOpen(!this.showMobileCart); }

  onSheetDragStart(e: TouchEvent) {
    this.sheetStartY = e.touches[0].clientY;
    this.sheetDragging = true;
    this.sheetTranslate = 0;
  }

  onSheetDragMove(e: TouchEvent) {
    if (!this.sheetDragging) return;
    const delta = e.touches[0].clientY - this.sheetStartY;
    this.sheetTranslate = Math.max(0, delta);
  }

  onSheetDragEnd() {
    if (!this.sheetDragging) return;
    this.sheetDragging = false;
    if (this.sheetTranslate > 100) {
      this.appService.setCartOpen(false);
    }
    this.sheetTranslate = 0;
  }

  dayName(day: number): string {
    return DAY_NAMES[day] ?? '';
  }

  isToday(day: number): boolean {
    return this.configService.todayDow === day;
  }
}
