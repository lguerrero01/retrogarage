import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LucideAngularModule, UtensilsCrossed, ShoppingCart, ChefHat, Settings, ClipboardList } from 'lucide-angular';
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

  currentUrl = '/menu';
  cartCount = 0;
  cartIsOpen = false;
  canKitchen = false;
  canAdmin = false;
  canOrders = false;

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
        // Mis Pedidos: autenticado pero sin acceso a cocina (mesero puro)
        this.canOrders = state.isAuthenticated && !this.canKitchen;
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

  isTabActive(tab: 'menu' | 'cart' | 'orders' | 'kitchen' | 'admin'): boolean {
    const onMenu = this.currentUrl.startsWith('/menu');
    switch (tab) {
      case 'cart':    return onMenu && this.cartIsOpen;
      case 'menu':    return onMenu && !this.cartIsOpen;
      case 'orders':  return this.currentUrl.startsWith('/orders');
      case 'kitchen': return this.currentUrl.startsWith('/kitchen');
      case 'admin':   return this.currentUrl.startsWith('/admin');
    }
  }

  /** Número real de tabs visibles */
  private get tabCount(): number {
    return 2
      + (this.canOrders ? 1 : 0)
      + (this.canKitchen ? 1 : 0)
      + (this.canAdmin ? 1 : 0);
  }

  /** Índice del tab activo (0-based) */
  private get activeIndex(): number {
    if (this.isTabActive('menu'))    return 0;
    if (this.isTabActive('cart'))    return 1;
    if (this.isTabActive('orders'))  return 2;
    if (this.isTabActive('kitchen')) return this.canOrders ? 3 : 2;
    if (this.isTabActive('admin')) {
      let i = 2;
      if (this.canOrders)   i++;
      if (this.canKitchen)  i++;
      return i;
    }
    return 0;
  }

  get activeBarWidth(): string {
    return `${100 / this.tabCount}%`;
  }

  get activeBarLeft(): string {
    return `${(this.activeIndex / this.tabCount) * 100}%`;
  }
}
