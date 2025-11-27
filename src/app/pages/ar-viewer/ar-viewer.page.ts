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

  // Configuración dinámica
  markerType: string = 'hiro'; // hiro, kanji, pattern
  markerUrl: string = ''; // URL del patrón personalizado
  contentPosition: string = '0 0.5 0';
  contentScale: string = '1 1 1';
  isMarkerVisible: boolean = false;

  // Asset del usuario (si viene desde Assets page)
  userAssetUrl: string = '';
  userAssetName: string = '';
  
  // Modelo 3D actual
  currentModel: any = null;
  currentModelType: string = 'box';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    console.log('AR Viewer inicializado');
    
    // Obtener parámetros de la ruta
    this.route.queryParams.subscribe(params => {
      // Parámetros opcionales del marcador
      if (params['marker']) {
        this.markerType = params['marker'];
        console.log('Tipo de marcador:', this.markerType);
      }
      if (params['markerUrl']) {
        this.markerUrl = params['markerUrl'];
        console.log('URL del marcador:', this.markerUrl);
      }

      // Parámetros del asset del usuario
      if (params['assetUrl']) {
        this.userAssetUrl = params['assetUrl'];
        this.userAssetName = params['assetName'] || 'Asset';
        console.log('Asset del usuario:', this.userAssetName, this.userAssetUrl);
      }
    });
  }

  ngAfterViewInit() {
    console.log('Vista AR inicializada');
    
    // Esperar a que A-Frame se inicialice completamente
    setTimeout(() => {
      this.initializeAR();
    }, 1500);
  }

  initializeAR() {
    const marker = this.arMarkerRef?.nativeElement;
    const scene = this.arSceneRef?.nativeElement;

    if (!marker || !scene) {
      console.error('Referencias AR no encontradas');
      this.showToast('Error al inicializar AR', 'danger');
      return;
    }

    console.log('Configurando eventos del marcador...');

    // Eventos del marcador
    marker.addEventListener('markerFound', () => {
      console.log('✅ Marcador encontrado');
      this.isMarkerVisible = true;
      this.showToast('¡Marcador detectado!', 'success');
    });

    marker.addEventListener('markerLost', () => {
      console.log('❌ Marcador perdido');
      this.isMarkerVisible = false;
    });

    // Crear modelo 3D o cargar asset del usuario
    if (this.userAssetUrl) {
      console.log('Cargando asset del usuario:', this.userAssetUrl);
      this.createImageModel(this.userAssetUrl);
    } else {
      console.log('Creando modelo 3D por defecto');
      this.createModel(this.currentModelType);
    }
    
    console.log('AR inicializado correctamente');
    const message = this.userAssetUrl 
      ? `Asset "${this.userAssetName}" cargado` 
      : 'AR listo. Apunta a un marcador Hiro';
    this.showToast(message, 'primary');
  }

  // Crear modelo 3D de imagen desde URL
  createImageModel(imageUrl: string) {
    const container = this.arContentRef?.nativeElement;
    
    if (!container) {
      console.error('Contenedor AR no encontrado');
      return;
    }

    // Limpiar modelo anterior
    if (this.currentModel) {
      container.removeChild(this.currentModel);
    }

    console.log('Creando plano con imagen:', imageUrl);

    // Crear plano con la imagen
    const plane = document.createElement('a-plane');
    plane.setAttribute('src', imageUrl);
    plane.setAttribute('position', '0 0.5 0');
    plane.setAttribute('rotation', '-90 0 0');
    plane.setAttribute('width', '2');
    plane.setAttribute('height', '2');
    plane.setAttribute('material', 'transparent: true');
    plane.setAttribute('animation', 'property: rotation; to: -90 360 0; loop: true; dur: 10000; easing: linear');

    container.appendChild(plane);
    this.currentModel = plane;
    this.currentModelType = 'user-image';
    
    console.log('Imagen cargada exitosamente');
  }

  createModel(type: string) {
    const container = this.arContentRef?.nativeElement;
    
    if (!container) {
      console.error('Contenedor AR no encontrado');
      return;
    }

    // Limpiar modelo anterior
    if (this.currentModel) {
      console.log('Eliminando modelo anterior:', this.currentModelType);
      container.removeChild(this.currentModel);
    }

    let model: any;

    console.log('Creando modelo:', type);

    switch (type) {
      case 'box':
        model = document.createElement('a-box');
        model.setAttribute('color', '#4285F4');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('rotation', '0 45 0');
        model.setAttribute('scale', '0.8 0.8 0.8');
        model.setAttribute('animation', 'property: rotation; to: 0 405 0; loop: true; dur: 4000; easing: linear');
        model.setAttribute('shadow', 'cast: true; receive: false');
        break;

      case 'sphere':
        model = document.createElement('a-sphere');
        model.setAttribute('color', '#DB4437');
        model.setAttribute('radius', '0.5');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('animation', 'property: position; to: 0 1 0; dir: alternate; loop: true; dur: 2000; easing: easeInOutQuad');
        model.setAttribute('shadow', 'cast: true; receive: false');
        break;

      case 'cylinder':
        model = document.createElement('a-cylinder');
        model.setAttribute('color', '#F4B400');
        model.setAttribute('radius', '0.3');
        model.setAttribute('height', '1');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('animation', 'property: scale; to: 1.2 1.2 1.2; dir: alternate; loop: true; dur: 1500; easing: easeInOutQuad');
        model.setAttribute('shadow', 'cast: true; receive: false');
        break;

      case 'text':
        model = document.createElement('a-text');
        model.setAttribute('value', 'Hola AR!');
        model.setAttribute('color', '#0F9D58');
        model.setAttribute('align', 'center');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('scale', '2 2 2');
        model.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear');
        break;

      case 'torus':
        model = document.createElement('a-torus');
        model.setAttribute('color', '#9C27B0');
        model.setAttribute('radius', '0.5');
        model.setAttribute('radius-tubular', '0.1');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('rotation', '90 0 0');
        model.setAttribute('animation', 'property: rotation; to: 90 360 0; loop: true; dur: 5000; easing: linear');
        model.setAttribute('shadow', 'cast: true; receive: false');
        break;

      default:
        model = document.createElement('a-box');
        model.setAttribute('color', '#4285F4');
        model.setAttribute('position', '0 0.5 0');
        model.setAttribute('scale', '0.8 0.8 0.8');
    }

    container.appendChild(model);
    this.currentModel = model;
    this.currentModelType = type;
    
    console.log('Modelo creado exitosamente:', type);
  }

  changeModel(type: string) {
    console.log('Cambiando a modelo:', type);
    this.createModel(type);
    this.showToast(`Modelo: ${type}`, 'primary');
  }

  async takeScreenshot() {
    try {
      const scene = this.arSceneRef?.nativeElement;
      
      if (!scene) {
        this.showToast('Error: Escena no disponible', 'danger');
        return;
      }

      // Método usando canvas
      const renderer = scene.renderer;
      if (renderer && renderer.domElement) {
        const canvas = renderer.domElement;
        
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ar-screenshot-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('Screenshot guardado ✓', 'success');
          } else {
            this.showToast('Error al capturar', 'danger');
          }
        }, 'image/png');
      } else {
        this.showToast('Renderizador no disponible', 'warning');
      }
    } catch (error) {
      console.error('Error al tomar screenshot:', error);
      this.showToast('Error al guardar screenshot', 'danger');
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
    console.log('Saliendo de AR Viewer');
    
    // Limpiar recursos
    if (this.currentModel) {
      this.currentModel = null;
    }
    
    this.isMarkerVisible = false;
  }

  ionViewDidEnter() {
    console.log('Entrando a AR Viewer');
  }
}