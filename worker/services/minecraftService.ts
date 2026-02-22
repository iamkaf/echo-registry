import { MinecraftVersion } from '../types';
import { API_URLS } from '../utils/constants';
import { CacheService } from './cacheService';
import { fetchWithTimeout } from '../utils/httpClient';

export class MinecraftService {
    private cacheService: CacheService;

    constructor(kv: KVNamespace) {
        this.cacheService = new CacheService(kv);
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

            const manifest = await response.json() as {
                versions: Array<{ id: string; type: string; releaseTime: string }>;
            };
            const versions: MinecraftVersion[] = manifest.versions.map(
                (v) => ({
                    id: v.id,
                    version_type: v.type as MinecraftVersion['version_type'],
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
}
