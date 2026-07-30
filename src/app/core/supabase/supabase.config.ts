import { environment } from '../../../environments/environment';

/**
 * Contains the environment-specific connection values for the Supabase client.
 */
export const supabaseConfig = {
  /** Base URL of the configured Supabase project. */
  url: environment.supabaseUrl,

  /** Anonymous API key used by the browser client. */
  anonKey: environment.supabaseAnonKey,
} as const;