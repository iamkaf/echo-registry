import { DependencyVersion } from '@/types/dependency';
import { API_URLS, LOADER_MAPPING, HTTP_TIMEOUT, USER_AGENT } from '../utils/constants';
import {
  isDependencyCompatible,
  extractMinorVersion,
  generateParchmentFallbackVersions,
  sortVersionsSemantically,
} from '../utils/versionUtils';
import { parseMavenMetadata, extractVersionTags, findTagContent } from '../utils/xmlParser';
import { CacheService } from './cacheService';

export class DependencyService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  // Main method to fetch any dependency
  async fetchDependency(name: string, mcVersion: string): Promise<DependencyVersion> {
    // Check cache first
    const cached = await this.cacheService.getCachedDependency(name, mcVersion);
    if (cached) return cached;

    // Check compatibility
    if (!isDependencyCompatible(name, mcVersion)) {
      return this.createIncompatibleVersion(name, mcVersion);
    }

    // Fetch based on dependency type
    let result: DependencyVersion;

    try {
      switch (name) {
        case 'forge':
          result = await this.fetchForge(mcVersion);
          break;
        case 'neoforge':
          result = await this.fetchNeoForge(mcVersion);
          break;
        case 'fabric-loader':
          result = await this.fetchFabricLoader(mcVersion);
          break;
        case 'parchment':
          result = await this.fetchParchment(mcVersion);
          break;
        case 'neoform':
          result = await this.fetchNeoForm(mcVersion);
          break;
        case 'moddev-gradle':
          result = await this.fetchModDevGradle(mcVersion);
          break;
        case 'forgegradle':
          result = await this.fetchForgeGradle(mcVersion);
          break;
        default:
          // Assume it's a Modrinth project
          result = await this.fetchModrinthProject(name, mcVersion);
      }

      // Cache the result
      await this.cacheService.cacheDependency(result);
      return result;
    } catch (error) {
      console.error(`Failed to fetch ${name}:`, error);
      const errorVersion = this.createErrorVersion(name, mcVersion, String(error));
      await this.cacheService.cacheDependency(errorVersion);
      return errorVersion;
    }
  }

  // Fetch Forge version using HTML scraping
  private async fetchForge(mcVersion: string): Promise<DependencyVersion> {
    const url = `${API_URLS.FORGE_BASE}/index_${mcVersion}.html`;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Forge page not found for MC version ${mcVersion}`);
    }

    const html = await response.text();

    // Extract version using regex (ported from Rust)
    const recommendedRegex = /Recommended:\s*([0-9.]+)/;
    const latestRegex = /Latest:\s*([0-9.]+)/;

    const recommendedMatch = recommendedRegex.exec(html);
    const latestMatch = latestRegex.exec(html);

    let version: string;
    let notes: string | undefined;

    if (recommendedMatch) {
      version = recommendedMatch[1];
      notes = 'Recommended';
    } else if (latestMatch) {
      version = latestMatch[1];
      notes = 'Latest';
    } else {
      throw new Error('No Forge version found');
    }

    return {
      name: 'forge',
      loader: 'forge',
      version,
      mc_version: mcVersion,
      source_url: url,
      notes,
      fallback_used: false,
    };
  }

  // Fetch NeoForge version using Maven XML parsing
  private async fetchNeoForge(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.NEOFORGE_METADATA;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error('NeoForge metadata not available');
    }

    const xml = await response.text();
    const metadata = parseMavenMetadata(xml);

    const prefix = extractMinorVersion(mcVersion);
    const filteredVersions = metadata.versions.filter((v) => v.startsWith(prefix));

    if (filteredVersions.length === 0) {
      throw new Error('No NeoForge version found');
    }

    // Sort versions semantically
    const sortedVersions = sortVersionsSemantically(filteredVersions);
    const version = sortedVersions[sortedVersions.length - 1];

    return {
      name: 'neoforge',
      loader: 'neoforge',
      version,
      mc_version: mcVersion,
      source_url: url,
      fallback_used: false,
    };
  }

  // Fetch Fabric Loader version using JSON API
  private async fetchFabricLoader(mcVersion: string): Promise<DependencyVersion> {
    const url = `${API_URLS.FABRIC_LOADER}/${mcVersion}`;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`No Fabric loader found for MC version ${mcVersion}`);
    }

    const loaders = await response.json();

    if (!Array.isArray(loaders) || loaders.length === 0) {
      throw new Error('No Fabric loader found');
    }

    // Get all versions and sort semantically
    const versions = loaders.map((l) => l.loader.version);
    const sortedVersions = sortVersionsSemantically(versions);
    const version = sortedVersions[sortedVersions.length - 1];

    return {
      name: 'fabric-loader',
      loader: 'fabric',
      version,
      mc_version: mcVersion,
      source_url: url,
      fallback_used: false,
    };
  }

  // Fetch Modrinth project version using JSON API
  private async fetchModrinthProject(projectSlug: string, mcVersion: string): Promise<DependencyVersion> {
    const versionJson = JSON.stringify([mcVersion]);
    const encodedVersions = encodeURIComponent(versionJson);
    const url = `${API_URLS.MODRINTH_API}/${projectSlug}/version?game_versions=${encodedVersions}`;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`No ${projectSlug} versions found for MC version ${mcVersion}`);
    }

    const versions = await response.json();

    if (!Array.isArray(versions) || versions.length === 0) {
      throw new Error(`No ${projectSlug} versions available`);
    }

    // Get the most recent version by date_published
    const latest = versions.reduce((prev, current) =>
      new Date(current.date_published) > new Date(prev.date_published) ? current : prev,
    );

    console.log(latest.version_number);

    return {
      name: projectSlug,
      loader: LOADER_MAPPING[projectSlug] || 'universal',
      version: latest.version_number,
      mc_version: mcVersion,
      source_url: `https://modrinth.com/mod/${projectSlug}`,
      fallback_used: false,
    };
  }

  // Fetch NeoForm version from Maven metadata
  private async fetchNeoForm(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.NEOFORM_METADATA;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error('Failed to fetch NeoForm maven metadata');
    }

    const xmlContent = await response.text();
    const versionPrefix = `${mcVersion}-`;
    const matchingVersions = extractVersionTags(xmlContent, versionPrefix);

    if (matchingVersions.length === 0) {
      throw new Error(`No NeoForm versions found for MC ${mcVersion}`);
    }

    // Sort and get the latest version
    const sortedVersions = sortVersionsSemantically(matchingVersions);
    const latestVersion = sortedVersions[sortedVersions.length - 1];

    return {
      name: 'neoform',
      loader: 'universal',
      version: latestVersion,
      mc_version: mcVersion,
      source_url: 'https://maven.neoforged.net/releases/net/neoforged/neoform/',
      fallback_used: false,
    };
  }

  // Fetch ForgeGradle version from Maven metadata
  private async fetchForgeGradle(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.FORGEGRADLE_METADATA;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error('Failed to fetch ForgeGradle maven metadata');
    }

    const content = await response.text();
    const metadata = parseMavenMetadata(content);

    if (metadata.versions.length === 0) {
      throw new Error('No versions found in ForgeGradle XML metadata');
    }

    // Remove duplicates and filter to ensure only strings
    const uniqueVersions = [...new Set(metadata.versions)].filter((v) => typeof v === 'string');
    const sortedVersions = sortVersionsSemantically(uniqueVersions);
    const latestVersion = sortedVersions[sortedVersions.length - 1];

    // Check if the <latest> tag contains a different value
    const latestTag = findTagContent(content, 'latest');
    if (latestTag && latestTag.startsWith('2.') && latestVersion.startsWith('6.')) {
      console.warn(`ForgeGradle <latest> tag contains '${latestTag}' but latest version is '${latestVersion}'`);
    }

    return {
      name: 'forgegradle',
      loader: 'forge',
      version: latestVersion,
      mc_version: mcVersion,
      source_url: 'https://maven.minecraftforge.net/net/minecraftforge/gradle/ForgeGradle/',
      notes: 'Latest version',
      fallback_used: false,
    };
  }

  // Fetch ModDev Gradle version from Maven metadata (version-agnostic)
  private async fetchModDevGradle(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.MODDEV_GRADLE_METADATA;

    const response = await this.fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error('Failed to fetch ModDev Gradle maven metadata');
    }

    const xmlContent = await response.text();
    const latestVersion = findTagContent(xmlContent, 'latest');

    if (!latestVersion) {
      throw new Error('Could not find ModDev Gradle latest version');
    }

    return {
      name: 'moddev-gradle',
      loader: 'universal',
      version: latestVersion,
      mc_version: mcVersion,
      source_url: 'https://maven.neoforged.net/releases/net/neoforged/moddev-gradle/',
      notes: 'Version-agnostic Gradle plugin',
      fallback_used: false,
    };
  }

  // Fetch Parchment version with smart fallback logic
  private async fetchParchment(mcVersion: string): Promise<DependencyVersion> {
    const originalVersion = mcVersion;
    const fallbackVersions = generateParchmentFallbackVersions(mcVersion);

    for (const currentVersion of fallbackVersions) {
      const url = API_URLS.PARCHMENT_BASE.replace('{version}', currentVersion);

      try {
        const response = await this.fetchWithTimeout(url);
        if (!response.ok) continue;

        const xml = await response.text();
        const metadata = parseMavenMetadata(xml);

        if (metadata.versions.length === 0) continue;

        // Filter out nightly versions and only use release versions
        const releaseVersions = metadata.versions.filter(
          (v: string) => !v.includes('nightly') && !v.includes('SNAPSHOT'),
        );
        if (releaseVersions.length === 0) continue;

        const sortedVersions = sortVersionsSemantically(releaseVersions);
        const version = sortedVersions[sortedVersions.length - 1];
        const fallbackUsed = currentVersion !== originalVersion;

        return {
          name: 'parchment',
          loader: 'universal',
          version,
          mc_version: currentVersion,
          source_url: `https://maven.parchmentmc.org/org/parchmentmc/data/parchment-${currentVersion}/`,
          notes: fallbackUsed ? `Using Parchment mappings for ${currentVersion} (forwards compatible)` : undefined,
          fallback_used: fallbackUsed,
        };
      } catch (error) {
        // Continue to next fallback version
        console.warn(`Failed to fetch Parchment for ${currentVersion}:`, error);
        continue;
      }
    }

    throw new Error('No Parchment version found after trying all fallbacks');
  }

  // Fetch all dependencies for a Minecraft version
  async fetchAllDependencies(mcVersion: string, customProjects: string[] = []): Promise<DependencyVersion[]> {
    const allDependencyNames = [
      'forge',
      'neoforge',
      'fabric-loader',
      'parchment',
      'neoform',
      'moddev-gradle',
      'forgegradle',
      ...customProjects,
    ];

    // Fetch all dependencies in parallel
    const results = await Promise.allSettled(allDependencyNames.map((name) => this.fetchDependency(name, mcVersion)));

    return results
      .filter((result): result is PromiseFulfilledResult<DependencyVersion> => result.status === 'fulfilled')
      .map((result) => result.value);
  }

  // Create error version entry
  private createErrorVersion(name: string, mcVersion: string, error: string): DependencyVersion {
    const loader = LOADER_MAPPING[name] || 'universal';

    // Provide source URLs for known dependencies even when they fail
    const getSourceUrl = (name: string): string => {
      switch (name) {
        case 'forge':
          return 'https://files.minecraftforge.net/net/minecraftforge/forge/';
        case 'neoforge':
          return 'https://maven.neoforged.net/releases/net/neoforged/neoforge/';
        case 'fabric-loader':
          return 'https://meta.fabricmc.net/v2/versions/loader/';
        case 'parchment':
          return 'https://maven.parchmentmc.org/';
        case 'neoform':
          return 'https://maven.neoforged.net/releases/net/neoforged/neoform/';
        case 'forgegradle':
          return 'https://maven.minecraftforge.net/net/minecraftforge/gradle/ForgeGradle/';
        case 'moddev-gradle':
          return 'https://maven.neoforged.net/releases/net/neoforged/moddev-gradle/';
        default:
          // For Modrinth projects, return their Modrinth page
          return `https://modrinth.com/mod/${name}`;
      }
    };

    return {
      name,
      loader,
      version: null,
      mc_version: mcVersion,
      source_url: getSourceUrl(name),
      notes: `Failed to fetch: ${error}`,
      fallback_used: false,
    };
  }

  // Create incompatible version entry
  private createIncompatibleVersion(name: string, mcVersion: string): DependencyVersion {
    const loader = LOADER_MAPPING[name] || 'universal';
    const minVersion = this.getMinimumVersion(name);

    // Provide source URLs for known dependencies even when incompatible
    const getSourceUrl = (name: string): string => {
      switch (name) {
        case 'forge':
          return 'https://files.minecraftforge.net/net/minecraftforge/forge/';
        case 'neoforge':
          return 'https://maven.neoforged.net/releases/net/neoforged/neoforge/';
        case 'fabric-loader':
          return 'https://meta.fabricmc.net/v2/versions/loader/';
        case 'parchment':
          return 'https://maven.parchmentmc.org/';
        case 'neoform':
          return 'https://maven.neoforged.net/releases/net/neoforged/neoform/';
        case 'forgegradle':
          return 'https://maven.minecraftforge.net/net/minecraftforge/gradle/ForgeGradle/';
        case 'moddev-gradle':
          return 'https://maven.neoforged.net/releases/net/neoforged/moddev-gradle/';
        default:
          // For Modrinth projects, return their Modrinth page
          return `https://modrinth.com/mod/${name}`;
      }
    };

    return {
      name,
      loader,
      version: 'N/A',
      mc_version: mcVersion,
      source_url: getSourceUrl(name),
      notes: `Not available for Minecraft ${mcVersion}. Requires ${minVersion} or later.`,
      fallback_used: false,
    };
  }

  // Get minimum version for dependency (simplified version)
  private getMinimumVersion(name: string): string {
    const minVersions: Record<string, string> = {
      neoforge: '1.20.2',
      'fabric-loader': '1.13.0',
      'fabric-api': '1.13.0',
      'architectury-api': '1.16.5',
      modmenu: '1.14.4',
      rei: '1.13.0',
      amber: '1.20.1',
      neoform: '1.20.2',
      'moddev-gradle': '1.20.2',
      forgegradle: '1.2.5',
      forge: '1.2.5',
      parchment: '1.16.0',
    };

    return minVersions[name] || 'Unknown';
  }

  // Helper method for HTTP requests with timeout
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': process.env.USER_AGENT || USER_AGENT,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
