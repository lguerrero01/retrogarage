import { Injectable } from '@angular/core';
import { ApiProduct, CreateApiProductRequest } from '../models/api.types';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  constructor(private api: ApiService) {}

  getProducts(): Promise<ApiProduct[]> {
    return this.api.get<ApiProduct[]>('/product');
  }

  createProduct(data: CreateApiProductRequest): Promise<ApiProduct> {
    return this.api.post<ApiProduct>('/product', data);
  }

  updateProduct(id: string, data: Partial<CreateApiProductRequest>): Promise<ApiProduct> {
    return this.api.put<ApiProduct>(`/product/${id}`, data);
  }

  deleteProduct(id: string): Promise<void> {
    return this.api.delete<void>(`/product/${id}`);
  }
}
