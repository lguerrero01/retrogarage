import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LucideAngularModule, ChefHat, ShoppingCart, Menu, Settings, LogOut, User, Boxes, ClipboardList, Receipt } from 'lucide-angular';
import { AppService } from '../../services/app.service';
import { AuthService } from '../../services/auth.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { ConnectionStatusComponent } from '../connection-status/connection-status.component';
import { User as UserType } from '../../models/types';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NotificationPanelComponent, ConnectionStatusComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  ChefHat = ChefHat;
  ShoppingCart = ShoppingCart;
  Menu = Menu;
  Settings = Settings;
  LogOut = LogOut;
  User = User;
  Boxes = Boxes;
  ClipboardList = ClipboardList;
  Receipt = Receipt;

  currentView: 'menu' | 'kitchen' | 'admin' | 'orders' | 'inventario' | 'cuenta' | 'misped' | 'pagos' = 'menu';
  cartItemCount = 0;
  isAuthenticated = false;
  currentUser: UserType | null = null;
  canAccessKitchen = false;
  canAccessAdmin = false;
  canAccessInventory = false;
  isCustomer = false;

  private subs: Subscription[] = [];

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Detectar cambios de ruta para actualizar currentView
    this.subs.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.updateCurrentView();
      })
    );

    // Actualizar la vista inicial
    this.updateCurrentView();

    this.subs.push(
      this.appService.cart$.subscribe(cart => {
        this.cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
      })
    );

    this.subs.push(
      this.authService.authState$.subscribe(authState => {
        this.isAuthenticated = authState.isAuthenticated;
        this.currentUser = authState.user;
        this.canAccessKitchen = this.authService.canAccessKitchen();
        this.canAccessAdmin = this.authService.canAccessAdmin();
        this.canAccessInventory = this.authService.canAccessKitchen();
        this.isCustomer = this.authService.isCustomer();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private updateCurrentView() {
    const url = this.router.url;
    if (url.includes('/kitchen')) {
      this.currentView = 'kitchen';
    } else if (url.includes('/admin')) {
      this.currentView = 'admin';
    } else if (url.includes('/inventario')) {
      this.currentView = 'inventario';
    } else if (url.includes('/mis-pedidos')) {
      this.currentView = 'misped';
    } else if (url.includes('/cuenta')) {
      this.currentView = 'cuenta';
    } else if (url.includes('/pagos')) {
      this.currentView = 'pagos';
    } else if (url.includes('/orders')) {
      this.currentView = 'orders';
    } else {
      this.currentView = 'menu';
    }
  }

  goToInventory() {
    this.router.navigate(['/inventario']);
  }

  goToCuenta() {
    this.router.navigate(['/cuenta']);
  }

  goToMisPedidos() {
    this.router.navigate(['/mis-pedidos']);
  }

  goToPagos() {
    this.router.navigate(['/pagos']);
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  goToKitchen() {
    this.router.navigate(['/kitchen']);
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/menu']);
  }

  showLogin() {
    this.authService.requestLogin();
  }
}