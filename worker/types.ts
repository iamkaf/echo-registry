// Core dependency version
export interface DependencyVersion {
  name: string;
  loader: "forge" | "neoforge" | "fabric" | "universal";
  version: string | null;
  mc_version: string;
  source_url: string;
  download_urls?: {
    forge?: string | null;
    neoforge?: string | null;
    fabric?: string | null;
  };
  loader_versions?: {
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
  version_type: "release" | "snapshot" | "old_beta" | "old_alpha";
  release_time: string;
}

// Versioned project compatibility response
export interface VersionedProjectCompatibility {
  [projectName: string]: {
    [mcVersion: string]: {
      [loader: string]: string | null;
    };
  };
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  cached_at?: string;
  timestamp: string;
  success: boolean;
}

// Health check response
export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  cache_status: "connected" | "disconnected" | "error";
  external_apis: Record<string, "ok" | "error">;
  success: boolean;
}

// Env bindings for Cloudflare Worker
export interface Env {
  CACHE: KVNamespace;
  CRON_SECRET?: string;
  CACHE_TTL_DEPENDENCIES?: string;
  CACHE_TTL_MINECRAFT?: string;
}
