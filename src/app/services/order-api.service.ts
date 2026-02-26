import { Injectable } from '@angular/core';
import { ApiOrder, ApiOrderStatus, CreateOrderRequest } from '../models/api.types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  constructor(private api: ApiService) {}

  createOrder(data: CreateOrderRequest): Promise<ApiOrder> {
    return this.api.post<ApiOrder>('/order', data);
  }

  updateStatus(id: string, status: ApiOrderStatus): Promise<ApiOrder> {
    return this.api.put<ApiOrder>(`/order/${id}/status/${status}`, {});
  }

  archiveOrder(id: string): Promise<void> {
    return this.api.post<void>(`/order/${id}/archive`, {});
  }

  deleteOrder(id: string): Promise<void> {
    return this.api.delete<void>(`/order/${id}`);
  }

  getArchivedOrders(): Promise<ApiOrder[]> {
    return this.api.get<ApiOrder[]>('/order/history');
  }
}
