import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, switchMap, tap } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { environment } from '@env/environment';
import { AuthResponse, LoginRequest, User } from '../models/auth.model';
import { Router } from '@angular/router';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router,
  ) {}

  async init(): Promise<void> {
    await this.storage.create();
    const user = await this.storage.get(USER_KEY);
    if (user) this.currentUserSubject.next(user);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  isManagerOrAdmin(): boolean {
    return ['admin', 'manager', 'directeur'].some(r => this.hasRole(r));
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, credentials).pipe(
      tap(async (res) => {
        await this.storage.set(TOKEN_KEY, res.accessToken);
        await this.storage.set(REFRESH_KEY, res.refreshToken);
        await this.storage.set(USER_KEY, res.user);
        this.currentUserSubject.next(res.user);
      }),
    );
  }

  async logout(): Promise<void> {
    const refreshToken = await this.storage.get(REFRESH_KEY);
    if (refreshToken) {
      this.http.post(`${this.base}/auth/logout`, { refreshToken }).subscribe();
    }
    await this.storage.remove(TOKEN_KEY);
    await this.storage.remove(REFRESH_KEY);
    await this.storage.remove(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async getToken(): Promise<string | null> {
    return this.storage.get(TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.storage.get(REFRESH_KEY);
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return from(this.storage.get(REFRESH_KEY)).pipe(
      switchMap((refreshToken) =>
        this.http.post<{ accessToken: string }>(`${this.base}/auth/refresh`, { refreshToken }),
      ),
      tap(async (res) => {
        await this.storage.set(TOKEN_KEY, res.accessToken);
      }),
    );
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}
