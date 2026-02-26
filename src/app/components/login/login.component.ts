import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChefHat, Lock, Mail, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
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

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.showLoginModal$.subscribe(showModal => {
      this.isModal = showModal;
    });
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
    } catch {
      this.errorMessage = 'Correo o contraseña incorrectos';
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
