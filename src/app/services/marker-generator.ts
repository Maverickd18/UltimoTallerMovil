// src/app/services/marker-generator.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MarkerGeneratorService {

  constructor() {}

  /**
   * Genera un marcador AR personalizado optimizado para AR.js
   * Crea un patrón de alto contraste basado en la imagen
   */
  async generateMarkerFromImage(imageFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Tamaño óptimo para AR.js: 16x16 pattern en 512x512 canvas
          const canvasSize = 512;
          const patternSize = 16; // AR.js usa 16x16 para pattern matching
          const borderSize = 64; // Borde más grueso para mejor detección
          
          canvas.width = canvasSize;
          canvas.height = canvasSize;

          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
          }

          // 1. Fondo blanco completo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvasSize, canvasSize);

          // 2. Borde negro grueso (crítico para AR.js)
          ctx.fillStyle = '#000000';
          // Top border
          ctx.fillRect(0, 0, canvasSize, borderSize);
          // Left border
          ctx.fillRect(0, 0, borderSize, canvasSize);
          // Right border
          ctx.fillRect(canvasSize - borderSize, 0, borderSize, canvasSize);
          // Bottom border
          ctx.fillRect(0, canvasSize - borderSize, canvasSize, borderSize);

          // 3. Área interior para la imagen
          const innerSize = canvasSize - (borderSize * 2);
          const scale = Math.min(
            innerSize / img.width,
            innerSize / img.height
          );
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvasSize - scaledWidth) / 2;
          const y = (canvasSize - scaledHeight) / 2;

          // Dibujar imagen centrada
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // 4. Aplicar procesamiento para mejorar detección
          const imageData = ctx.getImageData(
            borderSize, 
            borderSize, 
            innerSize, 
            innerSize
          );
          
          this.enhanceForARDetection(imageData);
          
          ctx.putImageData(imageData, borderSize, borderSize);

          // 5. Añadir marcadores de orientación (esquinas)
          this.addOrientationMarkers(ctx, canvasSize, borderSize);

          // Convertir a Blob
          canvas.toBlob((blob) => {
            if (blob) {
              console.log('✅ Marcador generado:', blob.size, 'bytes');
              resolve(blob);
            } else {
              reject(new Error('Error al generar el marcador'));
            }
          }, 'image/png', 1.0); // Máxima calidad

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
   * Mejora la imagen para detección AR
   * Aplica alto contraste y reduce ruido
   */
  private enhanceForARDetection(imageData: ImageData) {
    const data = imageData.data;
    const pixels: number[] = [];
    
    // 1. Recopilar valores de brillo
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      pixels.push(brightness);
    }
    
    // 2. Calcular umbral usando método Otsu simplificado
    const threshold = this.calculateOtsuThreshold(pixels);
    
    // 3. Aplicar binarización con el umbral
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = brightness > threshold ? 255 : 0;
      
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      // Alpha permanece igual (data[i + 3])
    }
  }

  /**
   * Calcula umbral óptimo usando método Otsu
   */
  private calculateOtsuThreshold(pixels: number[]): number {
    const histogram = new Array(256).fill(0);
    
    // Crear histograma
    for (const pixel of pixels) {
      histogram[Math.floor(pixel)]++;
    }
    
    const total = pixels.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const variance = wB * wF * (mB - mF) * (mB - mF);
      
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }
    
    return threshold;
  }

  /**
   * Añade marcadores en las esquinas para orientación
   */
  private addOrientationMarkers(
    ctx: CanvasRenderingContext2D, 
    canvasSize: number, 
    borderSize: number
  ) {
    const markerSize = borderSize / 3;
    ctx.fillStyle = '#FFFFFF';
    
    // Marcador superior izquierdo (más grande)
    ctx.fillRect(
      borderSize / 4,
      borderSize / 4,
      markerSize * 1.5,
      markerSize * 1.5
    );
    
    // Marcadores en otras esquinas (más pequeños)
    // Superior derecha
    ctx.fillRect(
      canvasSize - borderSize / 4 - markerSize,
      borderSize / 4,
      markerSize,
      markerSize
    );
    
    // Inferior izquierda
    ctx.fillRect(
      borderSize / 4,
      canvasSize - borderSize / 4 - markerSize,
      markerSize,
      markerSize
    );
  }

  /**
   * Genera un archivo .patt para AR.js (opcional, avanzado)
   */
  async generatePattFile(imageFile: File): Promise<string> {
    // Esta función generaría un archivo .patt compatible con AR.js
    // Por ahora, usamos el método de imagen que es más simple
    return 'Pattern file generation - advanced feature';
  }

  /**
   * Genera vista previa del marcador
   */
  async generateMarkerPreview(imageFile: File): Promise<string> {
    const blob = await this.generateMarkerFromImage(imageFile);
    return URL.createObjectURL(blob);
  }

  /**
   * Valida que la imagen sea adecuada para un marcador
   */
  validateMarkerImage(file: File): { valid: boolean; message: string } {
    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        message: 'La imagen debe ser menor a 5MB'
      };
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Solo se permiten imágenes PNG o JPG'
      };
    }

    return {
      valid: true,
      message: 'Imagen válida'
    };
  }

  /**
   * Genera ID único para el marcador
   */
  generateMarkerId(): string {
    return `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Optimiza imagen antes de generar marcador
   */
  async optimizeImageForMarker(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Redimensionar a tamaño óptimo (máximo 1024x1024)
        const maxSize = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/png'
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Error al optimizar imagen'));
            }
          }, 'image/png', 0.9);
        } else {
          reject(new Error('Error con canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}