import { MinecraftVersion } from "../types";
import { API_URLS } from "../utils/constants";
import { fetchWithTimeout } from "../utils/httpClient";

export class MinecraftService {
  // Fetch all Minecraft versions from official manifest
  async fetchMinecraftVersions(): Promise<MinecraftVersion[]> {
    try {
      const response = await fetchWithTimeout(API_URLS.MINECRAFT_MANIFEST);
      if (!response.ok) {
        throw new Error("Failed to fetch Minecraft version manifest");
      }

      const manifest = (await response.json()) as {
        versions: Array<{ id: string; type: string; releaseTime: string }>;
      };
      const versions: MinecraftVersion[] = manifest.versions.map((v) => ({
        id: v.id,
        version_type: v.type as MinecraftVersion["version_type"],
      }));

      return versions;
    } catch (error) {
      console.error("Failed to fetch Minecraft versions:", error);
      throw error;
    }
  }
}
