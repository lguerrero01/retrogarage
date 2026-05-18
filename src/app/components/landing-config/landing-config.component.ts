import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, X, Upload, Image, Globe, Phone, MapPin,
  Clock, Star, Instagram, Facebook, Smartphone, Trash2, Plus,
  Save, ChevronLeft, ChevronRight, ExternalLink, Info, Camera
} from 'lucide-angular';
import { RestaurantConfigService, RestaurantConfig } from '../../services/restaurant-config.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

type Tab = 'info' | 'images' | 'social';

@Component({
  selector: 'app-landing-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
     (click)="onBackdrop($event)">
  <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] flex flex-col"
       (click)="$event.stopPropagation()">

    <!-- Header -->
    <div class="bg-gradient-to-r from-[#2a23b8] to-[#8624ce] px-5 py-4 rounded-t-2xl sm:rounded-t-2xl flex items-center justify-between flex-shrink-0">
      <div>
        <h2 class="text-white font-bold text-lg">Configuración de Landing</h2>
        <p class="text-white/70 text-xs mt-0.5">Personaliza la página pública del restaurante</p>
      </div>
      <button (click)="close.emit()" class="text-white/80 hover:text-white p-1.5 rounded-lg transition-colors">
        <lucide-icon [img]="X" class="h-5 w-5"></lucide-icon>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b flex-shrink-0">
      <button *ngFor="let t of tabs" (click)="activeTab = t.id"
        class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors"
        [class.text-[#2a23b8]]="activeTab === t.id"
        [class.border-b-2]="activeTab === t.id"
        [class.border-[#2a23b8]]="activeTab === t.id"
        [class.text-gray-500]="activeTab !== t.id">
        <lucide-icon [img]="t.icon" class="h-4 w-4"></lucide-icon>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="overflow-y-auto flex-1 p-5">

      <!-- TAB: Info -->
      <div *ngIf="activeTab === 'info'" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nombre del restaurante</label>
          <input type="text" [(ngModel)]="form.name" placeholder="Retro Garage"
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Eslogan</label>
          <input type="text" [(ngModel)]="form.tagline" placeholder="La experiencia gastronómica con estilo retro"
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
          <textarea [(ngModel)]="form.description" rows="3" placeholder="Cuéntale a tus clientes sobre el restaurante..."
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Teléfono</label>
            <input type="tel" [(ngModel)]="form.phone" placeholder="+52 55 0000 0000"
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Horario</label>
            <input type="text" [(ngModel)]="form.hours" placeholder="Lun-Dom 12:00 - 23:00"
              class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dirección</label>
          <input type="text" [(ngModel)]="form.address" placeholder="Av. Principal #123, Ciudad"
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
        </div>
      </div>

      <!-- TAB: Imágenes -->
      <div *ngIf="activeTab === 'images'" class="space-y-6">

        <!-- Hero image -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Imagen Principal (Hero)</label>
          <p class="text-xs text-gray-400 mb-2">Se muestra en la parte superior de la landing. Recomendado: 1920×1080px</p>
          <div class="relative rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center border-2 border-dashed border-gray-200"
               [class.border-solid]="form.hero_image" [class.border-gray-200]="!form.hero_image">
            <img *ngIf="form.hero_image" [src]="form.hero_image" class="w-full h-full object-cover absolute inset-0">
            <div *ngIf="!form.hero_image" class="text-center text-gray-400">
              <lucide-icon [img]="Image" class="h-10 w-10 mx-auto mb-1 opacity-40"></lucide-icon>
              <p class="text-xs">Sin imagen</p>
            </div>
            <div *ngIf="form.hero_image" class="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <button (click)="form.hero_image = ''" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Quitar</button>
            </div>
          </div>
          <label class="mt-2 flex items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 transition-colors">
            <lucide-icon [img]="Upload" class="h-4 w-4"></lucide-icon>
            <span>{{ uploadingSlot === 'hero' ? 'Subiendo...' : 'Subir imagen' }}</span>
            <input type="file" accept="image/*" class="hidden" (change)="uploadSlot($event, 'hero')" [disabled]="!!uploadingSlot">
          </label>
        </div>

        <!-- Logo -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Logo</label>
          <p class="text-xs text-gray-400 mb-2">Logo del restaurante. Recomendado: fondo transparente, 400×400px</p>
          <div class="flex items-center gap-4">
            <div class="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0"
                 [class.border-solid]="form.logo_image">
              <img *ngIf="form.logo_image" [src]="form.logo_image" class="w-full h-full object-contain">
              <lucide-icon *ngIf="!form.logo_image" [img]="Image" class="h-8 w-8 text-gray-300"></lucide-icon>
            </div>
            <div class="flex-1 space-y-2">
              <label class="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-600 transition-colors">
                <lucide-icon [img]="Upload" class="h-4 w-4"></lucide-icon>
                <span>{{ uploadingSlot === 'logo' ? 'Subiendo...' : 'Subir logo' }}</span>
                <input type="file" accept="image/*" class="hidden" (change)="uploadSlot($event, 'logo')" [disabled]="!!uploadingSlot">
              </label>
              <button *ngIf="form.logo_image" (click)="form.logo_image = ''"
                class="text-xs text-red-500 hover:text-red-700">Quitar logo</button>
            </div>
          </div>
        </div>

        <!-- About image -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Imagen "Acerca de"</label>
          <p class="text-xs text-gray-400 mb-2">Foto del restaurante o ambiente. Se muestra en la sección "Sobre nosotros". Recomendado: 800×600px</p>
          <div class="relative rounded-xl overflow-hidden bg-gray-100 h-40 flex items-center justify-center border-2 border-dashed border-gray-200"
               [class.border-solid]="form.about_image">
            <img *ngIf="form.about_image" [src]="form.about_image" class="w-full h-full object-cover absolute inset-0">
            <div *ngIf="!form.about_image" class="text-center text-gray-400">
              <lucide-icon [img]="Camera" class="h-8 w-8 mx-auto mb-1 opacity-40"></lucide-icon>
              <p class="text-xs">Sin imagen</p>
            </div>
            <div *ngIf="form.about_image" class="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <button (click)="form.about_image = ''" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Quitar</button>
            </div>
          </div>
          <label class="mt-2 flex items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 transition-colors">
            <lucide-icon [img]="Upload" class="h-4 w-4"></lucide-icon>
            <span>{{ uploadingSlot === 'about' ? 'Subiendo...' : 'Subir imagen' }}</span>
            <input type="file" accept="image/*" class="hidden" (change)="uploadSlot($event, 'about')" [disabled]="!!uploadingSlot">
          </label>
        </div>

        <!-- Gallery -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Galería de imágenes</label>
          <p class="text-xs text-gray-400 mb-3">Fotos del restaurante, platillos, ambiente. Se muestran en carrusel. Máximo 10 imágenes.</p>
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div *ngFor="let img of form.gallery_images; let i = index"
                 class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              <img [src]="img" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button (click)="removeGallery(i)" class="bg-red-500 text-white p-1.5 rounded-full">
                  <lucide-icon [img]="Trash2" class="h-3.5 w-3.5"></lucide-icon>
                </button>
              </div>
            </div>
            <label *ngIf="(form.gallery_images?.length ?? 0) < 10"
                   class="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#2a23b8] hover:bg-blue-50/50 transition-colors">
              <lucide-icon [img]="Plus" class="h-6 w-6 text-gray-300"></lucide-icon>
              <span class="text-xs text-gray-400 mt-1">{{ uploadingGallery ? '...' : 'Agregar' }}</span>
              <input type="file" accept="image/*" class="hidden" (change)="addGallery($event)" [disabled]="uploadingGallery">
            </label>
          </div>
        </div>
      </div>

      <!-- TAB: Social / Links -->
      <div *ngIf="activeTab === 'social'" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            <span class="flex items-center gap-1.5"><lucide-icon [img]="Smartphone" class="h-3.5 w-3.5"></lucide-icon> URL Play Store</span>
          </label>
          <input type="url" [(ngModel)]="form.playstore_url" placeholder="https://play.google.com/store/apps/details?id=..."
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            <span class="flex items-center gap-1.5"><lucide-icon [img]="Instagram" class="h-3.5 w-3.5"></lucide-icon> Instagram</span>
          </label>
          <input type="url" [(ngModel)]="form.instagram_url" placeholder="https://instagram.com/retrogarage"
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            <span class="flex items-center gap-1.5"><lucide-icon [img]="Facebook" class="h-3.5 w-3.5"></lucide-icon> Facebook</span>
          </label>
          <input type="url" [(ngModel)]="form.facebook_url" placeholder="https://facebook.com/retrogarage"
            class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2a23b8]/30 focus:border-[#2a23b8] outline-none">
        </div>

        <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
          <p class="text-xs text-blue-700 font-semibold mb-1 flex items-center gap-1.5">
            <lucide-icon [img]="Info" class="h-3.5 w-3.5"></lucide-icon>
            Landing page
          </p>
          <p class="text-xs text-blue-600">
            Los cambios que guardes aquí se reflejan automáticamente en la página pública del restaurante.
          </p>
          <a *ngIf="landingUrl" [href]="landingUrl" target="_blank"
             class="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#2a23b8] hover:underline">
            <lucide-icon [img]="ExternalLink" class="h-3.5 w-3.5"></lucide-icon>
            Ver landing page
          </a>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="px-5 py-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3 flex-shrink-0">
      <p *ngIf="saveError" class="text-xs text-red-500">{{ saveError }}</p>
      <p *ngIf="!saveError" class="text-xs text-gray-400">Los cambios se guardan en Supabase</p>
      <div class="flex gap-2 flex-shrink-0">
        <button (click)="close.emit()" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancelar</button>
        <button (click)="save()" [disabled]="isSaving"
          class="bg-[#2a23b8] hover:bg-[#2a23b8]/90 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <lucide-icon [img]="Save" class="h-4 w-4"></lucide-icon>
          {{ isSaving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

  </div>
</div>
  `
})
export class LandingConfigComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  X = X; Upload = Upload; Image = Image; Globe = Globe; Phone = Phone;
  MapPin = MapPin; Clock = Clock; Star = Star; Instagram = Instagram;
  Facebook = Facebook; Smartphone = Smartphone; Trash2 = Trash2;
  Plus = Plus; Save = Save; ChevronLeft = ChevronLeft; ChevronRight = ChevronRight;
  ExternalLink = ExternalLink; Info = Info; Camera = Camera;

  activeTab: Tab = 'info';
  isSaving = false;
  saveError = '';
  uploadingSlot: string | null = null;
  uploadingGallery = false;

  landingUrl = 'https://lguerrero01.github.io/retro-garage-landing/';

  tabs = [
    { id: 'info' as Tab, label: 'Info', icon: Info },
    { id: 'images' as Tab, label: 'Imágenes', icon: Image },
    { id: 'social' as Tab, label: 'Social / Links', icon: Globe }
  ];

  form: Partial<RestaurantConfig> = {};

  private sub: any;

  constructor(
    private configService: RestaurantConfigService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.configService.load().catch(() => {});
    this.sub = this.configService.config$.subscribe(c => {
      this.form = {
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        address: c.address,
        phone: c.phone,
        hours: c.hours,
        hero_image: c.hero_image,
        logo_image: c.logo_image,
        about_image: c.about_image,
        gallery_images: [...(c.gallery_images ?? [])],
        playstore_url: c.playstore_url,
        instagram_url: c.instagram_url,
        facebook_url: c.facebook_url
      };
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onBackdrop(e: MouseEvent) {
    if ((e.target as Element).classList.contains('fixed')) this.close.emit();
  }

  async uploadSlot(event: Event, slot: 'hero' | 'logo' | 'about') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingSlot = slot;
    try {
      const url = await this.configService.uploadImage(file, slot);
      if (slot === 'hero') this.form.hero_image = url;
      if (slot === 'logo') this.form.logo_image = url;
      if (slot === 'about') this.form.about_image = url;
      this.toast.success('Imagen subida');
    } catch {
      this.toast.error('Error al subir la imagen');
    } finally {
      this.uploadingSlot = null;
      (event.target as HTMLInputElement).value = '';
    }
  }

  async addGallery(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingGallery = true;
    try {
      const url = await this.configService.uploadImage(file, `gallery-${Date.now()}`);
      this.form.gallery_images = [...(this.form.gallery_images ?? []), url];
      this.toast.success('Foto agregada a la galería');
    } catch {
      this.toast.error('Error al subir la imagen');
    } finally {
      this.uploadingGallery = false;
      (event.target as HTMLInputElement).value = '';
    }
  }

  removeGallery(index: number) {
    this.form.gallery_images = (this.form.gallery_images ?? []).filter((_, i) => i !== index);
  }

  async save() {
    this.isSaving = true;
    this.saveError = '';
    try {
      await this.configService.save(this.form);
      this.toast.success('Configuración guardada');
    } catch (err: any) {
      this.saveError = err?.message ?? 'Error al guardar';
      this.toast.error('Error al guardar la configuración');
    } finally {
      this.isSaving = false;
    }
  }
}
