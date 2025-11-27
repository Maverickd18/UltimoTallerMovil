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
  cameraReady: boolean = false;

  // Asset del usuario
  userAssetUrl: string = '';
  userAssetName: string = '';
  markerType: string = 'hiro'; // 'hiro', 'kanji', o 'custom'
  customMarkerUrl: string = '';

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
        this.markerType = params['markerType'] || 'hiro';
        this.customMarkerUrl = params['markerUrl'] || '';
        
        console.log('📦 Asset recibido:', {
          url: this.userAssetUrl,
          name: this.userAssetName,
          markerType: this.markerType,
          markerUrl: this.customMarkerUrl
        });
      }
    });
  }

  ngAfterViewInit() {
    console.log('🎬 Iniciando configuración AR...');
    
    // Esperar a que AR.js cargue completamente
    setTimeout(() => {
      this.initializeAR();
    }, 2000);
  }

  async initializeAR() {
    try {
      console.log('🔧 Configurando AR.js...');
      
      // Verificar que la cámara esté disponible
      await this.requestCameraPermission();
      
      // Configurar marcadores
      this.setupARMarkers();
      
      // Crear modelo por defecto o cargar asset del usuario
      if (this.userAssetUrl) {
        this.loadUserAsset();
      } else {
        this.createDefaultModel();
      }
      
      this.showToast('📷 Cámara lista. Apunta al marcador', 'success');
    } catch (error) {
      console.error('❌ Error inicializando AR:', error);
      this.showToast('Error al iniciar cámara', 'danger');
    }
  }

  async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      this.cameraReady = true;
      console.log('✅ Cámara inicializada');
      
      // Detener el stream temporal
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('❌ Error accediendo a la cámara:', error);
      this.showToast('No se puede acceder a la cámara', 'danger');
      return false;
    }
  }

  setupARMarkers() {
    const marker = this.arMarkerRef?.nativeElement;
    if (!marker) {
      console.error('❌ Marcador no encontrado en el DOM');
      return;
    }

    console.log('🎯 Configurando eventos del marcador...');

    // Configurar eventos del marcador
    marker.addEventListener('markerFound', () => {
      console.log('✅ ¡Marcador detectado!');
      this.isMarkerVisible = true;
      this.showToast('✓ ¡Marcador detectado!', 'success');
    });

    marker.addEventListener('markerLost', () => {
      console.log('⚠️ Marcador perdido');
      this.isMarkerVisible = false;
    });

    // Configurar marcador personalizado si existe
    if (this.markerType === 'custom' && this.customMarkerUrl) {
      console.log('🎨 Usando marcador personalizado:', this.customMarkerUrl);
      marker.setAttribute('type', 'pattern');
      marker.setAttribute('url', this.customMarkerUrl);
    }

    console.log('✅ Marcadores configurados');
  }

  loadUserAsset() {
    const container = this.arContentRef?.nativeElement;
    if (!container) {
      console.error('❌ Contenedor AR no encontrado');
      return;
    }

    console.log('📦 Cargando asset del usuario:', this.userAssetUrl);

    // Limpiar contenido previo
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Crear plano con la imagen del usuario
    const plane = document.createElement('a-plane');
    plane.setAttribute('src', this.userAssetUrl);
    plane.setAttribute('position', '0 0.5 0');
    plane.setAttribute('rotation', '-90 0 0');
    plane.setAttribute('width', '1.5');
    plane.setAttribute('height', '1.5');
    plane.setAttribute('material', 'transparent: true');
    
    container.appendChild(plane);
    this.currentModel = plane;
    
    console.log('✅ Asset del usuario cargado');
    this.showToast(`Cargado: ${this.userAssetName}`, 'primary');
  }

  createDefaultModel() {
    console.log('🎨 Creando modelo por defecto');
    this.changeModel('box');
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

  async showMarkerInfo() {
    let message = `
      <div style="text-align: left; padding: 10px;">
        <h3 style="margin-top: 0;">📌 Cómo usar</h3>
        <ol style="padding-left: 20px;">
          <li><strong>Descarga</strong> un marcador (botones abajo)</li>
          <li><strong>Imprime</strong> en hoja A4</li>
          <li><strong>Apunta</strong> tu cámara al marcador</li>
          <li><strong>Mantén</strong> buena iluminación</li>
        </ol>
        
        <h4>💡 Consejos:</h4>
        <ul style="padding-left: 20px; font-size: 13px;">
          <li>Usa papel blanco mate</li>
          <li>Evita reflejos y sombras</li>
          <li>Mantén el marcador plano</li>
          <li>Distancia ideal: 30-50cm</li>
        </ul>
      </div>
    `;

    if (this.customMarkerUrl) {
      message += `
        <div style="text-align: center; margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 8px;">
          <p style="margin: 5px 0; font-weight: 600; color: #4285F4;">
            🎯 Tienes un marcador personalizado
          </p>
          <img src="${this.customMarkerUrl}" style="max-width: 150px; margin: 10px auto; border: 2px solid #4285F4; border-radius: 4px;">
        </div>
      `;
    }

    const alert = await this.alertController.create({
      header: '📱 Guía de uso',
      message: message,
      buttons: ['Entendido']
    });
    
    await alert.present();
  }

  changeModel(type: string) {
    const container = this.arContentRef?.nativeElement;
    if (!container) return;

    // Limpiar modelo anterior
    while (container.firstChild) {
      container.removeChild(container.firstChild);
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
        link.download = `ar-screenshot-${Date.now()}.png`;
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
      duration: 2500,
      position: 'top',
      color
    });
    await toast.present();
  }

  ionViewWillLeave() {
    // Limpiar recursos
    this.currentModel = null;
    this.isMarkerVisible = false;
    this.cameraReady = false;
    console.log('👋 Saliendo del visor AR');
  }
}