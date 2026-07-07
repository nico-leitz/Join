import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabase.config';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client: SupabaseClient = createClient(
    supabaseConfig.url, 
    supabaseConfig.anonKey
  );
}