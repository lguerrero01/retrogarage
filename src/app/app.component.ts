import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { AppService } from './services/app.service';
import { AuthService } from './services/auth.service';
import { PushSubscriptionService } from './services/push-subscription.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, AuthModalComponent, BottomNavComponent, ToastComponent, ConfirmModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showLoginModal = false;

  constructor(
    private appService: AppService,
    private authService: AuthService,
    private pushService: PushSubscriptionService
  ) {}

  ngOnInit() {
    this.authService.showLoginModal$.subscribe(showModal => {
      this.showLoginModal = showModal;
    });

    // Suscribir al chef/admin para push notifications al loguearse
    this.authService.authState$.subscribe(state => {
      if (state.isAuthenticated && state.user && this.authService.hasRole('chef')) {
        this.pushService.subscribeUser(state.user.id);
      }
    });
  }
}