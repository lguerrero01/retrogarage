import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.client';

@Injectable({
  providedIn: 'root'
})
export class SupabaseRealtimeService implements OnDestroy {
  connected$ = new BehaviorSubject<boolean>(false);

  private channels = new Map<string, RealtimeChannel>();
  private cache = new Map<string, unknown[]>();

  listenToTable<T extends { id: string }>(
    table: string,
    onData: (data: T[]) => void
  ): void {
    if (this.channels.has(table)) return;

    supabase.from(table).select('*').then(({ data, error }) => {
      if (error) { console.error(`[Supabase] fetch ${table}:`, error); return; }
      const rows = (data ?? []) as T[];
      this.cache.set(table, rows);
      onData(rows);
    });

    const channel = supabase
      .channel(`rt:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const current = (this.cache.get(table) ?? []) as T[];
        let updated: T[];

        if (payload.eventType === 'INSERT') {
          updated = [...current, payload.new as T];
        } else if (payload.eventType === 'UPDATE') {
          updated = current.map(r => r.id === (payload.new as T).id ? payload.new as T : r);
        } else {
          updated = current.filter(r => r.id !== (payload.old as { id: string }).id);
        }

        this.cache.set(table, updated);
        onData(updated);
      })
      .subscribe(status => {
        this.connected$.next(status === 'SUBSCRIBED');
      });

    this.channels.set(table, channel);
  }

  unsubscribeFromTable(table: string): void {
    const ch = this.channels.get(table);
    if (ch) { supabase.removeChannel(ch); this.channels.delete(table); this.cache.delete(table); }
  }

  unsubscribeAll(): void {
    this.channels.forEach((ch) => supabase.removeChannel(ch));
    this.channels.clear();
    this.cache.clear();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}
