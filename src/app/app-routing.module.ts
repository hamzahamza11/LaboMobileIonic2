import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'orders',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/orders/orders.module').then((m) => m.OrdersPageModule),
  },
  {
    path: 'orders/create',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/create-order/create-order.module').then((m) => m.CreateOrderPageModule),
  },
  {
    path: 'orders/:id',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/order-detail/order-detail.module').then((m) => m.OrderDetailPageModule),
  },
  { path: '**', redirectTo: 'orders' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
