import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.client';
import { MenuItem } from '../models/types';

interface DbProduct {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  images: string[];
  is_available: boolean;
  category: string;
}

function toMenuItem(p: DbProduct): MenuItem {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    category: p.category ?? '',
    image: p.images?.[0] ?? '',
    available: p.is_available ?? true,
    customizable: (p.ingredients?.length ?? 0) > 0,
    ingredients: p.ingredients ?? []
  };
}

function toDbRow(item: Partial<MenuItem>): Partial<DbProduct> {
  const row: Partial<DbProduct> = {};
  if (item.name !== undefined) row.name = item.name;
  if (item.description !== undefined) row.description = item.description;
  if (item.price !== undefined) row.price = item.price;
  if (item.category !== undefined) row.category = item.category;
  if (item.available !== undefined) row.is_available = item.available;
  if (item.ingredients !== undefined) row.ingredients = item.ingredients;
  if (item.image !== undefined) row.images = item.image ? [item.image] : [];
  return row;
}

@Injectable({ providedIn: 'root' })
export class ProductSupabaseService {

  async getAll(): Promise<MenuItem[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    return (data as DbProduct[]).map(toMenuItem);
  }

  async create(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('products')
      .insert(toDbRow(item))
      .select()
      .single();
    if (error) throw error;
    return toMenuItem(data as DbProduct);
  }

  async update(id: string, changes: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('products')
      .update(toDbRow(changes))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toMenuItem(data as DbProduct);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }
}
