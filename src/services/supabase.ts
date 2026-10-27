import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or custom user-specified configuration
const ENV_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

interface StoredSupabaseConfig {
  url: string;
  anonKey: string;
}

function getStoredConfig(): StoredSupabaseConfig | null {
  try {
    const raw = localStorage.getItem('lananh_supabase_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read stored Supabase config:', e);
  }
  return null;
}

let clientInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export function isSupabaseConfigured(): boolean {
  const stored = getStoredConfig();
  const url = stored?.url || ENV_SUPABASE_URL;
  const key = stored?.anonKey || ENV_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http'));
}

export function getActiveSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean } {
  const stored = getStoredConfig();
  if (stored?.url && stored?.anonKey) {
    return { url: stored.url, anonKey: stored.anonKey, isCustom: true };
  }
  return { url: ENV_SUPABASE_URL, anonKey: ENV_SUPABASE_ANON_KEY, isCustom: false };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem('lananh_supabase_config');
      clientInstance = null;
      return true;
    }
    localStorage.setItem(
      'lananh_supabase_config',
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
    clientInstance = null; // force re-creation
    return true;
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getActiveSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}::${config.anonKey}`;
  if (clientInstance && currentConfigKey === key) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigKey = key;
    return clientInstance;
  } catch (err) {
    console.error('Failed to create Supabase client instance:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Chưa cấu hình Supabase URL và Public Anon Key.',
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a light ping by querying stories table with limit 1
    const { error } = await client.from('stories').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error && error.code !== 'PGRST116' && !error.message.includes('permission denied')) {
      // If table doesn't exist yet, warn about migrations
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Kết nối Supabase thành công nhưng các bảng chưa được tạo. Hãy chạy migration SQL trong file docs/DATABASE_ARCHITECTURE.md.',
          latencyMs,
        };
      }
      return {
        success: false,
        message: `Lỗi kết nối Supabase: ${error.message} (Code: ${error.code})`,
        latencyMs,
      };
    }

    return {
      success: true,
      message: 'Kết nối Supabase Cloud Database và Auth thành công!',
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Không thể kết nối đến máy chủ Supabase.',
    };
  }
}
