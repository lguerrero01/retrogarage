import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../config/supabase.client';

const LS_KEY = 'restaurant-categories';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private subject = new BehaviorSubject<string[]>(this.fromLS());
  categories$ = this.subject.asObservable();

  constructor() {
    this.sync();
  }

  private fromLS(): string[] {
    try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
  }

  private set(cats: string[]) {
    const sorted = [...new Set(cats)].sort();
    localStorage.setItem(LS_KEY, JSON.stringify(sorted));
    this.subject.next(sorted);
  }

  private async sync(): Promise<void> {
    const { data, error } = await supabase.from('categories').select('name').order('name');
    if (!error && data) {
      this.set(data.map((r: any) => r.name as string));
    }
    // Si la tabla no existe, se queda con lo que hay en localStorage
  }

  async add(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed || this.subject.value.includes(trimmed)) return;

    const { error } = await supabase.from('categories').insert({ name: trimmed });
    if (!error) {
      await this.sync();
    } else {
      // Fallback localStorage cuando la tabla aún no existe en Supabase
      this.set([...this.subject.value, trimmed]);
    }
  }

  async remove(name: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('name', name);
    if (!error) {
      await this.sync();
    } else {
      this.set(this.subject.value.filter(c => c !== name));
    }
  }

  /** Siembra categorías inferidas de productos si el servicio aún está vacío */
  seedFromProducts(productCategories: string[]): void {
    if (this.subject.value.length === 0 && productCategories.length > 0) {
      this.set(productCategories);
    }
  }
}
