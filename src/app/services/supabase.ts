// src/app/services/supabase.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth';
import { MarkerGeneratorService } from './marker-generator';

const supabaseUrl = 'https://jghckwjbnbeeanahgyvr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaGNrd2pibmJlZWFuYWhneXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjE1OTIsImV4cCI6MjA3OTY5NzU5Mn0._HHlAYvxHh8kWQfR6dyBUvOpkH9s7ag65DCnGJ0uKnQ';

export interface ArAsset {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_url: string;
  marker_type: string;
  marker_url?: string;
  marker_path?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucketName = 'RealidadA';

  constructor(
    private authService: AuthService,
    private markerGenerator: MarkerGeneratorService
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase inicializado correctamente');
  }

  /**
   * Subir asset con generación automática de marcador AR
   */
  async uploadAsset(file: File): Promise<any> {
    try {
      const user = this.authService.currentUserValue;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Validar imagen
      const validation = this.markerGenerator.validateMarkerImage(file);
      if (!validation.valid) {
        return { success: false, error: validation.message };
      }

      console.log('📤 Iniciando subida de asset...');

      // 1. Optimizar imagen si es necesario
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // Si es mayor a 2MB
        console.log('🔧 Optimizando imagen...');
        processedFile = await this.markerGenerator.optimizeImageForMarker(file);
        console.log('✅ Imagen optimizada:', processedFile.size, 'bytes');
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${user.uid}_${Date.now()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      // 2. Subir imagen original
      console.log('☁️ Subiendo imagen a Supabase...');
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Error al subir archivo:', error);
        return { success: false, error: error.message };
      }

      // 3. Obtener URL pública de la imagen
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('✅ Imagen subida:', urlData.publicUrl);

      // 4. Generar marcador AR personalizado
      let markerUrl = '';
      let markerPath = '';
      
      try {
        console.log('🎯 Generando marcador AR personalizado...');
        
        const markerBlob = await this.markerGenerator.generateMarkerFromImage(processedFile);
        const markerFileName = `marker_${fileName.replace(/\.[^/.]+$/, '')}.png`;
        const markerFilePath = `${user.uid}/markers/${markerFileName}`;

        console.log('📤 Subiendo marcador generado...');
        const { error: markerError } = await this.supabase.storage
          .from(this.bucketName)
          .upload(markerFilePath, markerBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/png'
          });

        if (markerError) {
          console.warn('⚠️ Error al subir marcador:', markerError);
          // Continuar sin marcador personalizado (usará Hiro por defecto)
        } else {
          const { data: markerUrlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(markerFilePath);
          
          markerUrl = markerUrlData.publicUrl;
          markerPath = markerFilePath;
          console.log('✅ Marcador AR generado exitosamente');
          console.log('📍 URL del marcador:', markerUrl);
        }
      } catch (markerError) {
        console.error('❌ Error generando marcador:', markerError);
        // Continuar sin marcador personalizado
      }

      // 5. Guardar metadata localmente
      const asset: ArAsset = {
        id: `asset_${user.uid}_${Date.now()}`,
        user_id: user.uid,
        name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        marker_type: markerUrl ? 'custom' : 'hiro',
        marker_url: markerUrl || '',
        marker_path: markerPath || '',
        created_at: new Date().toISOString()
      };

      this.saveAssetLocally(asset);

      console.log('🎉 Asset subido completamente');

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        markerUrl: markerUrl,
        markerPath: markerPath,
        asset: asset
      };
    } catch (error: any) {
      console.error('❌ Error en uploadAsset:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  /**
   * Guardar asset en localStorage
   */
  private saveAssetLocally(asset: ArAsset) {
    try {
      const assetsKey = `ar_assets_${asset.user_id}`;
      const existingAssets = localStorage.getItem(assetsKey);
      const assets: ArAsset[] = existingAssets ? JSON.parse(existingAssets) : [];
      
      // Agregar al inicio de la lista
      assets.unshift(asset);
      
      // Limitar a 50 assets para no sobrecargar localStorage
      if (assets.length > 50) {
        assets.splice(50);
      }
      
      localStorage.setItem(assetsKey, JSON.stringify(assets));
      
      console.log('💾 Asset guardado localmente');
    } catch (error) {
      console.error('⚠️ Error guardando en localStorage:', error);
    }
  }

  /**
   * Obtener assets del usuario
   */
  async getUserAssets(): Promise<any> {
    try {
      const user = this.authService.currentUserValue;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      console.log('📂 Cargando assets del usuario...');

      const assetsKey = `ar_assets_${user.uid}`;
      const existingAssets = localStorage.getItem(assetsKey);
      
      if (!existingAssets) {
        console.log('ℹ️ No hay assets guardados');
        return { success: true, assets: [] };
      }

      const assets: ArAsset[] = JSON.parse(existingAssets);
      console.log(`✅ ${assets.length} assets cargados`);
      
      return { success: true, assets };
    } catch (error: any) {
      console.error('❌ Error en getUserAssets:', error);
      return { success: true, assets: [] };
    }
  }

  /**
   * Eliminar asset y su marcador
   */
  async deleteAsset(id: string, filePath: string, markerPath?: string): Promise<any> {
    try {
      const user = this.authService.currentUserValue;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      console.log('🗑️ Eliminando asset:', id);

      // Eliminar archivo del storage
      const { error: storageError } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (storageError) {
        console.error('⚠️ Error al eliminar archivo:', storageError);
      }

      // Eliminar marcador si existe
      if (markerPath) {
        console.log('🗑️ Eliminando marcador...');
        const { error: markerError } = await this.supabase.storage
          .from(this.bucketName)
          .remove([markerPath]);

        if (markerError) {
          console.error('⚠️ Error al eliminar marcador:', markerError);
        } else {
          console.log('✅ Marcador eliminado');
        }
      }

      // Eliminar de localStorage
      const assetsKey = `ar_assets_${user.uid}`;
      const existingAssets = localStorage.getItem(assetsKey);
      
      if (existingAssets) {
        const assets: ArAsset[] = JSON.parse(existingAssets);
        const filteredAssets = assets.filter(asset => asset.id !== id);
        localStorage.setItem(assetsKey, JSON.stringify(filteredAssets));
        console.log('💾 Asset eliminado de localStorage');
      }

      console.log('✅ Asset eliminado completamente');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en deleteAsset:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener URL pública de un archivo
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Verificar conexión con Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      if (error) {
        console.error('❌ Error de conexión con Supabase:', error);
        return false;
      }

      console.log('✅ Conexión con Supabase Storage OK');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  }

  /**
   * Limpiar assets locales (útil para desarrollo)
   */
  clearLocalAssets() {
    const user = this.authService.currentUserValue;
    if (user) {
      const assetsKey = `ar_assets_${user.uid}`;
      localStorage.removeItem(assetsKey);
      console.log('🗑️ Assets locales eliminados');
    }
  }

  /**
   * Regenerar marcador para un asset existente
   */
  async regenerateMarker(asset: ArAsset, imageFile: File): Promise<any> {
    try {
      console.log('🔄 Regenerando marcador para:', asset.name);

      // Eliminar marcador anterior si existe
      if (asset.marker_path) {
        await this.supabase.storage
          .from(this.bucketName)
          .remove([asset.marker_path]);
      }

      // Generar nuevo marcador
      const markerBlob = await this.markerGenerator.generateMarkerFromImage(imageFile);
      const markerFileName = `marker_${Date.now()}.png`;
      const markerFilePath = `${asset.user_id}/markers/${markerFileName}`;

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(markerFilePath, markerBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: markerUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(markerFilePath);

      // Actualizar asset localmente
      asset.marker_url = markerUrlData.publicUrl;
      asset.marker_path = markerFilePath;
      asset.marker_type = 'custom';

      this.updateAssetLocally(asset);

      console.log('✅ Marcador regenerado');

      return {
        success: true,
        markerUrl: markerUrlData.publicUrl
      };
    } catch (error: any) {
      console.error('❌ Error regenerando marcador:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar asset en localStorage
   */
  private updateAssetLocally(updatedAsset: ArAsset) {
    try {
      const assetsKey = `ar_assets_${updatedAsset.user_id}`;
      const existingAssets = localStorage.getItem(assetsKey);
      
      if (existingAssets) {
        const assets: ArAsset[] = JSON.parse(existingAssets);
        const index = assets.findIndex(a => a.id === updatedAsset.id);
        
        if (index !== -1) {
          assets[index] = updatedAsset;
          localStorage.setItem(assetsKey, JSON.stringify(assets));
          console.log('💾 Asset actualizado localmente');
        }
      }
    } catch (error) {
      console.error('⚠️ Error actualizando en localStorage:', error);
    }
  }
}