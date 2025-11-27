// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth';

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
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private bucketName = 'RealidadA';

  constructor(private authService: AuthService) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase inicializado correctamente');
  }

  // Subir archivo a Supabase Storage
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

      // Obtener URL pública
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('✅ Archivo subido:', urlData.publicUrl);

      // Save metadata to database
      const assetData = {
        user_id: user.uid,
        name: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        marker_type: 'hiro',
        created_at: new Date().toISOString()
      };

      try {
        const { data: insertData, error: insertError } = await this.supabase
          .from('ar_assets')
          .insert([assetData])
          .select();

        if (insertError) {
          console.warn('⚠️ Warning saving metadata:', insertError);
          // Continue even if DB save fails
        }
      } catch (dbError) {
        console.warn('⚠️ Warning saving metadata:', dbError);
        // Continue even if DB save fails
      }

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error: any) {
      console.error('❌ Error en uploadAsset:', error);
      return { success: false, error: error.message };
    }
  }

  // Listar assets del usuario
  async getUserAssets(): Promise<any> {
    try {
      const user = this.authService.currentUserValue;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📂 Fetching user assets:', user.uid);

      // Convertir el uid de Firebase a un UUID válido si es necesario
      const userId = user.uid;

      const { data, error } = await this.supabase
        .from('ar_assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching assets:', error);
        // Si hay error con UUID, devolver array vacío en lugar de error
        if (error.message?.includes('uuid')) {
          console.warn('⚠️ UUID format issue, returning empty assets');
          return { success: true, assets: [] };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ Assets fetched:', data?.length || 0);
      return { success: true, assets: data || [] };
    } catch (error: any) {
      console.error('❌ Error in getUserAssets:', error);
      return { success: true, assets: [] };
    }
  }

  // Eliminar asset
  async deleteAsset(id: string, filePath: string): Promise<any> {
    try {
      console.log('🗑️ Eliminando asset:', id);

      // Eliminar archivo del storage
      const { error: storageError } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (storageError) {
        console.error('⚠️ Error al eliminar archivo:', storageError);
      }

      // Eliminar de la base de datos
      const { error: dbError } = await this.supabase
        .from('ar_assets')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('❌ Error al eliminar de DB:', dbError);
        return { success: false, error: dbError.message };
      }

      console.log('✅ Asset eliminado correctamente');
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
      const { data, error } = await this.supabase
        .from('ar_assets')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Error de conexión:', error);
        return false;
      }

      console.log('✅ Conexión a Supabase OK');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  }
}