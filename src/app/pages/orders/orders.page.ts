import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController, RefresherCustomEvent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  searchText = '';
  selectedStatus: OrderStatus | 'ALL' = 'ALL';
  private sub = new Subscription();

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  readonly filterStatuses: (OrderStatus | 'ALL')[] = [
    'ALL', 'DRAFT', 'SUBMITTED', 'MANAGER_REVIEWING', 'MANAGER_APPROVED',
    'READY_FOR_DISPATCH', 'ASSIGNED_TO_DRIVER', 'DRIVER_EN_ROUTE',
    'DELIVERED', 'COMPLETED', 'CANCELLED',
  ];

  constructor(
    public auth: AuthService,
    private ordersService: OrdersService,
    private socket: SocketService,
    private router: Router,
    private alert: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.listenToSocket();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadOrders(event?: RefresherCustomEvent): void {
    if (!event) this.loading = true;

    const filters = this.selectedStatus !== 'ALL' ? { status: this.selectedStatus } : {};

    this.ordersService.getOrders(filters).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applySearch();
        this.loading = false;
        event?.detail.complete();
      },
      error: (err) => {
        this.loading = false;
        event?.detail.complete();
        this.showToast(err.error?.message || 'Erreur lors du chargement', 'danger');
      },
    });
  }

  applySearch(): void {
    const q = this.searchText.toLowerCase().trim();
    this.filteredOrders = this.orders.filter((o) => {
      const matchSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.pdv?.nom.toLowerCase().includes(q) ||
        o.chef?.firstName?.toLowerCase().includes(q) ||
        o.chef?.lastName?.toLowerCase().includes(q);
      return matchSearch;
    });
  }

  onStatusFilter(status: OrderStatus | 'ALL'): void {
    this.selectedStatus = status;
    this.loadOrders();
  }

  openOrder(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }

  async confirmCancel(order: Order): Promise<void> {
    const a = await this.alert.create({
      header: 'Annuler la commande',
      message: `Êtes-vous sûr d'annuler la commande ${order.code} ?`,
      buttons: [
        { text: 'Non', role: 'cancel' },
        {
          text: 'Oui, annuler',
          role: 'destructive',
          handler: () => this.cancelOrder(order),
        },
      ],
    });
    await a.present();
  }

  private cancelOrder(order: Order): void {
    this.ordersService.cancelOrder(order.id).subscribe({
      next: () => this.showToast('Commande annulée', 'success'),
      error: (err) => this.showToast(err.error?.message || 'Erreur', 'danger'),
    });
  }

  private listenToSocket(): void {
    this.sub.add(
      this.socket.onOrderStatusChanged().subscribe((updated: Order) => {
        const idx = this.orders.findIndex((o) => o.id === updated.id);
        if (idx !== -1) {
          this.orders[idx] = updated;
          this.applySearch();
          this.showToast(`Commande ${updated.code} → ${this.statusLabels[updated.status]}`, 'primary');
        }
      }),
    );
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: OrderStatus): string {
    return ORDER_STATUS_COLORS[status] || 'medium';
  }

  orderTotal(order: Order): string {
    if (order.totalCommande) return parseFloat(order.totalCommande).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' });
    return '—';
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top', icon: color === 'danger' ? 'alert-circle-outline' : 'checkmark-circle-outline' });
    await t.present();
  }
}
