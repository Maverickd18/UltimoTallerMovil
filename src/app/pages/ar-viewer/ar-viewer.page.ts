import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';

declare var AFRAME: any;

@Component({
  selector: 'app-ar-viewer',
  templateUrl: './ar-viewer.page.html',
  styleUrls: ['./ar-viewer.page.scss'],
  standalone: false
})
export class ArViewerPage implements OnInit, AfterViewInit {
  @ViewChild('arScene', { static: false }) arSceneRef!: ElementRef;
  @ViewChild('arMarker', { static: false }) arMarkerRef!: ElementRef;
  @ViewChild('arContent', { static: false }) arContentRef!: ElementRef;

  // Estado AR
  isMarkerVisible: boolean = false;
  currentModel: any = null;
  currentModelType: string = 'box';

  // Asset del usuario
  userAssetUrl: string = '';
  userAssetName: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    console.log('🚀 AR Viewer inicializado');
    
    this.route.queryParams.subscribe(params => {
      if (params['assetUrl']) {
        this.userAssetUrl = params['assetUrl'];
        this.userAssetName = params['assetName'] || 'Asset';
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupARMarkers();
      this.createDefaultModel();
    }, 1500);
  }

  setupARMarkers() {
    const marker = this.arMarkerRef?.nativeElement;
    if (!marker) {
      this.showToast('Error: Marcador no encontrado', 'danger');
      return;
    }

    marker.addEventListener('markerFound', () => {
      this.isMarkerVisible = true;
      this.showToast('✓ ¡Marcador detectado!', 'success');
    });

    marker.addEventListener('markerLost', () => {
      this.isMarkerVisible = false;
    });
  }

  createDefaultModel() {
    this.changeModel('box');
    this.showToast('💡 Descarga el marcador Hiro y imprime', 'primary');
  }

  downloadMarker(type: 'hiro' | 'kanji') {
    const urls: any = {
      'hiro': 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png',
      'kanji': 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/kanji.png'
    };

    const link = document.createElement('a');
    link.href = urls[type];
    link.download = `marcador-${type}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`📥 Descargando ${type}...`, 'success');
  }

  showMarkerInfo() {
    this.alertController.create({
      header: '📌 Cómo usar marcadores',
      message: `1. Descargar marcador\n2. Imprimir en A4\n3. Apuntar cámara\n4. ¡Listo!`,
      buttons: ['OK']
    }).then(alert => alert.present());
  }

  changeModel(type: string) {
    const container = this.arContentRef?.nativeElement;
    if (!container) return;

    if (this.currentModel) {
      container.removeChild(this.currentModel);
    }

    let model: any;

    switch(type) {
      case 'box':
        model = document.createElement('a-box');
        model.setAttribute('color', '#4285F4');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('scale', '0.8 0.8 0.8');
        model.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear');
        break;

      case 'sphere':
        model = document.createElement('a-sphere');
        model.setAttribute('color', '#DB4437');
        model.setAttribute('radius', '0.5');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('animation', 'property: position; to: 0 1 0; dir: alternate; loop: true; dur: 2000');
        break;

      case 'cylinder':
        model = document.createElement('a-cylinder');
        model.setAttribute('color', '#F4B400');
        model.setAttribute('radius', '0.3');
        model.setAttribute('height', '1');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('animation', 'property: scale; to: 1.2 1.2 1.2; dir: alternate; loop: true; dur: 1500');
        break;

      case 'pyramid':
        model = document.createElement('a-cone');
        model.setAttribute('color', '#0F9D58');
        model.setAttribute('height', '1.2');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 5000');
        break;

      default:
        model = document.createElement('a-box');
        model.setAttribute('color', '#4285F4');
    }

    container.appendChild(model);
    this.currentModel = model;
    this.currentModelType = type;
    this.showToast(`Modelo: ${type}`, 'primary');
  }

  rotateContent() {
    if (this.currentModel) {
      const currentRotation = this.currentModel.getAttribute('rotation') || '0 0 0';
      const parts = currentRotation.split(' ').map(Number);
      parts[1] = (parts[1] + 45) % 360;
      this.currentModel.setAttribute('rotation', parts.join(' '));
      this.showToast('Rotando...', 'primary');
    }
  }

  async takeScreenshot() {
    try {
      const scene = this.arSceneRef?.nativeElement;
      if (!scene || !scene.renderer) {
        this.showToast('Error al capturar', 'danger');
        return;
      }

      scene.renderer.domElement.toBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ar-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('📷 Screenshot guardado', 'success');
      });
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al guardar', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }

  ionViewWillLeave() {
    this.currentModel = null;
    this.isMarkerVisible = false;
  }
}
