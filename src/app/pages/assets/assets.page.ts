import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.page.html',
  styleUrls: ['./assets.page.scss'],
  standalone: false
})
export class AssetsPage implements OnInit {

  assets: any[] = [];
  selectedFile: File | null = null;

  loading = false;
  uploading = false;

  constructor(
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadAssets();
  }

  async loadAssets() {
    this.loading = true;

    const result = await this.supabaseService.getUserAssets();

    if (!result.success) {
      this.showToast('Error cargando assets', 'danger');
      this.loading = false;
      return;
    }

    this.assets = result.assets;
    this.loading = false;
  }

  refreshAssets() {
    this.loadAssets();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('El archivo excede los 5MB', 'warning');
      return;
    }

    this.selectedFile = file;
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    this.uploading = true;

    const result = await this.supabaseService.uploadAsset(this.selectedFile);

    if (!result.success) {
      this.showToast('Error al subir el archivo', 'danger');
      this.uploading = false;
      return;
    }

    this.showToast('Asset subido correctamente', 'success');
    this.selectedFile = null;
    this.uploading = false;

    this.loadAssets();
  }

  viewInAR(asset: any) {
    console.log('Ver en AR:', asset);
    this.showToast('Función AR próximamente 😎', 'medium');
  }

  async deleteAsset(asset: any) {
    const result = await this.supabaseService.deleteAsset(asset.id, asset.file_path);

    if (!result.success) {
      this.showToast('Error eliminando asset', 'danger');
      return;
    }

    this.showToast('Asset eliminado', 'success');
    this.loadAssets();
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
