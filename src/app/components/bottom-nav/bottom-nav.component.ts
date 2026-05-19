import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LucideAngularModule, UtensilsCrossed, ShoppingCart, ChefHat, Settings, ClipboardList, Boxes, User } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';

interface Tab {
  id: string;
  label: string;
  route?: string;
  action?: () => void;
  activeWhen: () => boolean;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bottom-nav
                bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">

      <!-- Barra activa animada -->
      <div class="absolute top-0 h-0.5 bg-gradient-to-r from-[#2a23b8] to-[#8624ce] transition-all duration-300 rounded-full"
           [style.left]="activeBarLeft"
           [style.width]="activeBarWidth">
      </div>

      <div class="flex items-stretch h-16 px-1">

        <!-- Menú -->
        <button (click)="go('/menu')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('menu') ? 'text-[#2a23b8]' : 'text-gray-400'">
          <lucide-icon [img]="UtensilsCrossed" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Menú</span>
        </button>

        <!-- Pedido (carrito) -->
        <button (click)="openCart()"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors relative"
                [class]="isTabActive('cart') ? 'text-[#ed450d]' : 'text-gray-400'">
          <div class="relative">
            <lucide-icon [img]="ShoppingCart" class="h-5 w-5"></lucide-icon>
            <span *ngIf="cartCount > 0"
                  class="absolute -top-2 -right-2.5 bg-[#ed450d] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-badgePop">
              {{cartCount > 9 ? '9+' : cartCount}}
            </span>
          </div>
          <span class="text-[10px] font-semibold tracking-wide">Carrito</span>
        </button>

        <!-- Mis Pedidos (solo meseros: autenticados sin acceso a cocina) -->
        <button *ngIf="canOrders" (click)="go('/orders')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('orders') ? 'text-[#ed450d]' : 'text-gray-400'">
          <lucide-icon [img]="ClipboardList" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Pedidos</span>
        </button>

        <!-- Inventario (chef/admin) -->
        <button *ngIf="canInventory" (click)="go('/inventario')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('inventario') ? 'text-[#2a23b8]' : 'text-gray-400'">
          <lucide-icon [img]="Boxes" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Inventario</span>
        </button>

        <!-- Cocina -->
        <button *ngIf="canKitchen" (click)="go('/kitchen')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('kitchen') ? 'text-[#8624ce]' : 'text-gray-400'">
          <lucide-icon [img]="ChefHat" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Cocina</span>
        </button>

        <!-- Admin -->
        <button *ngIf="canAdmin" (click)="go('/admin')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('admin') ? 'text-[#fac20a]' : 'text-gray-400'">
          <lucide-icon [img]="Settings" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Admin</span>
        </button>

        <!-- Mis pedidos (cliente) -->
        <button *ngIf="isCustomer" (click)="go('/mis-pedidos')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('misped') ? 'text-[#ed450d]' : 'text-gray-400'">
          <lucide-icon [img]="ClipboardList" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Pedidos</span>
        </button>

        <!-- Mi cuenta (cliente) -->
        <button *ngIf="isCustomer" (click)="go('/cuenta')"
                class="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl press-effect transition-colors"
                [class]="isTabActive('cuenta') ? 'text-[#2a23b8]' : 'text-gray-400'">
          <lucide-icon [img]="User" class="h-5 w-5"></lucide-icon>
          <span class="text-[10px] font-semibold tracking-wide">Cuenta</span>
        </button>

      </div>
    </nav>
  `
})
export class BottomNavComponent implements OnInit, OnDestroy {
  UtensilsCrossed = UtensilsCrossed;
  ShoppingCart = ShoppingCart;
  ChefHat = ChefHat;
  Settings = Settings;
  ClipboardList = ClipboardList;
  Boxes = Boxes;
  User = User;

  currentUrl = '/menu';
  cartCount = 0;
  cartIsOpen = false;
  canKitchen = false;
  canAdmin = false;
  canOrders = false;
  canInventory = false;
  isCustomer = false;

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private appService: AppService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => this.currentUrl = e.urlAfterRedirects)
    );
    this.currentUrl = this.router.url;

    this.subs.push(
      this.appService.cart$.subscribe(cart => {
        this.cartCount = cart.reduce((n, i) => n + i.quantity, 0);
      })
    );

    this.subs.push(
      this.appService.cartOpen$.subscribe(open => {
        this.cartIsOpen = open;
      })
    );

    this.subs.push(
      this.authService.authState$.subscribe(state => {
        this.canKitchen = this.authService.canAccessKitchen();
        this.canAdmin = this.authService.canAccessAdmin();
        this.canInventory = this.authService.canAccessKitchen();
        this.isCustomer = this.authService.isCustomer();
        // Mis Pedidos (mesero): staff autenticado sin acceso a cocina
        this.canOrders = state.isAuthenticated && this.authService.isStaff() && !this.canKitchen;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  go(path: string) {
    // Si el usuario va a otra ruta, cierra el carrito
    if (!path.startsWith('/menu')) {
      this.appService.setCartOpen(false);
    }
    this.router.navigate([path]);
  }

  openCart() {
    if (!this.currentUrl.startsWith('/menu')) {
      this.router.navigate(['/menu']).then(() => {
        this.appService.setCartOpen(true);
      });
    } else {
      this.appService.setCartOpen(!this.cartIsOpen);
    }
  }

  isTabActive(tab: 'menu' | 'cart' | 'orders' | 'inventario' | 'kitchen' | 'admin' | 'misped' | 'cuenta'): boolean {
    const onMenu = this.currentUrl.startsWith('/menu');
    switch (tab) {
      case 'cart':       return onMenu && this.cartIsOpen;
      case 'menu':       return onMenu && !this.cartIsOpen;
      case 'orders':     return this.currentUrl.startsWith('/orders');
      case 'inventario': return this.currentUrl.startsWith('/inventario');
      case 'kitchen':    return this.currentUrl.startsWith('/kitchen');
      case 'admin':      return this.currentUrl.startsWith('/admin');
      case 'misped':     return this.currentUrl.startsWith('/mis-pedidos');
      case 'cuenta':     return this.currentUrl.startsWith('/cuenta');
    }
  }

  /** Tabs visibles en orden, según rol/estado (debe coincidir con el template) */
  private get visibleTabs(): Array<'menu' | 'cart' | 'orders' | 'inventario' | 'kitchen' | 'admin' | 'misped' | 'cuenta'> {
    const tabs: Array<'menu' | 'cart' | 'orders' | 'inventario' | 'kitchen' | 'admin' | 'misped' | 'cuenta'> = ['menu', 'cart'];
    if (this.canOrders) tabs.push('orders');
    if (this.canInventory) tabs.push('inventario');
    if (this.canKitchen) tabs.push('kitchen');
    if (this.canAdmin) tabs.push('admin');
    if (this.isCustomer) { tabs.push('misped', 'cuenta'); }
    return tabs;
  }

  private get activeIndex(): number {
    const i = this.visibleTabs.findIndex(t => this.isTabActive(t));
    return i < 0 ? 0 : i;
  }

  get activeBarWidth(): string {
    return `${100 / this.visibleTabs.length}%`;
  }

  get activeBarLeft(): string {
    return `${(this.activeIndex / this.visibleTabs.length) * 100}%`;
  }
}
