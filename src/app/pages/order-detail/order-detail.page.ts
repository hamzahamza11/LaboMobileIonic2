import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController, ActionSheetController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../core/models/order.model';

interface StatusTransition {
  label: string;
  targetStatus: OrderStatus;
  color: string;
  icon: string;
  requiresDriver?: boolean;
}

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
})
export class OrderDetailPage implements OnInit, OnDestroy {
  order: Order | null = null;
  loading = true;
  private orderId!: number;
  private sub = new Subscription();
  drivers: any[] = [];

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  constructor(
    public auth: AuthService,
    private ordersService: OrdersService,
    private socket: SocketService,
    private route: ActivatedRoute,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
    private loading$: LoadingController,
    private actionSheet: ActionSheetController,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.orderId = idParam ? Number(idParam) : NaN;
    if (Number.isNaN(this.orderId)) {
      this.router.navigate(['/orders']);
      return;
    }
    this.loadOrder();
    this.socket.joinOrderRoom(this.orderId);
    this.listenToSocket();
  }

  ngOnDestroy(): void {
    if (Number.isFinite(this.orderId)) {
      this.socket.leaveOrderRoom(this.orderId);
    }
    this.sub.unsubscribe();
  }

  loadOrder(): void {
    this.loading = true;
    this.ordersService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err.error?.message || 'Erreur de chargement', 'danger');
        this.router.navigate(['/orders']);
      },
    });
  }

  private listenToSocket(): void {
    this.sub.add(
      this.socket.onOrderStatusChanged().subscribe((updated: Order) => {
        if (updated.id === this.orderId) {
          this.order = updated;
          this.showToast(`Statut → ${this.statusLabels[updated.status]}`, 'primary');
        }
      }),
    );
  }

  get availableTransitions(): StatusTransition[] {
    if (!this.order) return [];
    const user = this.auth.currentUser;
    const isManager = this.auth.isManagerOrAdmin();
    const isDriver = user?.roles?.includes('driver') || user?.roles?.includes('chauffeur');
    const status = this.order.status;

    const map: Partial<Record<OrderStatus, StatusTransition[]>> = {
      DRAFT: [{ label: 'Soumettre', targetStatus: 'SUBMITTED', color: 'primary', icon: 'send-outline' }],
      SUBMITTED: isManager ? [
        { label: 'Valider', targetStatus: 'MANAGER_APPROVED', color: 'success', icon: 'checkmark-circle-outline' },
        { label: 'Rejeter', targetStatus: 'CANCELLED', color: 'danger', icon: 'close-circle-outline' },
      ] : [],
      MANAGER_APPROVED: isManager ? [
        { label: 'Prêt à expédier', targetStatus: 'READY_FOR_DISPATCH', color: 'warning', icon: 'cube-outline' },
      ] : [],
      READY_FOR_DISPATCH: isManager ? [
        { label: 'Assigner chauffeur', targetStatus: 'ASSIGNED_TO_DRIVER', color: 'tertiary', icon: 'car-outline', requiresDriver: true },
      ] : [],
      ASSIGNED_TO_DRIVER: isDriver || isManager ? [
        { label: 'En route', targetStatus: 'DRIVER_EN_ROUTE', color: 'secondary', icon: 'navigate-outline' },
      ] : [],
      DRIVER_EN_ROUTE: isDriver || isManager ? [
        { label: 'Livré', targetStatus: 'DELIVERED', color: 'success', icon: 'checkmark-done-outline' },
      ] : [],
      DELIVERED: isManager ? [
        { label: 'Compléter', targetStatus: 'COMPLETED', color: 'success', icon: 'trophy-outline' },
      ] : [],
    };

    return map[status as OrderStatus] || [];
  }

  async onTransition(transition: StatusTransition): Promise<void> {
    if (transition.requiresDriver) {
      await this.showDriverAssignment(transition);
      return;
    }

    const a = await this.alert.create({
      header: 'Confirmer',
      message: `Passer la commande à "${transition.label}" ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: () => this.doTransition(transition.targetStatus),
        },
      ],
    });
    await a.present();
  }

  private async showDriverAssignment(transition: StatusTransition): Promise<void> {
    const loading = await this.loading$.create({ message: 'Chargement chauffeurs...' });
    await loading.present();

    this.ordersService.getDrivers().subscribe({
      next: async (drivers) => {
        await loading.dismiss();
        this.drivers = drivers;
        const buttons = drivers.map((d: any) => ({
          text: `${d.firstName} ${d.lastName}`,
          handler: () => this.doTransition(transition.targetStatus, d.id),
        }));
        buttons.push({ text: 'Annuler', handler: () => {} } as any);

        const sheet = await this.actionSheet.create({
          header: 'Choisir un chauffeur',
          buttons,
        });
        await sheet.present();
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('Erreur chargement chauffeurs', 'danger');
      },
    });
  }

  private doTransition(targetStatus: OrderStatus, driverId?: number): void {
    if (!this.order) return;
    const payload: { targetStatus: OrderStatus; driverId?: number } = { targetStatus };
    if (driverId != null) payload.driverId = driverId;

    this.ordersService.transition(this.order.id, payload).subscribe({
      next: (updated) => {
        this.order = updated;
        this.showToast('Statut mis à jour', 'success');
      },
      error: (err) => this.showToast(err.error?.message || 'Erreur', 'danger'),
    });
  }

  async confirmCancel(): Promise<void> {
    const a = await this.alert.create({
      header: 'Annuler la commande',
      message: 'Cette action est irréversible. Continuer ?',
      buttons: [
        { text: 'Non', role: 'cancel' },
        {
          text: 'Oui, annuler',
          role: 'destructive',
          handler: () => {
            this.ordersService.cancelOrder(this.orderId).subscribe({
              next: () => {
                this.showToast('Commande annulée', 'success');
                this.router.navigate(['/orders']);
              },
              error: (err) => this.showToast(err.error?.message || 'Erreur', 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: OrderStatus): string {
    return ORDER_STATUS_COLORS[status] || 'medium';
  }

  orderTotal(): string {
    if (!this.order) return '—';
    if (this.order.totalCommande) {
      return parseFloat(this.order.totalCommande).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' });
    }
    return '—';
  }

  itemTotal(item: { quantiteCommandee: string; prixUnitaire: string }): string {
    const q = parseFloat(item.quantiteCommandee) || 0;
    const p = parseFloat(item.prixUnitaire) || 0;
    return (q * p).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' });
  }

  statusTimelineItems() {
    const all: OrderStatus[] = [
      'DRAFT', 'SUBMITTED', 'MANAGER_REVIEWING', 'MANAGER_APPROVED',
      'READY_FOR_DISPATCH', 'ASSIGNED_TO_DRIVER', 'DRIVER_EN_ROUTE',
      'DELIVERED', 'COMPLETED',
    ];
    if (!this.order) return [];
    const currentIdx = all.indexOf(this.order.status as OrderStatus);
    return all.map((s, i) => ({
      status: s,
      label: ORDER_STATUS_LABELS[s],
      color: ORDER_STATUS_COLORS[s],
      done: i < currentIdx,
      active: i === currentIdx,
    }));
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 2500,
      color,
      position: 'top',
      icon: color === 'danger' ? 'alert-circle-outline' : 'checkmark-circle-outline',
    });
    await t.present();
  }

  trackById(_: number, item: any) {
    return item.id;
  }
}
