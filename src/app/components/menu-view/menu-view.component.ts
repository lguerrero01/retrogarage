import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuCardComponent } from '../menu-card/menu-card.component';
import { CategoryFilterComponent } from '../category-filter/category-filter.component';
import { CartSummaryComponent } from '../cart-summary/cart-summary.component';
import { AppService } from '../../services/app.service';
import { MenuItem } from '../../models/types';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [CommonModule, MenuCardComponent, CategoryFilterComponent, CartSummaryComponent],
  templateUrl: './menu-view.component.html',
  styleUrls: ['./menu-view.component.css']
})
export class MenuViewComponent implements OnInit {
  menuItems: MenuItem[] = [];
  categories: string[] = [];
  selectedCategory = 'all';
  filteredItems: MenuItem[] = [];
  cartItemCount = 0;
  showMobileCart = false;

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.appService.menuItems$.subscribe(items => {
      this.menuItems = items;
      this.categories = [...new Set(this.menuItems.map(item => item.category))];
      this.updateFilteredItems();
    });

    this.appService.cart$.subscribe(cart => {
      this.cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
    });
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.updateFilteredItems();
  }

  private updateFilteredItems() {
    this.filteredItems = this.selectedCategory === 'all' 
      ? this.menuItems.filter(item => item.available)
      : this.menuItems.filter(item => item.category === this.selectedCategory && item.available);
  }

  toggleMobileCart() {
    this.showMobileCart = !this.showMobileCart;
  }
}