import { DependencyVersion, MinecraftVersion } from "../types";
import { CACHE_TTL_DEPENDENCIES, CACHE_TTL_MINECRAFT } from "../utils/constants";

export class CacheService {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  // Get cached dependency version
  async getCachedDependency(name: string, mcVersion: string): Promise<DependencyVersion | null> {
    try {
      const key = `dep:${name}:${mcVersion}`;
      return await this.kv.get<DependencyVersion>(key, "json");
    } catch (error) {
      console.error("Cache fetch error:", error);
      return null;
    }
  }

  // Cache dependency version (auto-expires via KV TTL)
  async cacheDependency(version: DependencyVersion): Promise<void> {
    try {
      const key = `dep:${version.name}:${version.mc_version}`;
      const ttl = CACHE_TTL_DEPENDENCIES / 1000; // KV uses seconds
      await this.kv.put(key, JSON.stringify(version), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }

  // Get cached Minecraft versions
  async getCachedMinecraftVersions(): Promise<MinecraftVersion[] | null> {
    try {
      return await this.kv.get<MinecraftVersion[]>("minecraft-versions", "json");
    } catch (error) {
      console.error("Minecraft versions cache fetch error:", error);
      return null;
    }
  }

  // Cache Minecraft versions (auto-expires via KV TTL)
  async cacheMinecraftVersions(versions: MinecraftVersion[]): Promise<void> {
    try {
      const ttl = CACHE_TTL_MINECRAFT / 1000; // KV uses seconds
      await this.kv.put("minecraft-versions", JSON.stringify(versions), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error("Minecraft versions cache write error:", error);
    }
  }

  // Check cache health
  async checkHealth(): Promise<"connected" | "disconnected" | "error"> {
    try {
      await this.kv.get("health-check");
      return "connected";
    } catch (error) {
      console.error("Cache health check error:", error);
      return "error";
    }
  }
}
