import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ChefHat, Lock, User, Eye, EyeOff } from 'lucide-angular';
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
  User = User;
  Eye = Eye;
  EyeOff = EyeOff;

  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  isModal = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar si se debe mostrar como modal
    this.authService.showLoginModal$.subscribe(showModal => {
      this.isModal = showModal;
    });
  }

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor ingresa usuario y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simular delay de autenticación
    setTimeout(() => {
      const success = this.authService.login(this.username, this.password);

      if (!success) {
        this.errorMessage = 'Usuario o contraseña incorrectos';
      } else {
        // Si es modal, cerrar y navegar a la vista solicitada
        if (this.isModal) {
          this.authService.closeLoginModal();
          // Navegar a kitchen por defecto después del login
          this.router.navigate(['/kitchen']);
        }
      }

      this.isLoading = false;
    }, 1000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  closeModal() {
    this.authService.closeLoginModal();
  }
}