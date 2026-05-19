import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.client';
import { Order, CartItem, Customer, OrderType, DeliveryAddress } from '../models/types';

interface DbOrder {
  id: string;
  waiter_id: string | null;
  table_number: number;
  items: CartItem[];
  total: number;
  status: Order['status'];
  customer_preferences: { name?: string; phone?: string; notes?: string } | null;
  created_at: string;
  order_type?: OrderType;
  customer_user_id?: string | null;
  delivery_address?: DeliveryAddress | null;
  delivery_fee?: number;
  payment_method?: string;
  payment_status?: Order['paymentStatus'];
  payment_proof_url?: string | null;
  payment_reference?: string | null;
  updated_at?: string;
}

export function dbOrderToOrder(o: DbOrder): Order {
  const prefs = o.customer_preferences ?? {};
  return {
    id: o.id,
    waiterId: o.waiter_id ?? undefined,
    customer: {
      name: prefs.name ?? '',
      phone: prefs.phone ?? '',
      table: String(o.table_number),
      notes: prefs.notes
    },
    items: o.items ?? [],
    total: o.total,
    status: o.status,
    timestamp: new Date(o.created_at),
    orderType: o.order_type ?? 'dine-in-staff',
    customerUserId: o.customer_user_id ?? null,
    deliveryAddress: o.delivery_address ?? null,
    deliveryFee: Number(o.delivery_fee ?? 0),
    paymentMethod: o.payment_method ?? 'none',
    paymentStatus: o.payment_status ?? 'not-required',
    paymentProofUrl: o.payment_proof_url ?? null,
    paymentReference: o.payment_reference ?? null
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
      created_at: order.timestamp.toISOString(),
      order_type: order.orderType ?? 'dine-in-staff',
      customer_user_id: order.customerUserId ?? null,
      delivery_address: order.deliveryAddress ?? null,
      delivery_fee: order.deliveryFee ?? 0,
      payment_method: order.paymentMethod ?? 'none',
      payment_status: order.paymentStatus ?? 'not-required',
      payment_proof_url: order.paymentProofUrl ?? null,
      payment_reference: order.paymentReference ?? null
    });
    if (insertError) throw insertError;

    const { error: deleteError } = await supabase.from('orders').delete().eq('id', order.id);
    if (deleteError) throw deleteError;
  }

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteArchivedOrder(id: string): Promise<void> {
    const { error, count } = await supabase
      .from('orders_history')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error('RLS_BLOCKED');
  }

  async getArchivedOrders(dateFrom?: string): Promise<Order[]> {
    const from = dateFrom
      ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('orders_history')
      .select('*')
      .gte('archived_at', from)
      .order('archived_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data as DbOrder[]).map(dbOrderToOrder);
  }

  async getArchivedOrdersForDate(date: string): Promise<Order[]> {
    const start = `${date}T00:00:00.000Z`;
    const end   = `${date}T23:59:59.999Z`;
    const { data, error } = await supabase
      .from('orders_history')
      .select('*')
      .gte('archived_at', start)
      .lte('archived_at', end)
      .order('archived_at', { ascending: false });
    if (error) throw error;
    return (data as DbOrder[]).map(dbOrderToOrder);
  }

  // ─── Flujo de cliente público (Pago Móvil) ──────────────────

  /** Crea un pedido de cliente vía RPC (valida horario y rol en el servidor). */
  async submitCustomerOrder(
    items: CartItem[],
    customer: Customer,
    orderType: Extract<OrderType, 'dine-in-customer' | 'delivery'>,
    deliveryAddress: DeliveryAddress | null,
    deliveryFee: number
  ): Promise<Order> {
    const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = itemsTotal + (deliveryFee || 0);
    const { data, error } = await supabase.rpc('submit_customer_order', {
      p_items: items,
      p_total: total,
      p_order_type: orderType,
      p_customer: { name: customer.name, phone: customer.phone, notes: customer.notes },
      p_delivery_address: deliveryAddress,
      p_delivery_fee: deliveryFee || 0
    });
    if (error) throw error;
    return dbOrderToOrder(data as DbOrder);
  }

  /** Sube el comprobante al bucket privado y marca el pedido en revisión. */
  async submitPaymentProof(orderId: string, file: File, reference: string, userId: string): Promise<void> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${orderId}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true });
    if (up.error) throw up.error;
    const { error } = await supabase.rpc('submit_payment_proof', {
      p_order_id: orderId,
      p_proof_url: path,
      p_reference: reference
    });
    if (error) throw error;
  }

  async approvePayment(orderId: string): Promise<void> {
    const { error } = await supabase.rpc('approve_payment', { p_order_id: orderId });
    if (error) throw error;
  }

  async rejectPayment(orderId: string, reason = ''): Promise<void> {
    const { error } = await supabase.rpc('reject_payment', { p_order_id: orderId, p_reason: reason });
    if (error) throw error;
  }

  /** URL firmada temporal para que el admin vea el comprobante (bucket privado). */
  async getProofSignedUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  async getMyArchivedOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders_history')
      .select('*')
      .eq('customer_user_id', userId)
      .order('archived_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data as DbOrder[]).map(dbOrderToOrder);
  }
}
