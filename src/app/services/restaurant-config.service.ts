import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../config/supabase.client';

export interface StatItem {
  num: string;
  label: string;
}

export interface RestaurantConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  hours: string;
  hero_image: string;
  logo_image: string;
  about_image: string;
  gallery_images: string[];
  stats: StatItem[];
  playstore_url: string;
  instagram_url: string;
  facebook_url: string;
  updated_at: string;
}

const DEFAULT_STATS: StatItem[] = [
  { num: '100+', label: 'Platillos únicos' },
  { num: '5★',   label: 'Calificación' },
  { num: 'Retro', label: 'Ambiente temático' },
  { num: 'App',   label: 'Ordena desde tu mesa' }
];

const DEFAULT_CONFIG: RestaurantConfig = {
  id: 'main',
  name: 'Retro Garage',
  tagline: '',
  description: '',
  address: '',
  phone: '',
  hours: '',
  hero_image: '',
  logo_image: '',
  about_image: '',
  gallery_images: [],
  stats: DEFAULT_STATS,
  playstore_url: '',
  instagram_url: '',
  facebook_url: '',
  updated_at: ''
};

@Injectable({ providedIn: 'root' })
export class RestaurantConfigService {
  private configSubject = new BehaviorSubject<RestaurantConfig>(DEFAULT_CONFIG);
  config$ = this.configSubject.asObservable();

  async load(): Promise<RestaurantConfig> {
    const { data, error } = await supabase
      .from('restaurant_config')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();
    if (error) throw error;
    const config = data ? (data as RestaurantConfig) : DEFAULT_CONFIG;
    this.configSubject.next(config);
    return config;
  }

  async save(changes: Partial<RestaurantConfig>): Promise<RestaurantConfig> {
    const payload = { ...changes, id: 'main', updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('restaurant_config')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    const updated = data as RestaurantConfig;
    this.configSubject.next(updated);
    return updated;
  }

  async uploadImage(file: File, slot: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `config/${slot}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async addGalleryImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `config/gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    const url = data.publicUrl;
    const current = this.configSubject.value;
    const gallery = [...(current.gallery_images ?? []), url];
    await this.save({ gallery_images: gallery });
    return url;
  }

  async removeGalleryImage(url: string): Promise<void> {
    const current = this.configSubject.value;
    const gallery = (current.gallery_images ?? []).filter(u => u !== url);
    await this.save({ gallery_images: gallery });
  }

  get snapshot(): RestaurantConfig {
    return this.configSubject.value;
  }
}
