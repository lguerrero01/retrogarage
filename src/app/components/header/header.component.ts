import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule, ChefHat, ShoppingCart, Menu, Settings, LogOut, User } from 'lucide-angular';
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
export class HeaderComponent implements OnInit {
  ChefHat = ChefHat;
  ShoppingCart = ShoppingCart;
  Menu = Menu;
  Settings = Settings;
  LogOut = LogOut;
  User = User;

  currentView: 'menu' | 'kitchen' | 'admin' = 'menu';
  cartItemCount = 0;
  isAuthenticated = false;
  currentUser: UserType | null = null;
  canAccessKitchen = false;
  canAccessAdmin = false;

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Detectar cambios de ruta para actualizar currentView
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentView();
    });

    // Actualizar la vista inicial
    this.updateCurrentView();

    this.appService.cart$.subscribe(cart => {
      this.cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
    });

    this.authService.authState$.subscribe(authState => {
      this.isAuthenticated = authState.isAuthenticated;
      this.currentUser = authState.user;
      this.canAccessKitchen = this.authService.canAccessKitchen();
      this.canAccessAdmin = this.authService.canAccessAdmin();
    });
  }

  private updateCurrentView() {
    const url = this.router.url;
    if (url.includes('/kitchen')) {
      this.currentView = 'kitchen';
    } else if (url.includes('/admin')) {
      this.currentView = 'admin';
    } else {
      this.currentView = 'menu';
    }
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