import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { OrderDetailPage } from './order-detail.page';

const routes: Routes = [{ path: '', component: OrderDetailPage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [OrderDetailPage],
})
export class OrderDetailPageModule {}
