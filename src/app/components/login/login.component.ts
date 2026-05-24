import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LucideAngularModule, ChefHat, Lock, Mail, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  ChefHat = ChefHat;
  Lock = Lock;
  Mail = Mail;
  Eye = Eye;
  EyeOff = EyeOff;

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  isModal = false;

  private sub?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.sub = this.authService.showLoginModal$.subscribe(showModal => {
      this.isModal = showModal;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingresa correo y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.login(this.email, this.password);

      if (!success) {
        this.errorMessage = 'Correo o contraseña incorrectos';
      } else if (this.isModal) {
        this.authService.closeLoginModal();
      }
    } catch (err: any) {
      if (err?.message === 'TIMEOUT') {
        // Clear stale session so the next attempt works without page reload
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
        this.errorMessage = 'La conexión tardó demasiado. Intenta de nuevo.';
      } else {
        this.errorMessage = 'Correo o contraseña incorrectos';
      }
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  closeModal() {
    this.authService.closeLoginModal();
  }
}
