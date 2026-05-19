import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../config/supabase.client';
import { InventoryItem, InventoryMovement, InventoryMovementType } from '../models/types';
import { SupabaseRealtimeService } from './supabase-realtime.service';
import { AuthService } from './auth.service';

interface DbItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

interface DbMovement {
  id: string;
  item_id: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  created_by: string | null;
  created_at: string;
}

function toItem(r: DbItem): InventoryItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category ?? '',
    unit: r.unit ?? 'unidad',
    quantity: Number(r.quantity ?? 0),
    minQuantity: Number(r.min_quantity ?? 0),
    notes: r.notes ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function toItemRow(i: Partial<InventoryItem>): Partial<DbItem> {
  const row: Partial<DbItem> = {};
  if (i.name !== undefined) row.name = i.name;
  if (i.category !== undefined) row.category = i.category;
  if (i.unit !== undefined) row.unit = i.unit;
  if (i.quantity !== undefined) row.quantity = i.quantity;
  if (i.minQuantity !== undefined) row.min_quantity = i.minQuantity;
  if (i.notes !== undefined) row.notes = i.notes;
  return row;
}

function toMovement(r: DbMovement): InventoryMovement {
  return {
    id: r.id,
    itemId: r.item_id,
    type: r.type,
    quantity: Number(r.quantity),
    reason: r.reason ?? '',
    createdBy: r.created_by,
    createdAt: r.created_at
  };
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private itemsSubject = new BehaviorSubject<InventoryItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  private lowStockSubject = new BehaviorSubject<InventoryItem[]>([]);
  lowStock$ = this.lowStockSubject.asObservable();

  private loadedSubject = new BehaviorSubject<boolean>(false);
  loaded$ = this.loadedSubject.asObservable();

  private started = false;

  constructor(
    private realtime: SupabaseRealtimeService,
    private auth: AuthService
  ) {}

  /** Suscripción realtime perezosa (solo cuando se entra a Inventario). */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.realtime.listenToTable<DbItem & { id: string }>('inventory_items', rows => {
      const items = rows.map(toItem).sort((a, b) => a.name.localeCompare(b.name));
      this.itemsSubject.next(items);
      this.lowStockSubject.next(items.filter(i => i.quantity <= i.minQuantity));
      this.loadedSubject.next(true);
    });
  }

  async createItem(item: Omit<InventoryItem, 'id'>): Promise<void> {
    const { error } = await supabase.from('inventory_items').insert(toItemRow(item));
    if (error) throw error;
  }

  async updateItem(id: string, changes: Partial<InventoryItem>): Promise<void> {
    const { error } = await supabase.from('inventory_items').update(toItemRow(changes)).eq('id', id);
    if (error) throw error;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
  }

  /** Registra un movimiento; un trigger en Postgres ajusta la cantidad del ítem. */
  async addMovement(
    itemId: string,
    type: InventoryMovementType,
    quantity: number,
    reason: string
  ): Promise<void> {
    const uid = this.auth.getCurrentUser()?.id ?? null;
    const { error } = await supabase
      .from('inventory_movements')
      .insert({ item_id: itemId, type, quantity, reason, created_by: uid });
    if (error) throw error;
  }

  async getMovements(itemId?: string, fromDate?: string): Promise<InventoryMovement[]> {
    let q = supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (itemId) q = q.eq('item_id', itemId);
    if (fromDate) q = q.gte('created_at', fromDate);
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbMovement[]).map(toMovement);
  }
}
