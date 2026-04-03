import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip auth endpoints
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
      return next.handle(req);
    }

    return from(this.auth.getToken()).pipe(
      switchMap((token) => {
        const authReq = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;
        return next.handle(authReq);
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          return this.auth.refreshToken().pipe(
            switchMap((res) => {
              const retried = req.clone({
                setHeaders: { Authorization: `Bearer ${res.accessToken}` },
              });
              return next.handle(retried);
            }),
            catchError(() => {
              this.auth.logout();
              return throwError(() => err);
            }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
