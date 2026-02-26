import { MenuItem, CartItem, Order, Customer } from './types';
import { ApiProduct, ApiOrder, ApiOrderStatus, CreateOrderRequest, CreateApiProductRequest } from './api.types';

// --- Status mapping ---

export type FrontendOrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export function apiStatusToFrontend(status: ApiOrderStatus): FrontendOrderStatus {
  switch (status) {
    case 'PENDIENTE':   return 'pending';
    case 'en_progreso': return 'preparing';
    case 'finalizado':  return 'ready';
    case 'cancelado':   return 'cancelled';
  }
}

export function frontendStatusToApi(status: FrontendOrderStatus): ApiOrderStatus {
  switch (status) {
    case 'pending':   return 'PENDIENTE';
    case 'preparing': return 'en_progreso';
    case 'ready':
    case 'completed': return 'finalizado';
    case 'cancelled': return 'cancelado';
  }
}

// --- Product adapter ---

export function apiProductToMenuItem(p: ApiProduct): MenuItem {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.value,
    category: p.category ?? '',
    image: p.images?.[0] ?? '',
    available: p.isAvailable ?? true,
    customizable: (p.ingredients?.length ?? 0) > 0,
    ingredients: p.ingredients ?? []
  };
}

// --- Order adapters ---

export function apiOrderToOrder(o: ApiOrder): Order {
  const prefs = o.customerPreferences as { name?: string; phone?: string; notes?: string } | null;

  const customer: Customer = {
    name: prefs?.name ?? '',
    phone: prefs?.phone ?? '',
    table: String(o.tableNumber),
    notes: prefs?.notes
  };

  const items: CartItem[] = o.items.map(item => ({
    id: item.productId,
    name: item.name,
    description: '',
    price: item.unitPrice,
    category: '',
    image: '',
    available: true,
    quantity: item.quantity,
    ingredients: item.ingredients ?? []
  }));

  return {
    id: o.id,
    customer,
    items,
    total: o.totalAmount.value,
    status: apiStatusToFrontend(o.status),
    timestamp: new Date(o.createdAt)
  };
}

// --- Inverse product adapters ---

export function menuItemToCreateApiProduct(item: MenuItem): CreateApiProductRequest {
  return {
    name: item.name,
    description: item.description,
    ingredients: item.ingredients ?? [],
    price: { currency: 'MXN', value: item.price },
    images: item.image ? [item.image] : [],
    isAvailable: item.available,
    category: item.category || undefined
  };
}

export function menuItemUpdatesToApi(updates: Partial<MenuItem>): Partial<CreateApiProductRequest> {
  const result: Partial<CreateApiProductRequest> = {};
  if (updates.name !== undefined) result.name = updates.name;
  if (updates.description !== undefined) result.description = updates.description;
  if (updates.ingredients !== undefined) result.ingredients = updates.ingredients;
  if (updates.price !== undefined) result.price = { currency: 'MXN', value: updates.price };
  if (updates.image !== undefined) result.images = updates.image ? [updates.image] : [];
  if (updates.available !== undefined) result.isAvailable = updates.available;
  if (updates.category !== undefined) result.category = updates.category || undefined;
  return result;
}

export function cartToCreateOrderRequest(
  items: CartItem[],
  customer: Customer,
  waiterId: string
): CreateOrderRequest {
  return {
    waiterId,
    tableNumber: Number(customer.table) || 0,
    customerPreferences: {
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes
    },
    items: items.map(item => {
      const removed = item.removedIngredients ?? [];
      return {
        productId: item.id,
        quantity: item.quantity,
        ...(removed.length > 0 ? { specialInstructions: `Sin: ${removed.join(', ')}` } : {})
      };
    })
  };
}
