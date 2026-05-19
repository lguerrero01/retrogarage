import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../config/supabase.client';

export interface StatItem {
  num: string;
  label: string;
}

/** day: 0=Domingo .. 6=Sábado (coincide con extract(dow) en Postgres) */
export interface DayHours {
  day: number;
  open: string;   // 'HH:MM'
  close: string;  // 'HH:MM'
  closed: boolean;
}

export interface PagoMovil {
  bank: string;
  id_number: string;
  phone: string;
  holder: string;
}

export interface OpenState {
  open: boolean;
  label: string;
}

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
  business_hours: DayHours[];
  timezone: string;
  pago_movil: PagoMovil;
  delivery_fee: number;
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
  business_hours: [],
  timezone: 'America/Caracas',
  pago_movil: { bank: '', id_number: '', phone: '', holder: '' },
  delivery_fee: 0,
  updated_at: ''
};

function normalizeConfig(data: any): RestaurantConfig {
  return {
    ...DEFAULT_CONFIG,
    ...data,
    business_hours: Array.isArray(data?.business_hours) ? data.business_hours : [],
    pago_movil: { ...DEFAULT_CONFIG.pago_movil, ...(data?.pago_movil ?? {}) },
    timezone: data?.timezone || DEFAULT_CONFIG.timezone,
    delivery_fee: Number(data?.delivery_fee ?? 0),
    stats: Array.isArray(data?.stats) && data.stats.length ? data.stats : DEFAULT_STATS
  };
}

@Injectable({ providedIn: 'root' })
export class RestaurantConfigService {
  private configSubject = new BehaviorSubject<RestaurantConfig>(DEFAULT_CONFIG);
  config$ = this.configSubject.asObservable();

  private openStateSubject = new BehaviorSubject<OpenState>({ open: true, label: '' });
  openState$ = this.openStateSubject.asObservable();

  constructor() {
    this.recomputeOpenState();
    // Recalcula el estado abierto/cerrado cada minuto
    setInterval(() => this.recomputeOpenState(), 60_000);
  }

  async load(): Promise<RestaurantConfig> {
    const { data, error } = await supabase
      .from('restaurant_config')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();
    if (error) throw error;
    const config = data ? normalizeConfig(data) : DEFAULT_CONFIG;
    this.configSubject.next(config);
    this.recomputeOpenState();
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
    const updated = normalizeConfig(data);
    this.configSubject.next(updated);
    this.recomputeOpenState();
    return updated;
  }

  /** Hora local (en la zona horaria del local) como { dow 0-6, hhmm 'HH:MM' } */
  private nowInTz(tz: string): { dow: number; hhmm: string } {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      const wd = parts.find(p => p.type === 'weekday')?.value ?? 'Sun';
      let hh = parts.find(p => p.type === 'hour')?.value ?? '00';
      const mm = parts.find(p => p.type === 'minute')?.value ?? '00';
      if (hh === '24') hh = '00';
      const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { dow: map[wd] ?? new Date().getDay(), hhmm: `${hh}:${mm}` };
    } catch {
      const d = new Date();
      return { dow: d.getDay(), hhmm: d.toTimeString().slice(0, 5) };
    }
  }

  isOpenNow(cfg: RestaurantConfig = this.configSubject.value): OpenState {
    const hours = cfg.business_hours ?? [];
    if (!hours.length) return { open: true, label: '' };

    const { dow, hhmm } = this.nowInTz(cfg.timezone || 'America/Caracas');
    const today = hours.find(h => h.day === dow);

    if (today && !today.closed && hhmm >= today.open && hhmm < today.close) {
      return { open: true, label: `Abierto · cierra ${today.close}` };
    }

    // Buscar próxima apertura dentro de los próximos 7 días
    for (let i = 0; i < 8; i++) {
      const d = (dow + i) % 7;
      const dh = hours.find(h => h.day === d);
      if (!dh || dh.closed) continue;
      if (i === 0 && hhmm < dh.open) {
        return { open: false, label: `Cerrado · abre hoy ${dh.open}` };
      }
      if (i > 0) {
        const when = i === 1 ? 'mañana' : DAY_NAMES[d];
        return { open: false, label: `Cerrado · abre ${when} ${dh.open}` };
      }
    }
    return { open: false, label: 'Cerrado' };
  }

  private recomputeOpenState(): void {
    this.openStateSubject.next(this.isOpenNow());
  }

  /** Día de la semana actual en la zona del local (0=Dom..6=Sáb) */
  get todayDow(): number {
    return this.nowInTz(this.configSubject.value.timezone || 'America/Caracas').dow;
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
