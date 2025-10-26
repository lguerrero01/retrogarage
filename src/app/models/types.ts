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

export interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  timestamp: Date;
  estimatedTime?: number;
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
  username: string;
  password: string;
  role: 'admin' | 'chef';
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}