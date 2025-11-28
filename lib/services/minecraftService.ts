import { MinecraftVersion } from '@/types/dependency';
import { API_URLS } from '../utils/constants';
import { CacheService } from './cacheService';
import { fetchWithTimeout } from '../utils/httpClient';

export class MinecraftService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  // Fetch all Minecraft versions from official manifest
  async fetchMinecraftVersions(): Promise<MinecraftVersion[]> {
    // Check cache first
    const cached = await this.cacheService.getCachedMinecraftVersions();
    if (cached && cached.length > 0) return cached;

    try {
      const response = await fetchWithTimeout(API_URLS.MINECRAFT_MANIFEST);
      if (!response.ok) {
        throw new Error('Failed to fetch Minecraft version manifest');
      }

      const manifest = await response.json();
      const versions: MinecraftVersion[] = manifest.versions.map(
        (v: { id: string; type: string; releaseTime: string }) => ({
          id: v.id,
          version_type: v.type,
          release_time: v.releaseTime,
        }),
      );

      // Cache the result
      await this.cacheService.cacheMinecraftVersions(versions);

      return versions;
    } catch (error) {
      console.error('Failed to fetch Minecraft versions:', error);
      throw error;
    }
  }

  // Get latest release version
  async getLatestRelease(): Promise<string | null> {
    try {
      const versions = await this.fetchMinecraftVersions();
      const releases = versions.filter((v) => v.version_type === 'release');

      if (releases.length === 0) return null;

      // Sort by release time and get the latest
      return releases.sort(
        (a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime(),
      )[0].id;
    } catch (error) {
      console.error('Failed to get latest release:', error);
      return null;
    }
  }

  // Get latest snapshot version
  async getLatestSnapshot(): Promise<string | null> {
    try {
      const versions = await this.fetchMinecraftVersions();
      const snapshots = versions.filter((v) => v.version_type === 'snapshot');

      if (snapshots.length === 0) return null;

      // Sort by release time and get the latest
      return snapshots.sort(
        (a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime(),
      )[0].id;
    } catch (error) {
      console.error('Failed to get latest snapshot:', error);
      return null;
    }
  }

  // Get versions by type
  async getVersionsByType(
    type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha',
  ): Promise<MinecraftVersion[]> {
    try {
      const versions = await this.fetchMinecraftVersions();
      return versions.filter((v) => v.version_type === type);
    } catch (error) {
      console.error(`Failed to get ${type} versions:`, error);
      return [];
    }
  }

  // Search for versions matching a pattern
  async searchVersions(query: string): Promise<MinecraftVersion[]> {
    try {
      const versions = await this.fetchMinecraftVersions();
      const lowerQuery = query.toLowerCase();

      return versions.filter((v) => v.id.toLowerCase().includes(lowerQuery));
    } catch (error) {
      console.error(`Failed to search versions:`, error);
      return [];
    }
  }

  // Get popular/recent versions (last 10 releases)
  async getRecentReleases(count: number = 10): Promise<MinecraftVersion[]> {
    try {
      const versions = await this.fetchMinecraftVersions();
      const releases = versions
        .filter((v) => v.version_type === 'release')
        .sort((a, b) => new Date(b.release_time).getTime() - new Date(a.release_time).getTime())
        .slice(0, count);

      return releases;
    } catch (error) {
      console.error('Failed to get recent releases:', error);
      return [];
    }
  }

  // Check if a version exists
  async versionExists(version: string): Promise<boolean> {
    try {
      const versions = await this.fetchMinecraftVersions();
      return versions.some((v) => v.id === version);
    } catch (error) {
      console.error(`Failed to check if version ${version} exists:`, error);
      return false;
    }
  }

  // Get version information
  async getVersionInfo(version: string): Promise<MinecraftVersion | null> {
    try {
      const versions = await this.fetchMinecraftVersions();
      return versions.find((v) => v.id === version) || null;
    } catch (error) {
      console.error(`Failed to get version info for ${version}:`, error);
      return null;
    }
  }
}
