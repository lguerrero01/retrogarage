# Firebase Service - Guía de Uso

## Configuración Inicial

### 1. Configurar Credenciales de Firebase

**Paso 1:** Obtén tus credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Haz clic en el ícono de configuración ⚙️ > **Project Settings**
4. Desplázate hasta la sección **"Your apps"**
5. Si no tienes una app web, haz clic en **"Add app"** y selecciona **Web (</> icon)**
6. Copia los valores del objeto `firebaseConfig`

**Paso 2:** Configura el archivo de credenciales

Edita el archivo `src/app/config/firebase.config.ts` con tus credenciales reales:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"  // Opcional
};
```

**⚠️ IMPORTANTE:** Este archivo ya está en `.gitignore` para que NO subas tus credenciales a git.

**Referencia:** Puedes ver el archivo de ejemplo en `src/app/config/firebase.config.example.ts`

### 2. Configurar Reglas de Seguridad en Firestore

En Firebase Console, ve a **Firestore Database** > **Rules** y configura según tus necesidades:

```javascript
// Ejemplo: Permitir lectura/escritura autenticada
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Estructura de Archivos

```
src/
├── app/
│   ├── config/
│   │   ├── firebase.config.ts          # ⚠️ TUS CREDENCIALES (no subir a git)
│   │   └── firebase.config.example.ts  # Plantilla de ejemplo
│   └── services/
│       └── firebase.service.ts         # Servicio de Firebase
└── environments/
    ├── environment.ts                  # Configuración producción
    └── environment.development.ts      # Configuración desarrollo
```

## Uso del Servicio

### Ejemplo Básico: Escuchar una Colección

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from './services/firebase.service';
import { Order } from './models/types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-orders',
  template: `
    <div *ngFor="let order of orders">
      <h3>Order #{{ order.id }}</h3>
      <p>Status: {{ order.status }}</p>
    </div>
  `
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  private subscription?: Subscription;

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    // Escuchar todos los documentos de la colección "orders"
    this.subscription = this.firebaseService
      .listenToCollection<Order>('orders')
      .subscribe(update => {
        if (update.error) {
          console.error('Error:', update.error);
          return;
        }
        this.orders = update.data;
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

### Ejemplo con Filtros (Query Constraints)

```typescript
import { where, orderBy, limit } from 'firebase/firestore';

ngOnInit() {
  // Escuchar solo órdenes pendientes, ordenadas por fecha, máximo 10
  this.subscription = this.firebaseService
    .listenToCollection<Order>('orders', [
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc'),
      limit(10)
    ])
    .subscribe(update => {
      this.pendingOrders = update.data;
    });
}
```

### Ejemplo con Múltiples Colecciones

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from './services/firebase.service';
import { Order, MenuItem } from './models/types';
import { Subscription } from 'rxjs';

export class DashboardComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  menuItems: MenuItem[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    // Suscribirse a múltiples colecciones
    const ordersSubscription = this.firebaseService
      .listenToCollection<Order>('orders')
      .subscribe(update => {
        this.orders = update.data;
      });

    const menuSubscription = this.firebaseService
      .listenToCollection<MenuItem>('menu-items')
      .subscribe(update => {
        this.menuItems = update.data;
      });

    this.subscriptions.push(ordersSubscription, menuSubscription);
  }

  ngOnDestroy() {
    // Cancelar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### Ejemplo en un Servicio (Patrón BehaviorSubject)

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { Order } from '../models/types';
import { where, orderBy } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  orders$ = this.ordersSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.initializeOrdersListener();
  }

  private initializeOrdersListener() {
    this.firebaseService
      .listenToCollection<Order>('orders', [
        orderBy('timestamp', 'desc')
      ])
      .subscribe(update => {
        if (!update.error) {
          this.ordersSubject.next(update.data);
        }
      });
  }

  // Método para obtener solo órdenes activas
  getActiveOrders(): Observable<Order[]> {
    return new Observable(observer => {
      this.firebaseService
        .listenToCollection<Order>('orders', [
          where('status', 'in', ['pending', 'preparing'])
        ])
        .subscribe(update => {
          observer.next(update.data);
        });
    });
  }
}
```

### Manejo de Errores

```typescript
ngOnInit() {
  this.subscription = this.firebaseService
    .listenToCollection<Order>('orders')
    .subscribe(update => {
      if (update.error) {
        // Manejar el error
        console.error('Firestore error:', update.error);

        switch (update.error.code) {
          case 'permission-denied':
            console.error('No tienes permisos para acceder a esta colección');
            break;
          case 'unavailable':
            console.error('Firestore no está disponible');
            break;
          default:
            console.error('Error desconocido:', update.error.message);
        }

        return;
      }

      // Procesar datos normalmente
      this.orders = update.data;
    });
}
```

### Cancelar Suscripciones Manualmente

```typescript
export class MyComponent {
  constructor(private firebaseService: FirebaseService) {}

  startListening() {
    this.firebaseService
      .listenToCollection<Order>('orders')
      .subscribe(update => {
        console.log('Orders:', update.data);
      });
  }

  stopListening() {
    // Cancelar suscripción específica
    this.firebaseService.unsubscribeFromCollection('orders');
  }

  stopAllListening() {
    // Cancelar todas las suscripciones activas
    this.firebaseService.unsubscribeAll();
  }
}
```

## Operaciones Avanzadas con Firestore

Para operaciones más allá de escuchar cambios (crear, actualizar, eliminar), puedes acceder directamente a la instancia de Firestore:

```typescript
import { addDoc, collection, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export class OrderService {
  constructor(private firebaseService: FirebaseService) {}

  async createOrder(order: Omit<Order, 'id'>) {
    const db = this.firebaseService.getFirestore();
    const ordersRef = collection(db, 'orders');

    try {
      const docRef = await addDoc(ordersRef, order);
      console.log('Order created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const db = this.firebaseService.getFirestore();
    const orderRef = doc(db, 'orders', orderId);

    try {
      await updateDoc(orderRef, { status });
      console.log('Order status updated');
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async deleteOrder(orderId: string) {
    const db = this.firebaseService.getFirestore();
    const orderRef = doc(db, 'orders', orderId);

    try {
      await deleteDoc(orderRef);
      console.log('Order deleted');
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
}
```

## Queries Disponibles

Importa los constraints desde `firebase/firestore`:

```typescript
import {
  where,       // Filtrar documentos
  orderBy,     // Ordenar resultados
  limit,       // Limitar número de documentos
  startAt,     // Paginar desde un punto
  endAt,       // Paginar hasta un punto
  startAfter,  // Paginar después de un documento
  endBefore    // Paginar antes de un documento
} from 'firebase/firestore';

// Ejemplos de uso:
where('status', '==', 'pending')
where('price', '>', 10)
where('category', 'in', ['drinks', 'desserts'])
orderBy('timestamp', 'desc')
limit(20)
```

## Notas Importantes

1. **Seguridad**: Las reglas de Firestore en Firebase Console determinan qué puede leer/escribir cada usuario
2. **Performance**: Cada llamada a `listenToCollection` crea una conexión en tiempo real. Reutiliza observables cuando sea posible
3. **Cleanup**: Siempre cancela suscripciones en `ngOnDestroy` para evitar memory leaks
4. **Tipos**: El servicio soporta TypeScript generics para type-safety completo
5. **IDs**: Firestore añade automáticamente el campo `id` a cada documento en el array de resultados
