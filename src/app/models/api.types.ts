// --- Product ---
export interface ApiProductPrice {
  currency: string;
  value: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: ApiProductPrice;
  images: string[];
  isAvailable: boolean;
  category?: string;
}

export type CreateApiProductRequest = Omit<ApiProduct, 'id'>;

// --- Order ---
export interface ApiOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  ingredients?: string[];
  specialInstructions?: string;
}

export type ApiOrderStatus = 'PENDIENTE' | 'en_progreso' | 'finalizado' | 'cancelado';

export interface ApiOrder {
  id: string;
  waiterId: string;
  tableNumber: number;
  items: ApiOrderItem[];
  totalAmount: { currency: string; value: number };
  status: ApiOrderStatus;
  customerPreferences?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  waiterId: string;
  tableNumber: number;
  items: Array<{ productId: string; quantity: number; specialInstructions?: string }>;
  customerPreferences?: unknown;
}

// --- User ---
export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
}
