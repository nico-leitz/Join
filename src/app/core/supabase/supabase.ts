import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabase.config';

/**
 * Provides the configured Supabase client to application services.
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  /** Shared Supabase client used for authentication and database requests. */
  public client: SupabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);
}