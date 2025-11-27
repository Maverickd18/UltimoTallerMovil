import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { ToastController, AlertController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.page.html',
  styleUrls: ['./assets.page.scss'],
  standalone: false
})
export class AssetsPage implements OnInit {

  assets: any[] = [];
  selectedFile: File | null = null;
  previewUrl: string = '';

  loading = false;
  uploading = false;

  constructor(
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
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

    // Generar vista previa
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async uploadFile() {
    if (!this.selectedFile) {
      this.showToast('Selecciona un archivo primero', 'warning');
      return;
    }

    this.uploading = true;
    console.log('Iniciando subida de archivo y generación de marcador...');

    const result = await this.supabaseService.uploadAsset(this.selectedFile);

    if (!result.success) {
      this.showToast('Error al subir: ' + result.error, 'danger');
      this.uploading = false;
      return;
    }

    // Mensaje de éxito con información del marcador
    if (result.markerUrl) {
      this.showToast('✓ Asset subido con marcador personalizado', 'success');
    } else {
      this.showToast('✓ Asset subido (usa marcador Hiro)', 'success');
    }

    this.selectedFile = null;
    this.previewUrl = '';
    this.uploading = false;

    // Recargar lista
    await this.loadAssets();
  }

  async viewInAR(asset: any) {
    console.log('Ver en AR:', asset);
    
    // Determinar qué tipo de marcador usar
    const markerType = asset.marker_url ? 'custom' : 'hiro';
    
    // Navegar al visor AR con parámetros
    this.router.navigate(['/ar-viewer'], {
      queryParams: {
        assetUrl: asset.file_url,
        assetName: asset.name,
        assetId: asset.id,
        markerType: markerType,
        markerUrl: asset.marker_url || ''
      }
    });
  }

  async viewMarker(asset: any) {
    if (!asset.marker_url) {
      this.showToast('Este asset no tiene un marcador generado', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: '🎯 Marcador Personalizado',
      message: `
        <div style="text-align: center; padding: 20px;">
          <img src="${asset.marker_url}" style="max-width: 100%; border: 3px solid #4285F4; border-radius: 8px; margin-bottom: 15px;">
          <p style="font-size: 14px; color: #666;">
            Este es tu marcador personalizado para <strong>${asset.name}</strong>
          </p>
          <p style="font-size: 13px; color: #999; margin-top: 10px;">
            📌 Imprime o muestra este marcador para ver tu contenido en AR
          </p>
        </div>
      `,
      buttons: [
        {
          text: 'Descargar',
          handler: () => {
            this.downloadMarker(asset.marker_url, asset.name);
          }
        },
        {
          text: 'Ver en AR',
          handler: () => {
            this.viewInAR(asset);
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async downloadMarker(markerUrl: string, assetName: string) {
    try {
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = markerUrl;
      link.download = `marker_${assetName}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('📥 Descargando marcador...', 'success');
    } catch (error) {
      console.error('Error descargando marcador:', error);
      this.showToast('Error al descargar el marcador', 'danger');
    }
  }

  async deleteAsset(asset: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Eliminar "${asset.name}" y su marcador personalizado?`,
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
            
            const result = await this.supabaseService.deleteAsset(
              asset.id, 
              asset.file_path,
              asset.marker_path
            );

            if (!result.success) {
              this.showToast('Error eliminando: ' + result.error, 'danger');
              return;
            }

            this.showToast('✓ Asset y marcador eliminados', 'success');
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
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}