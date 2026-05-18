import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, Save, X, Eye, EyeOff, Upload, Tag, ChevronDown, Check, Globe } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { ProductSupabaseService } from '../../services/product-supabase.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { SkeletonCardComponent } from '../skeleton/skeleton-card.component';
import { PullToRefreshDirective } from '../../directives/pull-to-refresh.directive';
import { LandingConfigComponent } from '../landing-config/landing-config.component';
import { supabase } from '../../config/supabase.client';
import { MenuItem } from '../../models/types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SkeletonCardComponent, PullToRefreshDirective, LandingConfigComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  Plus = Plus;
  Edit = Edit;
  Trash2 = Trash2;
  Save = Save;
  X = X;
  Eye = Eye;
  EyeOff = EyeOff;
  Upload = Upload;
  Tag = Tag;
  ChevronDown = ChevronDown;
  Check = Check;
  Globe = Globe;

  showCategoryDropdown = false;
  showLandingConfig = false;
  private categoryManagerReturnToForm = false;

  menuItems: MenuItem[] = [];
  allCategories: string[] = [];
  showForm = false;
  showCategoryManager = false;
  editingItem: MenuItem | null = null;
  ingredientsText = '';
  newCategoryName = '';
  isSaving = false;
  isSavingCategory = false;
  isDeletingCategory: string | null = null;
  isDeleting: string | null = null;
  isUploadingImage = false;
  failedImages: Record<string, boolean> = {};
  imageUploadError = '';
  saveError = '';
  isLoading = true;
  skeletons = Array(4);

  formData: Partial<MenuItem> = this.emptyForm();

  private subs: Subscription[] = [];

  constructor(
    private appService: AppService,
    private productService: ProductSupabaseService,
    private categoryService: CategoryService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit() {
    this.subs.push(this.appService.loadingMenu$.subscribe(l => this.isLoading = l));

    this.subs.push(this.appService.menuItems$.subscribe(items => {
      this.menuItems = items;
      this.failedImages = {};
      if (items.length) this.isLoading = false;

      // Siembra categorías desde productos si el servicio aún está vacío
      const productCats = [...new Set(items.map(i => i.category).filter(Boolean))];
      this.categoryService.seedFromProducts(productCats);
    }));

    this.subs.push(this.categoryService.categories$.subscribe(cats => {
      // Merge: categorías del servicio + las derivadas de productos (por si hay alguna huérfana)
      const productCats = [...new Set(this.menuItems.map(i => i.category).filter(Boolean))];
      this.allCategories = [...new Set([...cats, ...productCats])].sort();
    }));
  }

  onPullRefresh(done: () => void) { setTimeout(done, 1200); }

  staggerClass(i: number): string {
    const d = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6'];
    return `animate-fadeInUp ${d[i % d.length]}`;
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  // --- Gestión de categorías ---

  openCategoryManager() {
    this.newCategoryName = '';
    this.showCategoryManager = true;
  }

  openCategoryManagerFromForm() {
    this.showCategoryDropdown = false;
    this.showForm = false;
    this.categoryManagerReturnToForm = true;
    this.newCategoryName = '';
    this.showCategoryManager = true;
  }

  closeCategoryManager() {
    this.showCategoryManager = false;
    this.newCategoryName = '';
    if (this.categoryManagerReturnToForm) {
      this.categoryManagerReturnToForm = false;
      this.showForm = true;
    }
  }

  async addCategory() {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.isSavingCategory = true;
    try {
      await this.categoryService.add(name);
      this.newCategoryName = '';
      this.toast.success(`Categoría "${name}" creada`);
    } catch (err) {
      this.toast.error('Error al crear la categoría');
    } finally {
      this.isSavingCategory = false;
    }
  }

  countByCategory(name: string): number {
    return this.menuItems.filter(i => i.category === name).length;
  }

  async deleteCategory(name: string) {
    const affected = this.menuItems.filter(i => i.category === name);
    if (affected.length > 0) {
      const ok = await this.confirmDialog.confirm({
        title: 'Eliminar categoría',
        message: `La categoría "${name}" está en uso por ${affected.length} producto(s). Se eliminará la categoría y los productos quedarán sin categoría.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        danger: true
      });
      if (!ok) return;
    }
    this.isDeletingCategory = name;
    try {
      // Limpia la categoría de todos los productos que la usan
      await Promise.all(
        affected.map(item => this.productService.update(item.id, { category: '' }))
      );
      await this.categoryService.remove(name);
      this.toast.success(`Categoría "${name}" eliminada`);
    } catch (err) {
      this.toast.error('Error al eliminar la categoría');
    } finally {
      this.isDeletingCategory = null;
    }
  }

  selectCategory(cat: string) {
    this.formData.category = cat;
    this.showCategoryDropdown = false;
  }

  openAddForm() {
    this.editingItem = null;
    this.formData = this.emptyForm();
    this.ingredientsText = '';
    this.saveError = '';
    this.showForm = true;
  }

  editItem(item: MenuItem) {
    this.editingItem = item;
    this.formData = { ...item };
    this.ingredientsText = item.ingredients?.join('\n') ?? '';
    this.saveError = '';
    this.showForm = true;
  }

  async toggleAvailability(item: MenuItem) {
    try {
      await this.productService.update(item.id, { available: !item.available });
      this.toast.success(item.available ? `"${item.name}" desactivado` : `"${item.name}" activado`);
    } catch (err) {
      this.toast.error('Error al cambiar disponibilidad');
      console.error('Error toggling availability:', err);
    }
  }

  async deleteItem(itemId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'Eliminar producto',
      message: '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    this.isDeleting = itemId;
    try {
      await this.productService.delete(itemId);
      this.toast.success('Producto eliminado');
    } catch (err) {
      this.toast.error('Error al eliminar el producto');
      console.error(err);
    } finally {
      this.isDeleting = null;
    }
  }

  async saveItem() {
    if (!this.formData.name?.trim()) { this.saveError = 'El nombre es obligatorio'; return; }
    if (!this.formData.description?.trim()) { this.saveError = 'La descripción es obligatoria'; return; }
    if (!this.formData.category?.trim()) { this.saveError = 'La categoría es obligatoria'; return; }
    if (!this.formData.price || this.formData.price <= 0) { this.saveError = 'El precio debe ser mayor a 0'; return; }

    const ingredients = this.ingredientsText
      ? this.ingredientsText.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const payload: Partial<MenuItem> = {
      ...this.formData,
      name: this.formData.name!.trim(),
      description: this.formData.description!.trim(),
      category: this.formData.category!.trim(),
      image: this.formData.image?.trim() || '',
      ingredients,
      customizable: ingredients.length > 0
    };

    this.isSaving = true;
    this.saveError = '';

    try {
      if (this.editingItem) {
        const updated = await this.productService.update(this.editingItem.id, payload);
        this.menuItems = this.menuItems.map(i => i.id === updated.id ? updated : i);
        this.toast.success(`"${updated.name}" actualizado`);
      } else {
        const created = await this.productService.create(payload as Omit<MenuItem, 'id'>);
        this.menuItems = [...this.menuItems, created];
        this.toast.success(`"${created.name}" creado`);
      }
      this.closeForm();
    } catch (err: any) {
      this.saveError = err?.message ?? 'Error al guardar el producto';
      this.toast.error(this.saveError);
      console.error(err);
    } finally {
      this.isSaving = false;
    }
  }

  async uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingImage = true;
    this.imageUploadError = '';

    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);

      this.formData.image = data.publicUrl;
    } catch (err: any) {
      this.imageUploadError = err?.message ?? 'Error al subir la imagen';
    } finally {
      this.isUploadingImage = false;
      input.value = '';
    }
  }

  closeForm() {
    this.showForm = false;
    this.showCategoryDropdown = false;
    this.editingItem = null;
    this.formData = this.emptyForm();
    this.ingredientsText = '';
    this.saveError = '';
    this.imageUploadError = '';
  }

  private emptyForm(): Partial<MenuItem> {
    return {
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      available: true,
      customizable: false,
      ingredients: []
    };
  }
}
