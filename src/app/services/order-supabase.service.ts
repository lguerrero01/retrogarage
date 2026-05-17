import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.client';
import { Order, CartItem, Customer } from '../models/types';

interface DbOrder {
  id: string;
  waiter_id: string | null;
  table_number: number;
  items: CartItem[];
  total: number;
  status: Order['status'];
  customer_preferences: { name?: string; phone?: string; notes?: string } | null;
  created_at: string;
  updated_at: string;
}

export function dbOrderToOrder(o: DbOrder): Order {
  const prefs = o.customer_preferences ?? {};
  return {
    id: o.id,
    customer: {
      name: prefs.name ?? '',
      phone: prefs.phone ?? '',
      table: String(o.table_number),
      notes: prefs.notes
    },
    items: o.items ?? [],
    total: o.total,
    status: o.status,
    timestamp: new Date(o.created_at)
  };
}

@Injectable({ providedIn: 'root' })
export class OrderSupabaseService {

  async createOrder(items: CartItem[], customer: Customer, waiterId: string): Promise<Order> {
    const tableNum = parseInt(customer.table ?? '0', 10) || 0;
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        waiter_id: waiterId,
        table_number: tableNum,
        items,
        total,
        status: 'pending',
        customer_preferences: { name: customer.name, phone: customer.phone, notes: customer.notes }
      })
      .select()
      .single();
    if (error) throw error;
    return dbOrderToOrder(data as DbOrder);
  }

  async updateStatus(id: string, status: Order['status']): Promise<void> {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async archiveOrder(order: Order): Promise<void> {
    const { error: insertError } = await supabase.from('orders_history').insert({
      id: order.id,
      waiter_id: null,
      table_number: parseInt(order.customer.table ?? '0', 10) || 0,
      items: order.items,
      total: order.total,
      status: order.status,
      customer_preferences: { name: order.customer.name, phone: order.customer.phone, notes: order.customer.notes },
      created_at: order.timestamp.toISOString()
    });
    if (insertError) throw insertError;

    const { error: deleteError } = await supabase.from('orders').delete().eq('id', order.id);
    if (deleteError) throw deleteError;
  }

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  }

  async getArchivedOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders_history')
      .select('*')
      .order('archived_at', { ascending: false });
    if (error) throw error;
    return (data as DbOrder[]).map(dbOrderToOrder);
  }
}
