// src/app/services/supabase.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth';
import { MarkerGeneratorService } from './marker-generator';
// Credenciales de Supabase
const supabaseUrl = 'https://jghckwjbnbeeanahgyvr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaGNrd2pibmJlZWFuYWhneXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjE1OTIsImV4cCI6MjA3OTY5NzU5Mn0._HHlAYvxHh8kWQfR6dyBUvOpkH9s7ag65DCnGJ0uKnQ';

export interface ArAsset {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_url: string;
  marker_type: string;
  marker_url?: string; // URL del marcador generado
  marker_path?: string; // Path del marcador en storage
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

  // Subir archivo a Supabase Storage con generación de marcador
  async uploadAsset(file: File): Promise<any> {
    try {
      const user = this.authService.currentUserValue;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}_${Date.now()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      console.log('📤 Subiendo archivo:', filePath);

      // 1. Subir imagen original
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Error al subir archivo:', error);
        return { success: false, error: error.message };
      }

      // 2. Obtener URL pública de la imagen
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('✅ Archivo subido:', urlData.publicUrl);

      // 3. Generar marcador personalizado
      console.log('🎯 Generando marcador personalizado...');
      let markerUrl = '';
      let markerPath = '';

      try {
        const markerBlob = await this.markerGenerator.generateMarkerFromImage(file);
        const markerFileName = `marker_${fileName}`;
        const markerFilePath = `${user.uid}/markers/${markerFileName}`;

        // Subir marcador generado
        const { error: markerError } = await this.supabase.storage
          .from(this.bucketName)
          .upload(markerFilePath, markerBlob, {
            cacheControl: '3600',
            upsert: false
          });

        if (markerError) {
          console.warn('⚠️ No se pudo subir el marcador:', markerError);
        } else {
          const { data: markerUrlData } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(markerFilePath);
          
          markerUrl = markerUrlData.publicUrl;
          markerPath = markerFilePath;
          console.log('✅ Marcador generado:', markerUrl);
        }
      } catch (markerError) {
        console.warn('⚠️ Error generando marcador:', markerError);
      }

      // 4. Guardar metadata usando localStorage
      const asset: ArAsset = {
        id: `${user.uid}_${Date.now()}`,
        user_id: user.uid,
        name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        marker_type: markerUrl ? 'custom' : 'hiro',
        marker_url: markerUrl,
        marker_path: markerPath,
        created_at: new Date().toISOString()
      };

      this.saveAssetLocally(asset);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        markerUrl: markerUrl,
        asset: asset
      };
    } catch (error: any) {
      console.error('❌ Error en uploadAsset:', error);
      return { success: false, error: error.message };
    }
  }

  // Guardar asset en localStorage
  private saveAssetLocally(asset: ArAsset) {
    try {
      const assetsKey = `ar_assets_${asset.user_id}`;
      const existingAssets = localStorage.getItem(assetsKey);
      const assets: ArAsset[] = existingAssets ? JSON.parse(existingAssets) : [];
      
      assets.unshift(asset); // Agregar al inicio
      localStorage.setItem(assetsKey, JSON.stringify(assets));
      
      console.log('✅ Asset guardado localmente con marcador');
    } catch (error) {
      console.error('⚠️ Error guardando en localStorage:', error);
    }
  }

  // Listar assets del usuario desde localStorage
  async getUserAssets(): Promise<any> {
    try {
      const user = this.authService.currentUserValue;
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      console.log('📂 Cargando assets del usuario:', user.uid);

      const assetsKey = `ar_assets_${user.uid}`;
      const existingAssets = localStorage.getItem(assetsKey);
      
      if (!existingAssets) {
        console.log('No hay assets guardados');
        return { success: true, assets: [] };
      }

      const assets: ArAsset[] = JSON.parse(existingAssets);
      console.log('✅ Assets cargados:', assets.length);
      
      return { success: true, assets };
    } catch (error: any) {
      console.error('❌ Error en getUserAssets:', error);
      return { success: true, assets: [] };
    }
  }

  // Eliminar asset
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
        const { error: markerError } = await this.supabase.storage
          .from(this.bucketName)
          .remove([markerPath]);

        if (markerError) {
          console.error('⚠️ Error al eliminar marcador:', markerError);
        }
      }

      // Eliminar de localStorage
      const assetsKey = `ar_assets_${user.uid}`;
      const existingAssets = localStorage.getItem(assetsKey);
      
      if (existingAssets) {
        const assets: ArAsset[] = JSON.parse(existingAssets);
        const filteredAssets = assets.filter(asset => asset.id !== id);
        localStorage.setItem(assetsKey, JSON.stringify(filteredAssets));
      }

      console.log('✅ Asset y marcador eliminados correctamente');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en deleteAsset:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener URL pública de un archivo
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // Verificar conexión
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', { limit: 1 });

      if (error) {
        console.error('❌ Error de conexión:', error);
        return false;
      }

      console.log('✅ Conexión a Supabase Storage OK');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  }

  // Limpiar assets locales (útil para testing)
  clearLocalAssets() {
    const user = this.authService.currentUserValue;
    if (user) {
      const assetsKey = `ar_assets_${user.uid}`;
      localStorage.removeItem(assetsKey);
      console.log('🗑️ Assets locales eliminados');
    }
  }
}