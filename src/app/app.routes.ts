import { Routes } from '@angular/router';
import { MenuViewComponent } from './components/menu-view/menu-view.component';
import { KitchenViewComponent } from './components/kitchen-view/kitchen-view.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { WaiterOrdersViewComponent } from './components/waiter-orders-view/waiter-orders-view.component';
import { InventoryViewComponent } from './components/inventory/inventory-view.component';
import { AccountViewComponent } from './components/account/account-view.component';
import { MyOrdersViewComponent } from './components/my-orders/my-orders-view.component';
import { PaymentApprovalViewComponent } from './components/payment-approval/payment-approval-view.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/menu',
    pathMatch: 'full'
  },
  {
    path: 'menu',
    component: MenuViewComponent
  },
  {
    path: 'orders',
    component: WaiterOrdersViewComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'staff' }
  },
  {
    path: 'cuenta',
    component: AccountViewComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'customer' }
  },
  {
    path: 'mis-pedidos',
    component: MyOrdersViewComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'customer' }
  },
  {
    path: 'pagos',
    component: PaymentApprovalViewComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'admin' }
  },
  {
    path: 'kitchen',
    component: KitchenViewComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'chef' }
  },
  {
    path: 'inventario',
    component: InventoryViewComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'chef' }
  },
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'admin' }
  },
  {
    path: '**',
    redirectTo: '/menu'
  }
];
