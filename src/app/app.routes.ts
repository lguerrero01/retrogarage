import { Routes } from '@angular/router';
import { MenuViewComponent } from './components/menu-view/menu-view.component';
import { KitchenViewComponent } from './components/kitchen-view/kitchen-view.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
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
    path: 'kitchen',
    component: KitchenViewComponent,
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
