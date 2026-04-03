import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';

export interface SocketOrderEvent {
  type: 'status_changed' | 'exception' | 'location';
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private connected = false;

  // Typed event streams
  private orderStatusChanged$ = new Subject<any>();
  private orderException$ = new Subject<any>();
  private driverLocation$ = new Subject<any>();

  connect(): void {
    if (this.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[Socket] Disconnected');
    });

    this.socket.on('order:status_changed', (data: any) => {
      this.orderStatusChanged$.next(data);
    });

    this.socket.on('order:exception', (data: any) => {
      this.orderException$.next(data);
    });

    this.socket.on('driver:location', (data: any) => {
      this.driverLocation$.next(data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  joinOrderRoom(orderId: number): void {
    if (!this.socket) return;
    this.socket.emit('join:order', { id: orderId });
  }

  leaveOrderRoom(orderId: number): void {
    if (!this.socket) return;
    this.socket.emit('leave:order', { id: orderId });
  }

  joinDriverRoom(driverId: number): void {
    if (!this.socket) return;
    this.socket.emit('join:driver', { id: driverId });
  }

  onOrderStatusChanged(): Observable<any> {
    return this.orderStatusChanged$.asObservable();
  }

  onOrderException(): Observable<any> {
    return this.orderException$.asObservable();
  }

  onDriverLocation(): Observable<any> {
    return this.driverLocation$.asObservable();
  }

  isConnected(): boolean {
    return this.connected;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.orderStatusChanged$.complete();
    this.orderException$.complete();
    this.driverLocation$.complete();
  }
}
