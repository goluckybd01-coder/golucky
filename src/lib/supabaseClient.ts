/**
 * Supabase Singleton Client
 * 
 * IMPORTANT: This re-exports the existing Supabase client from integrations.
 * Never create new Supabase client instances in hooks or components.
 * Always import from this file or @/integrations/supabase/client.
 */

import { supabase } from '@/integrations/supabase/client';

// Re-export the singleton instance
export { supabase };

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
};

// Debug helper
export const getSupabaseDebugInfo = () => ({
  hasUrl: Boolean(import.meta.env.VITE_SUPABASE_URL),
  hasKey: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  urlPrefix: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) || 'NOT SET',
});
