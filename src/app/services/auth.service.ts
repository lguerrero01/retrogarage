import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../config/supabase.client';
import { User, AuthState } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({ isAuthenticated: false, user: null });
  private showLoginModalSubject = new BehaviorSubject<boolean>(false);

  authState$ = this.authStateSubject.asObservable();
  showLoginModal$ = this.showLoginModalSubject.asObservable();

  constructor() {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) this.loadProfile(data.session.user.id, data.session.access_token);
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await this.loadProfile(session.user.id, session.access_token);
      } else {
        this.authStateSubject.next({ isAuthenticated: false, user: null, idToken: null });
      }
    });
  }

  private async loadProfile(userId: string, idToken: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', userId)
      .single();

    const { data: authUser } = await supabase.auth.getUser();
    const user: User = {
      id: userId,
      email: authUser.user?.email ?? '',
      name: profile?.name ?? authUser.user?.email ?? '',
      role: (profile?.role ?? 'waiter') as User['role']
    };
    this.authStateSubject.next({ isAuthenticated: true, user, idToken });
  }

  async login(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getIdToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
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
    if (role === 'admin') return user.role === 'admin';
    if (role === 'chef') return user.role === 'admin' || user.role === 'chef';
    return true;
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
