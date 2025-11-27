import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { ToastController, AlertController } from '@ionic/angular';

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
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAssets();
  }

  ionViewWillEnter() {
    // Recargar assets cada vez que se entra a la página
    this.loadAssets();
  }

  async loadAssets() {
    this.loading = true;

    const result = await this.supabaseService.getUserAssets();

    if (!result.success) {
      this.showToast('Error cargando assets: ' + result.error, 'danger');
      this.loading = false;
      return;
    }

    this.assets = result.assets || [];
    console.log('Assets cargados:', this.assets.length);
    this.loading = false;
  }

  refreshAssets() {
    this.showToast('Recargando assets...', 'primary');
    this.loadAssets();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Solo se permiten imágenes PNG o JPG', 'warning');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('El archivo excede los 5MB', 'warning');
      return;
    }

    this.selectedFile = file;
    console.log('Archivo seleccionado:', file.name, file.size);
  }

  async uploadFile() {
    if (!this.selectedFile) {
      this.showToast('Selecciona un archivo primero', 'warning');
      return;
    }

    this.uploading = true;
    console.log('Iniciando subida de archivo...');

    const result = await this.supabaseService.uploadAsset(this.selectedFile);

    if (!result.success) {
      this.showToast('Error al subir: ' + result.error, 'danger');
      this.uploading = false;
      return;
    }

    this.showToast('✓ Asset subido correctamente', 'success');
    this.selectedFile = null;
    this.uploading = false;

    // Recargar lista
    await this.loadAssets();
  }

  async viewInAR(asset: any) {
    console.log('Ver en AR:', asset);
    
    // Navegar al visor AR con parámetros
    this.router.navigate(['/ar-viewer'], {
      queryParams: {
        assetUrl: asset.file_url,
        assetName: asset.name,
        assetId: asset.id
      }
    });
  }

  async deleteAsset(asset: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Eliminar "${asset.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            console.log('Eliminando asset:', asset.id);
            
            const result = await this.supabaseService.deleteAsset(asset.id, asset.file_path);

            if (!result.success) {
              this.showToast('Error eliminando: ' + result.error, 'danger');
              return;
            }

            this.showToast('✓ Asset eliminado', 'success');
            await this.loadAssets();
          }
        }
      ]
    });

    await alert.present();
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