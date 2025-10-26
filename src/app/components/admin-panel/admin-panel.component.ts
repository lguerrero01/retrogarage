import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, Save, X, Upload } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { MenuItem } from '../../models/types';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  Plus = Plus;
  Edit = Edit;
  Trash2 = Trash2;
  Save = Save;
  X = X;
  Upload = Upload;

  menuItems: MenuItem[] = [];
  showAddForm = false;
  editingItem: MenuItem | null = null;
  ingredientsText = '';

  formData: Partial<MenuItem> = {
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    available: true,
    customizable: false,
    ingredients: []
  };

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.appService.menuItems$.subscribe(items => {
      this.menuItems = items;
    });
  }

  editItem(item: MenuItem) {
    this.editingItem = item;
    this.formData = { ...item };
    this.ingredientsText = item.ingredients ? item.ingredients.join('\n') : '';
    this.showAddForm = false;
  }

  deleteItem(itemId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.appService.deleteMenuItem(itemId);
    }
  }

  saveItem() {
    if (!this.formData.name || !this.formData.description || !this.formData.category || !this.formData.image) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const itemData = {
      ...this.formData,
      ingredients: this.formData.customizable && this.ingredientsText 
        ? this.ingredientsText.split('\n').filter(ing => ing.trim()) 
        : undefined
    } as MenuItem;

    if (this.editingItem) {
      this.appService.updateMenuItem(this.editingItem.id, itemData);
    } else {
      this.appService.addMenuItem(itemData);
    }

    this.cancelEdit();
  }

  cancelEdit() {
    this.showAddForm = false;
    this.editingItem = null;
    this.formData = {
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      available: true,
      customizable: false,
      ingredients: []
    };
    this.ingredientsText = '';
  }

  onImageError() {
    alert('No se pudo cargar la imagen. Verifica que la URL sea correcta.');
  }
}