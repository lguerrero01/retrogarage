export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  customizable?: boolean;
  ingredients?: string[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedIngredients?: string[];
  removedIngredients?: string[];
}

export interface Customer {
  name: string;
  phone: string;
  table?: string;
  notes?: string;
}

export type OrderType = 'dine-in-staff' | 'dine-in-customer' | 'delivery';
export type PaymentStatus = 'not-required' | 'pending-proof' | 'in-review' | 'approved' | 'rejected';

export interface DeliveryAddress {
  label?: string;
  address: string;
  reference?: string;
  phone?: string;
}

export interface Order {
  id: string;
  waiterId?: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  status: 'awaiting-payment' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  timestamp: Date;
  estimatedTime?: number;
  orderType?: OrderType;
  customerUserId?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  deliveryFee?: number;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  paymentProofUrl?: string | null;
  paymentReference?: string | null;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  address: string;
  reference: string;
  phone: string;
  isDefault: boolean;
}

export type OrderStatus = Order['status'];

export interface DailySummary {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  ordersByCategory: { [category: string]: number };
  topItems: { name: string; quantity: number; revenue: number }[];
}

export interface Invoice {
  id: string;
  orderId: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
  restaurantInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'chef' | 'waiter' | 'customer';
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  idToken?: string | null;
}

export type InventoryMovementType = 'entrada' | 'salida' | 'ajuste';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  createdBy?: string | null;
  createdAt: string;
}