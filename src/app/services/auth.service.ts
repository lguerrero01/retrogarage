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

  // Resuelve cuando el INITIAL_SESSION ya fue procesado (con o sin sesión)
  private initResolve!: () => void;
  readonly ready$ = new Promise<void>(resolve => { this.initResolve = resolve; });
  private initialized = false;

  constructor() {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session) {
          // setTimeout libera el lock de auth antes de hacer más llamadas a Supabase
          setTimeout(() => {
            this.loadProfile(session.user.id, session.user.email ?? '', session.access_token)
              .then(() => this.resolveInit());
          }, 0);
        } else {
          this.resolveInit();
        }
      } else if (session) {
        setTimeout(() => {
          this.loadProfile(session.user.id, session.user.email ?? '', session.access_token);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        this.authStateSubject.next({ isAuthenticated: false, user: null, idToken: null });
      }
    });
  }

  private resolveInit() {
    if (!this.initialized) {
      this.initialized = true;
      this.initResolve();
    }
  }

  private async loadProfile(userId: string, email: string, idToken: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', userId)
      .single();

    const user: User = {
      id: userId,
      email,
      name: profile?.name ?? email,
      role: (profile?.role ?? 'customer') as User['role']
    };
    this.authStateSubject.next({ isAuthenticated: true, user, idToken });
  }

  /** Registro público: crea una cuenta de cliente (rol 'customer' vía trigger). */
  async signUp(email: string, password: string, name: string, phone: string): Promise<{ ok: boolean; needsConfirmation: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } }
    });
    if (error) return { ok: false, needsConfirmation: false, error: error.message };
    return { ok: true, needsConfirmation: !data.session };
  }

  async login(email: string, password: string): Promise<boolean> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 12000)
    );
    const { error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout
    ]);
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

  /** Personal del local (admin/chef/waiter). Los clientes públicos NO son staff. */
  isStaff(): boolean {
    const user = this.getCurrentUser();
    if (!user || !this.isAuthenticated()) return false;
    return user.role !== 'customer';
  }

  isCustomer(): boolean {
    const user = this.getCurrentUser();
    return !!user && this.isAuthenticated() && user.role === 'customer';
  }

  async updateName(name: string): Promise<void> {
    const u = this.getCurrentUser();
    if (!u) return;
    const { error } = await supabase.from('profiles').update({ name }).eq('id', u.id);
    if (error) throw error;
    const state = this.authStateSubject.value;
    this.authStateSubject.next({ ...state, user: { ...u, name } });
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
