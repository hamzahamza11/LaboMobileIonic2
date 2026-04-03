import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const ok = await this.auth.isAuthenticated();
    if (!ok) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
    return ok;
  }
}
