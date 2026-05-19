import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { supabase } from '../config/supabase.client';
import { CustomerAddress } from '../models/types';
import { AuthService } from './auth.service';

interface DbAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  reference: string;
  phone: string;
  is_default: boolean;
}

function toAddress(r: DbAddress): CustomerAddress {
  return {
    id: r.id,
    userId: r.user_id,
    label: r.label ?? '',
    address: r.address,
    reference: r.reference ?? '',
    phone: r.phone ?? '',
    isDefault: !!r.is_default
  };
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private addressesSubject = new BehaviorSubject<CustomerAddress[]>([]);
  addresses$ = this.addressesSubject.asObservable();

  constructor(private auth: AuthService) {}

  async loadAddresses(): Promise<CustomerAddress[]> {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', uid)
      .order('is_default', { ascending: false });
    if (error) throw error;
    const list = (data as DbAddress[]).map(toAddress);
    this.addressesSubject.next(list);
    return list;
  }

  async addAddress(a: Omit<CustomerAddress, 'id' | 'userId'>): Promise<void> {
    const uid = this.auth.getCurrentUser()?.id;
    if (!uid) throw new Error('AUTH_REQUIRED');
    if (a.isDefault) await this.clearDefault(uid);
    const { error } = await supabase.from('customer_addresses').insert({
      user_id: uid,
      label: a.label,
      address: a.address,
      reference: a.reference,
      phone: a.phone,
      is_default: a.isDefault
    });
    if (error) throw error;
    await this.loadAddresses();
  }

  async updateAddress(id: string, a: Partial<CustomerAddress>): Promise<void> {
    const uid = this.auth.getCurrentUser()?.id;
    if (uid && a.isDefault) await this.clearDefault(uid);
    const { error } = await supabase.from('customer_addresses').update({
      label: a.label,
      address: a.address,
      reference: a.reference,
      phone: a.phone,
      is_default: a.isDefault
    }).eq('id', id);
    if (error) throw error;
    await this.loadAddresses();
  }

  async deleteAddress(id: string): Promise<void> {
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) throw error;
    await this.loadAddresses();
  }

  private async clearDefault(uid: string): Promise<void> {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', uid);
  }
}
