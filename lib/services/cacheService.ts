import { getSupabaseClient } from '../supabase/client';
import { DependencyVersion, MinecraftVersion } from '@/types/dependency';
import { CACHE_TTL_DEPENDENCIES, CACHE_TTL_MINECRAFT } from '../utils/constants';

export class CacheService {
  // Get cached dependency version
  async getCachedDependency(name: string, mcVersion: string): Promise<DependencyVersion | null> {
    const supabase = getSupabaseClient(true);
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('dependency_cache')
        .select('*')
        .eq('name', name)
        .eq('mc_version', mcVersion)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      return {
        name: data.name,
        loader: data.loader as DependencyVersion['loader'],
        version: data.version,
        mc_version: data.mc_version,
        source_url: data.source_url,
        download_urls: data.download_urls || undefined,
        notes: data.notes,
        fallback_used: data.fallback_used,
        cached_at: data.created_at,
      };
    } catch (error) {
      console.error('Cache fetch error:', error);
      return null;
    }
  }

  // Cache dependency version
  async cacheDependency(version: DependencyVersion): Promise<void> {
    const supabase = getSupabaseClient(true);
    if (!supabase) return;

    try {
      const expiresAt = new Date(Date.now() + CACHE_TTL_DEPENDENCIES);

      await supabase.from('dependency_cache').upsert({
        name: version.name,
        mc_version: version.mc_version,
        version: version.version,
        loader: version.loader,
        source_url: version.source_url,
        download_urls: version.download_urls || null,
        notes: version.notes,
        fallback_used: version.fallback_used || false,
        expires_at: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Get cached Minecraft versions
  async getCachedMinecraftVersions(): Promise<MinecraftVersion[] | null> {
    const supabase = getSupabaseClient(true);
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('minecraft_versions')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('release_time', { ascending: false });

      if (error || !data) return null;

      return data.map((row) => ({
        id: row.id,
        version_type: row.version_type,
        release_time: row.release_time,
      }));
    } catch (error) {
      console.error('Minecraft versions cache fetch error:', error);
      return null;
    }
  }

  // Cache Minecraft versions
  async cacheMinecraftVersions(versions: MinecraftVersion[]): Promise<void> {
    const supabase = getSupabaseClient(true);
    if (!supabase) return;

    try {
      const expiresAt = new Date(Date.now() + CACHE_TTL_MINECRAFT);

      // Clear existing cache first
      await supabase.from('minecraft_versions').delete().lt('expires_at', new Date().toISOString());

      // Insert new versions
      const rows = versions.map((version) => ({
        id: version.id,
        version_type: version.version_type,
        release_time: version.release_time,
        expires_at: expiresAt.toISOString(),
      }));

      await supabase.from('minecraft_versions').insert(rows);
    } catch (error) {
      console.error('Minecraft versions cache write error:', error);
    }
  }

  // Clean up expired cache entries
  async cleanupExpired(): Promise<void> {
    const supabase = getSupabaseClient(true);
    if (!supabase) return;

    try {
      const now = new Date().toISOString();

      await supabase.from('dependency_cache').delete().lt('expires_at', now);

      await supabase.from('minecraft_versions').delete().lt('expires_at', now);

      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    dependency_cache_count: number;
    minecraft_versions_count: number;
    expired_entries: number;
  }> {
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      return {
        dependency_cache_count: 0,
        minecraft_versions_count: 0,
        expired_entries: 0,
      };
    }

    try {
      const [{ count: dependencyCount }, { count: minecraftCount }, { count: expiredCount }] =
        await Promise.all([
          supabase
            .from('dependency_cache')
            .select('*', { count: 'exact', head: true })
            .gt('expires_at', new Date().toISOString()),
          supabase
            .from('minecraft_versions')
            .select('*', { count: 'exact', head: true })
            .gt('expires_at', new Date().toISOString()),
          supabase
            .from('dependency_cache')
            .select('*', { count: 'exact', head: true })
            .lt('expires_at', new Date().toISOString()),
        ]);

      return {
        dependency_cache_count: dependencyCount || 0,
        minecraft_versions_count: minecraftCount || 0,
        expired_entries: expiredCount || 0,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        dependency_cache_count: 0,
        minecraft_versions_count: 0,
        expired_entries: 0,
      };
    }
  }

  // Check cache health
  async checkHealth(): Promise<'connected' | 'disconnected' | 'error'> {
    const supabase = getSupabaseClient(true);
    if (!supabase) return 'disconnected';

    try {
      const { error } = await supabase.from('dependency_cache').select('count').limit(1);

      return error ? 'error' : 'connected';
    } catch (error) {
      console.error('Cache health check error:', error);
      return 'disconnected';
    }
  }
}
