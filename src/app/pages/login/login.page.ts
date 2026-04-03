import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  form: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private socket: SocketService,
    private router: Router,
    private loading: LoadingController,
    private toast: ToastController,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loader = await this.loading.create({ message: 'Connexion en cours...' });
    await loader.present();

    this.auth.login(this.form.value).subscribe({
      next: async () => {
        await loader.dismiss();
        this.socket.connect();
        this.router.navigateByUrl('/orders', { replaceUrl: true });
      },
      error: async (err) => {
        await loader.dismiss();
        const msg = err.error?.message || 'Email ou mot de passe incorrect';
        const t = await this.toast.create({
          message: msg,
          duration: 3000,
          color: 'danger',
          position: 'top',
          icon: 'alert-circle-outline',
        });
        await t.present();
      },
    });
  }

  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
}
