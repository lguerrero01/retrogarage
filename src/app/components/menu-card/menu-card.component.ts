import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Minus, Settings } from 'lucide-angular';
import { MenuItem } from '../../models/types';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-menu-card',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './menu-card.component.html',
  styleUrls: ['./menu-card.component.css']
})
export class MenuCardComponent {
  @Input() item!: MenuItem;
  
  Plus = Plus;
  Minus = Minus;
  Settings = Settings;
  
  quantity = 1;
  isAdding = false;
  showCustomization = false;
  selectedIngredients: string[] = [];
  removedIngredients: string[] = [];

  constructor(private appService: AppService) {}

  ngOnInit() {
    if (this.item.ingredients) {
      this.selectedIngredients = [...this.item.ingredients];
    }
  }

  increaseQuantity() {
    this.quantity++;
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  toggleCustomization() {
    this.showCustomization = !this.showCustomization;
  }

  isIngredientSelected(ingredient: string): boolean {
    return this.selectedIngredients.includes(ingredient);
  }

  toggleIngredient(ingredient: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedIngredients.includes(ingredient)) {
        this.selectedIngredients.push(ingredient);
      }
      this.removedIngredients = this.removedIngredients.filter(ing => ing !== ingredient);
    } else {
      this.selectedIngredients = this.selectedIngredients.filter(ing => ing !== ingredient);
      if (!this.removedIngredients.includes(ingredient)) {
        this.removedIngredients.push(ingredient);
      }
    }
  }

  addToCart() {
    this.isAdding = true;
    
    const cartItem = {
      ...this.item,
      quantity: this.quantity,
      selectedIngredients: this.item.customizable ? [...this.selectedIngredients] : undefined,
      removedIngredients: this.item.customizable && this.removedIngredients.length > 0 ? [...this.removedIngredients] : undefined
    };
    
    this.appService.addToCart(cartItem);
    
    setTimeout(() => {
      this.quantity = 1;
      this.isAdding = false;
      this.showCustomization = false;
      if (this.item.ingredients) {
        this.selectedIngredients = [...this.item.ingredients];
        this.removedIngredients = [];
      }
    }, 500);
  }
}