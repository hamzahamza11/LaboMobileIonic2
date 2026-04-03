import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';

import { LoginPageModule } from './pages/login/login.module';
import { OrdersPageModule } from './pages/orders/orders.module';
import { OrderDetailPageModule } from './pages/order-detail/order-detail.module';
import { CreateOrderPageModule } from './pages/create-order/create-order.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule.forRoot({
      rippleEffect: true,
      mode: 'md',
    }),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    LoginPageModule,
    OrdersPageModule,
    OrderDetailPageModule,
    CreateOrderPageModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
