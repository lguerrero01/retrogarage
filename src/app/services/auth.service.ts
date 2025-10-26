import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User, AuthState } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>(this.getStoredAuthState());
  private showLoginModalSubject = new BehaviorSubject<boolean>(false);

  authState$ = this.authStateSubject.asObservable();
  showLoginModal$ = this.showLoginModalSubject.asObservable();

  // Usuarios predefinidos para demo
  private users: User[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Administrador'
    },
    {
      id: '2',
      username: 'chef',
      password: 'chef123',
      role: 'chef',
      name: 'Chef Principal'
    }
  ];

  constructor() {}

  private getStoredAuthState(): AuthState {
    try {
      const stored = localStorage.getItem('auth-state');
      if (stored) {
        const authState = JSON.parse(stored);
        return {
          isAuthenticated: authState.isAuthenticated || false,
          user: authState.user || null
        };
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
    return { isAuthenticated: false, user: null };
  }

  private updateAuthState(authState: AuthState) {
    localStorage.setItem('auth-state', JSON.stringify(authState));
    this.authStateSubject.next(authState);
  }

  login(username: string, password: string): boolean {
    const user = this.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      const authState: AuthState = {
        isAuthenticated: true,
        user: { ...user, password: '' } // No almacenar la contraseña
      };
      this.updateAuthState(authState);
      return true;
    }
    
    return false;
  }

  logout() {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null
    };
    this.updateAuthState(authState);
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  hasRole(role: 'admin' | 'chef'): boolean {
    const user = this.getCurrentUser();
    if (!user || !this.isAuthenticated()) return false;
    
    if (role === 'admin') {
      return user.role === 'admin';
    }
    
    if (role === 'chef') {
      return user.role === 'admin' || user.role === 'chef';
    }
    
    return false;
  }

  canAccessKitchen(): boolean {
    return this.hasRole('chef');
  }

  canAccessAdmin(): boolean {
    return this.hasRole('admin');
  }

  requestLogin() {
    this.showLoginModalSubject.next(true);
  }

  closeLoginModal() {
    this.showLoginModalSubject.next(false);
  }
}