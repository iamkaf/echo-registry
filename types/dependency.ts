// Core dependency version
export interface DependencyVersion {
  name: string;
  loader: 'forge' | 'neoforge' | 'fabric' | 'universal';
  version: string | null;
  mc_version: string;
  source_url: string;
  download_urls?: {
    forge?: string | null;
    neoforge?: string | null;
    fabric?: string | null;
  };
  coordinates?: string | null;
  notes?: string;
  fallback_used?: boolean;
  cached_at?: string;
}

// Minecraft version
export interface MinecraftVersion {
  id: string;
  version_type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  release_time: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  cached_at?: string;
  timestamp: string;
}

// Health check response
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  cache_status: 'connected' | 'disconnected' | 'error';
  external_apis: Record<string, 'ok' | 'error'>;
}

// Cache database models (Supabase)
export interface DependencyCacheRow {
  id: number;
  name: string;
  mc_version: string;
  version: string;
  loader: string;
  source_url: string;
  download_urls?: Record<string, string | null> | null;
  coordinates?: string | null;
  notes?: string;
  fallback_used: boolean;
  expires_at: string;
  created_at: string;
}

export interface MinecraftVersionRow {
  id: string;
  version_type: string;
  release_time: string;
  expires_at: string;
  created_at: string;
}

export interface ApiUsageRow {
  id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time: number;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}
