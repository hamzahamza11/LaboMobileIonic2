import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import {
  CreateOrderRequest,
  Order,
  OrdersFilter,
  TransitionRequest,
} from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly base = `${environment.apiUrl}/orders`;

  private ordersSubject = new BehaviorSubject<Order[]>([]);
  orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getOrders(filters?: OrdersFilter): Observable<Order[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.pdvId) params = params.set('pdvId', filters.pdvId.toString());
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<Order[]>(this.base, { params }).pipe(
      tap((orders) => this.ordersSubject.next(orders)),
    );
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  createOrder(payload: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.base, payload).pipe(
      tap((newOrder) => {
        const current = this.ordersSubject.value;
        this.ordersSubject.next([newOrder, ...current]);
      }),
    );
  }

  transition(id: number, payload: TransitionRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/transition`, payload).pipe(
      tap((updated) => this.updateInList(updated)),
    );
  }

  cancelOrder(id: number): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/${id}/cancel`, {}).pipe(
      tap((updated) => this.updateInList(updated)),
    );
  }

  rejectOrder(id: number, notes?: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/${id}/reject`, { notes }).pipe(
      tap((updated) => this.updateInList(updated)),
    );
  }

  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/drivers`);
  }

  updateOrderInList(order: Order): void {
    this.updateInList(order);
  }

  private updateInList(updated: Order): void {
    const current = this.ordersSubject.value;
    const idx = current.findIndex((o) => o.id === updated.id);
    if (idx !== -1) {
      const next = [...current];
      next[idx] = updated;
      this.ordersSubject.next(next);
    }
  }
}
