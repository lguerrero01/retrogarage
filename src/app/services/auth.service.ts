import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getApps, initializeApp, getApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult
} from 'firebase/auth';
import { User, AuthState } from '../models/types';
import { firebaseConfig } from '../config/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;
  private authStateSubject = new BehaviorSubject<AuthState>({ isAuthenticated: false, user: null });
  private showLoginModalSubject = new BehaviorSubject<boolean>(false);

  authState$ = this.authStateSubject.asObservable();
  showLoginModal$ = this.showLoginModalSubject.asObservable();

  constructor() {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    this.auth = getAuth(app);

    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await getIdTokenResult(firebaseUser);
        const role = (tokenResult.claims['role'] as string) ?? 'waiter';
        const idToken = tokenResult.token;

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          name: firebaseUser.displayName ?? firebaseUser.email ?? '',
          role: role as User['role']
        };

        this.authStateSubject.next({ isAuthenticated: true, user, idToken });
      } else {
        this.authStateSubject.next({ isAuthenticated: false, user: null, idToken: null });
      }
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  hasRole(role: 'admin' | 'chef' | 'waiter'): boolean {
    const user = this.getCurrentUser();
    if (!user || !this.isAuthenticated()) return false;

    if (role === 'admin') {
      return user.role === 'admin';
    }

    if (role === 'chef') {
      return user.role === 'admin' || user.role === 'chef';
    }

    if (role === 'waiter') {
      return user.role === 'admin' || user.role === 'chef' || user.role === 'waiter';
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
