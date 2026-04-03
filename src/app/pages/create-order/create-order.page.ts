import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { OrdersService } from '../../core/services/orders.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-create-order',
  templateUrl: './create-order.page.html',
  styleUrls: ['./create-order.page.scss'],
})
export class CreateOrderPage implements OnInit {
  form!: FormGroup;
  pdvs: any[] = [];
  produits: any[] = [];
  loadingData = true;

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      pdvId: ['', Validators.required],
      notes: [''],
      items: this.fb.array([this.createItem()]),
    });

    this.loadData();
  }

  private loadData(): void {
    this.loadingData = true;
    const api = environment.apiUrl;
    Promise.all([
      this.http.get<any[]>(`${api}/pdvs`).toPromise(),
      this.http.get<any[]>(`${api}/produits`).toPromise(),
    ])
      .then(([pdvs, produits]) => {
        this.pdvs = pdvs || [];
        this.produits = produits || [];
        this.loadingData = false;
      })
      .catch(() => {
        this.loadingData = false;
        this.showToast('Erreur de chargement des données', 'danger');
      });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      produitId: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onProduitSelect(index: number): void {
    const item = this.items.at(index);
    const produitId = item.get('produitId')?.value;
    const produit = this.produits.find((p) => p.id === produitId);
    if (produit?.prixVente) {
      item.get('prixUnitaire')?.setValue(produit.prixVente);
    }
  }

  getProduitName(produitId: string): string {
    return this.produits.find((p) => p.id === produitId)?.nom || '';
  }

  getLineTotal(index: number): number {
    const item = this.items.at(index);
    const qty = item.get('quantite')?.value || 0;
    const prix = item.get('prixUnitaire')?.value || 0;
    return qty * prix;
  }

  get grandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.getLineTotal(i);
    }
    return total;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Veuillez remplir tous les champs requis', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Création en cours...' });
    await loading.present();

    const payload = {
      pdvId: this.form.value.pdvId,
      notes: this.form.value.notes || undefined,
      items: this.form.value.items.map((i: any) => ({
        produitId: i.produitId,
        quantite: Number(i.quantite),
        prixUnitaire: String(i.prixUnitaire),
      })),
    };

    this.ordersService.createOrder(payload).subscribe({
      next: async (order) => {
        await loading.dismiss();
        this.showToast('Commande créée avec succès', 'success');
        this.router.navigate(['/orders', order.id]);
      },
      error: async (err) => {
        await loading.dismiss();
        this.showToast(err.error?.message || 'Erreur lors de la création', 'danger');
      },
    });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
      icon: color === 'danger' || color === 'warning' ? 'alert-circle-outline' : 'checkmark-circle-outline',
    });
    await t.present();
  }
}
