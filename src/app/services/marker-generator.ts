// src/app/services/marker-generator.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MarkerGeneratorService {

  constructor() {}

  /**
   * Genera un marcador AR personalizado a partir de una imagen
   * Convierte la imagen a un formato optimizado para detección AR
   */
  async generateMarkerFromImage(imageFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Tamaño óptimo para marcadores AR
          const markerSize = 512;
          canvas.width = markerSize;
          canvas.height = markerSize;

          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
          }

          // Fondo blanco
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, markerSize, markerSize);

          // Borde negro grueso (mejora detección)
          const borderWidth = 50;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, markerSize, borderWidth); // Top
          ctx.fillRect(0, 0, borderWidth, markerSize); // Left
          ctx.fillRect(markerSize - borderWidth, 0, borderWidth, markerSize); // Right
          ctx.fillRect(0, markerSize - borderWidth, markerSize, borderWidth); // Bottom

          // Calcular dimensiones de la imagen centrada
          const innerSize = markerSize - (borderWidth * 2);
          const scale = Math.min(
            innerSize / img.width,
            innerSize / img.height
          );
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (markerSize - scaledWidth) / 2;
          const y = (markerSize - scaledHeight) / 2;

          // Dibujar imagen centrada
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Aplicar alto contraste para mejor detección
          const imageData = ctx.getImageData(0, 0, markerSize, markerSize);
          this.applyHighContrast(imageData);
          ctx.putImageData(imageData, 0, 0);

          // Convertir a Blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al generar el marcador'));
            }
          }, 'image/png');

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      // Cargar imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Aplica alto contraste a la imagen para mejor detección
   */
  private applyHighContrast(imageData: ImageData) {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Calcular brillo
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // Umbral para blanco o negro
      const threshold = 128;
      const newValue = brightness > threshold ? 255 : 0;
      
      // Aplicar solo al área interior (no al borde)
      data[i] = newValue;     // R
      data[i + 1] = newValue; // G
      data[i + 2] = newValue; // B
      // Alpha permanece igual (data[i + 3])
    }
  }

  /**
   * Genera una vista previa del marcador con la imagen
   */
  async generateMarkerPreview(imageFile: File): Promise<string> {
    const blob = await this.generateMarkerFromImage(imageFile);
    return URL.createObjectURL(blob);
  }

  /**
   * Convierte una imagen a base64 para facilitar el almacenamiento
   */
  async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Genera un ID único para el marcador
   */
  generateMarkerId(): string {
    return `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}