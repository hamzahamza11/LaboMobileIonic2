export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MANAGER_REVIEWING'
  | 'MANAGER_APPROVED'
  | 'READY_FOR_DISPATCH'
  | 'ASSIGNED_TO_DRIVER'
  | 'WAREHOUSE_LOADING'
  | 'READY_FOR_PICKUP'
  | 'DRIVER_PICKED_UP'
  | 'DRIVER_EN_ROUTE'
  | 'DRIVER_ARRIVED'
  | 'DELIVERED'
  | 'RECEPTION_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  MANAGER_REVIEWING: 'En révision',
  MANAGER_APPROVED: 'Approuvée',
  READY_FOR_DISPATCH: 'Prête à expédier',
  ASSIGNED_TO_DRIVER: 'Assignée au chauffeur',
  WAREHOUSE_LOADING: 'Chargement entrepôt',
  READY_FOR_PICKUP: 'Prête pour enlèvement',
  DRIVER_PICKED_UP: 'Enlèvement effectué',
  DRIVER_EN_ROUTE: 'En route',
  DRIVER_ARRIVED: 'Arrivé à destination',
  DELIVERED: 'Livrée',
  RECEPTION_CONFIRMED: 'Réception confirmée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'medium',
  SUBMITTED: 'primary',
  MANAGER_REVIEWING: 'warning',
  MANAGER_APPROVED: 'success',
  READY_FOR_DISPATCH: 'tertiary',
  ASSIGNED_TO_DRIVER: 'secondary',
  WAREHOUSE_LOADING: 'warning',
  READY_FOR_PICKUP: 'primary',
  DRIVER_PICKED_UP: 'secondary',
  DRIVER_EN_ROUTE: 'tertiary',
  DRIVER_ARRIVED: 'warning',
  DELIVERED: 'success',
  RECEPTION_CONFIRMED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export interface OrderItem {
  id: number;
  orderId: number;
  produitId: number;
  quantiteCommandee: string;
  prixUnitaire: string;
  produit?: {
    id: number;
    code: string;
    nom: string;
    unite?: { symbole: string };
  };
  createdAt: string;
}

export interface OrderStatusLog {
  id: number;
  orderId: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  triggeredById: number;
  triggeredByRole: string;
  notes: string | null;
  createdAt: string;
}

export interface OrderUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface OrderPdv {
  id: number;
  nom: string;
  code?: string;
  latitude?: string;
  longitude?: string;
  adresse?: string;
}

export interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  pdvId: number | null;
  pdv: OrderPdv | null;
  createdByChefId: number;
  chef: OrderUser;
  driverId: number | null;
  driver: OrderUser | null;
  notes: string | null;
  items: OrderItem[];
  statusLogs: OrderStatusLog[];
  totalCommande: string | null;
  totalPickup: string | null;
  totalDelivery: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  commandeDocumentId: number | null;
  livraisonDocumentId: number | null;
  receptionDocumentId: number | null;
}

export interface CreateOrderRequest {
  pdvId: number;
  items: { produitId: number; quantiteCommandee: number; prixUnitaire: number }[];
  notes?: string;
}

export interface TransitionRequest {
  targetStatus: OrderStatus;
  driverId?: number;
  notes?: string;
}

export interface OrdersFilter {
  status?: OrderStatus;
  pdvId?: number;
  page?: number;
  limit?: number;
}
