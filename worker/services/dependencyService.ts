import { DependencyVersion, VersionedProjectCompatibility } from "../types";
import { API_URLS, LOADER_MAPPING, BUILT_IN_DEPENDENCIES } from "../utils/constants";
import {
  isDependencyCompatible,
  extractMinorVersion,
  matchesVersionPrefix,
  generateParchmentFallbackVersions,
  sortVersionsSemantically,
} from "../utils/versionUtils";
import { parseMavenMetadata, extractVersionTags, findTagContent } from "../utils/xmlParser";
import { CacheService } from "./cacheService";
import { fetchWithTimeout } from "../utils/httpClient";

// Icon URLs for built-in (non-Modrinth) dependencies
const BUILT_IN_ICON_URLS: Record<string, string> = {
  forge: "/icons/forge.svg",
  neoforge: "/icons/neoforge.svg",
  "fabric-loader": "/icons/fabric.svg",
  parchment: "/icons/parchment.svg",
  neoform: "/icons/neoforge.svg",
  forgegradle: "/icons/gradle.svg",
  "moddev-gradle": "/icons/gradle.svg",
  loom: "/icons/gradle.svg",
};

// Types for Modrinth API responses
interface ModrinthFile {
  hashes: {
    sha1: string;
    sha512: string;
  };
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type: string | null;
}

interface ModrinthVersion {
  version_number: string;
  date_published: string;
  loaders: string[];
  files: ModrinthFile[];
}

interface ModrinthProject {
  id: string;
  slug: string;
  icon_url: string | null;
}

export class DependencyService {
  private cacheService: CacheService;

  constructor(kv: KVNamespace) {
    this.cacheService = new CacheService(kv);
  }

  // Private method to get source URL for a dependency
  private getSourceUrl(name: string): string {
    const sourceUrls: Record<string, string> = {
      forge: "https://files.minecraftforge.net/net/minecraftforge/forge/",
      neoforge: "https://maven.neoforged.net/releases/net/neoforged/neoforge/",
      "fabric-loader": "https://meta.fabricmc.net/v2/versions/loader/",
      parchment: "https://maven.parchmentmc.org/",
      neoform: "https://maven.neoforged.net/releases/net/neoforged/neoform/",
      forgegradle: "https://maven.minecraftforge.net/net/minecraftforge/gradle/ForgeGradle/",
      "moddev-gradle": "https://maven.neoforged.net/releases/net/neoforged/moddev-gradle/",
      loom: "https://maven.fabricmc.net/net/fabricmc/fabric-loom/",
    };
    return sourceUrls[name] || `https://modrinth.com/mod/${name}`;
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
        case "forge":
          result = await this.fetchForge(mcVersion);
          break;
        case "neoforge":
          result = await this.fetchNeoForge(mcVersion);
          break;
        case "fabric-loader":
          result = await this.fetchFabricLoader(mcVersion);
          break;
        case "parchment":
          result = await this.fetchParchment(mcVersion);
          break;
        case "neoform":
          result = await this.fetchNeoForm(mcVersion);
          break;
        case "moddev-gradle":
          result = await this.fetchModDevGradle(mcVersion);
          break;
        case "forgegradle":
          result = await this.fetchForgeGradle(mcVersion);
          break;
        case "loom":
          result = await this.fetchLoom(mcVersion);
          break;
        default:
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

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Forge page not found for MC version ${mcVersion}`);
    }

    const html = await response.text();

    const recommendedRegex = /Recommended:\s*([0-9.]+)/;
    const latestRegex = /Latest:\s*([0-9.]+)/;

    const recommendedMatch = recommendedRegex.exec(html);
    const latestMatch = latestRegex.exec(html);

    let version: string;
    let notes: string | undefined;

    if (recommendedMatch) {
      version = recommendedMatch[1];
      notes = "Recommended";
    } else if (latestMatch) {
      version = latestMatch[1];
      notes = "Latest";
    } else {
      throw new Error("No Forge version found");
    }

    return {
      name: "forge",
      loader: "forge",
      version,
      mc_version: mcVersion,
      source_url: url,
      icon_url: BUILT_IN_ICON_URLS.forge,
      notes,
      fallback_used: false,
    };
  }

  // Fetch NeoForge version using Maven XML parsing
  private async fetchNeoForge(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.NEOFORGE_METADATA;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error("NeoForge metadata not available");
    }

    const xml = await response.text();
    const metadata = parseMavenMetadata(xml);

    const prefix = extractMinorVersion(mcVersion);
    const filteredVersions = metadata.versions.filter((v) => matchesVersionPrefix(prefix, v));

    if (filteredVersions.length === 0) {
      throw new Error("No NeoForge version found");
    }

    const sortedVersions = sortVersionsSemantically(filteredVersions);
    const version = sortedVersions[sortedVersions.length - 1];

    return {
      name: "neoforge",
      loader: "neoforge",
      version,
      mc_version: mcVersion,
      source_url: url,
      icon_url: BUILT_IN_ICON_URLS.neoforge,
      fallback_used: false,
    };
  }

  // Fetch Fabric Loader version using JSON API
  private async fetchFabricLoader(mcVersion: string): Promise<DependencyVersion> {
    const url = `${API_URLS.FABRIC_LOADER}/${mcVersion}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`No Fabric loader found for MC version ${mcVersion}`);
    }

    const data = (await response.json()) as Array<{ loader: { version: string } }>;

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No Fabric loader data found");
    }

    const loaderEntry = data[0];

    if (!loaderEntry.loader || !loaderEntry.loader.version) {
      throw new Error("Invalid Fabric loader response structure");
    }

    return {
      name: "fabric-loader",
      loader: "fabric",
      version: loaderEntry.loader.version,
      mc_version: mcVersion,
      source_url: url,
      icon_url: BUILT_IN_ICON_URLS["fabric-loader"],
      fallback_used: false,
    };
  }

  // Fetch Modrinth project version using JSON API
  private async fetchModrinthProject(
    projectSlug: string,
    mcVersion: string,
  ): Promise<DependencyVersion> {
    const versionJson = JSON.stringify([mcVersion]);
    const encodedVersions = encodeURIComponent(versionJson);
    const versionsUrl = `${API_URLS.MODRINTH_API}/${projectSlug}/version?game_versions=${encodedVersions}`;
    const projectUrl = `${API_URLS.MODRINTH_API}/${projectSlug}`;

    const [versionsResponse, projectResponse] = await Promise.all([
      fetchWithTimeout(versionsUrl),
      fetchWithTimeout(projectUrl).catch(() => null),
    ]);

    if (!versionsResponse.ok) {
      throw new Error(`No ${projectSlug} versions found for MC version ${mcVersion}`);
    }

    const versions = (await versionsResponse.json()) as ModrinthVersion[];

    if (!Array.isArray(versions) || versions.length === 0) {
      throw new Error(`No ${projectSlug} versions available`);
    }

    const icon_url = projectResponse?.ok
      ? await projectResponse
          .json()
          .then((p: unknown) => (p as ModrinthProject).icon_url ?? null)
          .catch(() => null)
      : null;

    const { downloadUrls, loaderVersions } =
      this.extractLatestDownloadsAndVersionsByLoader(versions);

    const latest = versions.reduce((prev, current) =>
      new Date(current.date_published) > new Date(prev.date_published) ? current : prev,
    );

    const coordinates = latest.version_number
      ? `maven.modrinth:${projectSlug}:${latest.version_number}`
      : null;

    return {
      name: projectSlug,
      loader: LOADER_MAPPING[projectSlug] || "universal",
      version: latest.version_number,
      mc_version: mcVersion,
      source_url: `https://modrinth.com/mod/${projectSlug}`,
      icon_url,
      download_urls: downloadUrls,
      loader_versions: loaderVersions,
      coordinates,
      fallback_used: false,
    };
  }

  // Group versions by their supported loaders
  private groupVersionsByLoader(versions: ModrinthVersion[]): Record<string, ModrinthVersion[]> {
    const loaderVersions: Record<string, ModrinthVersion[]> = {
      forge: [],
      neoforge: [],
      fabric: [],
    };

    versions.forEach((version: ModrinthVersion) => {
      if (!version.loaders || !Array.isArray(version.loaders)) return;

      version.loaders.forEach((loader: string) => {
        if (loader === "forge" || loader === "neoforge" || loader === "fabric") {
          loaderVersions[loader].push(version);
        }
      });
    });

    return loaderVersions;
  }

  // Find the most recent version for a specific loader
  private findLatestVersionForLoader(loaderVersions: ModrinthVersion[]): ModrinthVersion | null {
    if (loaderVersions.length === 0) return null;

    return loaderVersions.reduce((prev: ModrinthVersion, current: ModrinthVersion) =>
      new Date(current.date_published) > new Date(prev.date_published) ? current : prev,
    );
  }

  // Extract the latest download URL and version number for each loader from multiple versions
  private extractLatestDownloadsAndVersionsByLoader(versions: ModrinthVersion[]): {
    downloadUrls: Record<string, string | null>;
    loaderVersions: Record<string, string | null>;
  } {
    const downloadUrls: Record<string, string | null> = {
      forge: null,
      neoforge: null,
      fabric: null,
    };
    const loaderVersionNumbers: Record<string, string | null> = {
      forge: null,
      neoforge: null,
      fabric: null,
    };

    const groupedVersions = this.groupVersionsByLoader(versions);

    (Object.keys(groupedVersions) as Array<keyof typeof groupedVersions>).forEach((loader) => {
      const latestVersion = this.findLatestVersionForLoader(groupedVersions[loader]);
      if (latestVersion) {
        downloadUrls[loader] = this.extractSingleLoaderDownload(latestVersion, loader);
        loaderVersionNumbers[loader] = latestVersion.version_number;
      }
    });

    return { downloadUrls, loaderVersions: loaderVersionNumbers };
  }

  // Extract download URL for a specific loader from a version
  private extractSingleLoaderDownload(
    version: ModrinthVersion,
    targetLoader: string,
  ): string | null {
    if (!version.files || !Array.isArray(version.files)) {
      return null;
    }

    for (const file of version.files) {
      if (!file.filename || !file.url) continue;

      const filename = file.filename.toLowerCase();

      if (
        (targetLoader === "fabric" && filename.includes("fabric")) ||
        (targetLoader === "neoforge" && filename.includes("neoforge")) ||
        (targetLoader === "forge" && filename.includes("forge") && !filename.includes("neoforge"))
      ) {
        return file.url;
      }
    }

    const primaryFile = version.files.find((f: ModrinthFile) => f.primary) || version.files[0];
    return primaryFile ? primaryFile.url : null;
  }

  // Fetch NeoForm version from Maven metadata
  private async fetchNeoForm(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.NEOFORM_METADATA;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error("Failed to fetch NeoForm maven metadata");
    }

    const xmlContent = await response.text();
    const versionPrefix = `${mcVersion}-`;
    const matchingVersions = extractVersionTags(xmlContent, versionPrefix);

    if (matchingVersions.length === 0) {
      throw new Error(`No NeoForm versions found for MC ${mcVersion}`);
    }

    const sortedVersions = sortVersionsSemantically(matchingVersions);
    const latestVersion = sortedVersions[sortedVersions.length - 1];

    return {
      name: "neoform",
      loader: "universal",
      version: latestVersion,
      mc_version: mcVersion,
      source_url: "https://maven.neoforged.net/releases/net/neoforged/neoform/",
      icon_url: BUILT_IN_ICON_URLS.neoform,
      fallback_used: false,
    };
  }

  // Fetch ForgeGradle version from Maven metadata
  private async fetchForgeGradle(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.FORGEGRADLE_METADATA;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error("Failed to fetch ForgeGradle maven metadata");
    }

    const content = await response.text();
    const metadata = parseMavenMetadata(content);

    if (metadata.versions.length === 0) {
      throw new Error("No versions found in ForgeGradle XML metadata");
    }

    const uniqueVersions = [...new Set(metadata.versions)].filter((v) => typeof v === "string");
    const sortedVersions = sortVersionsSemantically(uniqueVersions);
    const latestVersion = sortedVersions[sortedVersions.length - 1];

    const latestTag = findTagContent(content, "latest");
    if (latestTag && latestTag.startsWith("2.") && latestVersion.startsWith("6.")) {
      console.warn(
        `ForgeGradle <latest> tag contains '${latestTag}' but latest version is '${latestVersion}'`,
      );
    }

    return {
      name: "forgegradle",
      loader: "forge",
      version: latestVersion,
      mc_version: mcVersion,
      source_url: "https://maven.minecraftforge.net/net/minecraftforge/gradle/ForgeGradle/",
      icon_url: BUILT_IN_ICON_URLS.forgegradle,
      notes: "Latest version",
      fallback_used: false,
    };
  }

  // Fetch Fabric Loom version from Maven metadata
  private async fetchLoom(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.LOOM_METADATA;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error("Failed to fetch Loom maven metadata");
    }

    const content = await response.text();
    const metadata = parseMavenMetadata(content);

    if (metadata.versions.length === 0) {
      throw new Error("No versions found in Loom XML metadata");
    }

    const snapshotVersions = [...new Set(metadata.versions)].filter(
      (v) => typeof v === "string" && v.includes("SNAPSHOT"),
    );

    if (snapshotVersions.length === 0) {
      throw new Error("No SNAPSHOT versions found in Loom XML metadata");
    }

    const sortedVersions = sortVersionsSemantically(snapshotVersions);
    const latestVersion = sortedVersions[sortedVersions.length - 1];

    return {
      name: "loom",
      loader: "fabric",
      version: latestVersion,
      mc_version: mcVersion,
      source_url: "https://maven.fabricmc.net/net/fabricmc/fabric-loom/",
      icon_url: BUILT_IN_ICON_URLS.loom,
      notes: "Fabric Loom Gradle plugin (SNAPSHOT)",
      fallback_used: false,
    };
  }

  // Fetch ModDev Gradle version from Maven metadata (version-agnostic)
  private async fetchModDevGradle(mcVersion: string): Promise<DependencyVersion> {
    const url = API_URLS.MODDEV_GRADLE_METADATA;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error("Failed to fetch ModDev Gradle maven metadata");
    }

    const xmlContent = await response.text();
    const latestVersion = findTagContent(xmlContent, "latest");

    if (!latestVersion) {
      throw new Error("Could not find ModDev Gradle latest version");
    }

    return {
      name: "moddev-gradle",
      loader: "universal",
      version: latestVersion,
      mc_version: mcVersion,
      source_url: "https://maven.neoforged.net/releases/net/neoforged/moddev-gradle/",
      icon_url: BUILT_IN_ICON_URLS["moddev-gradle"],
      notes: "Version-agnostic Gradle plugin",
      fallback_used: false,
    };
  }

  // Fetch Parchment version with smart fallback logic
  private async fetchParchment(mcVersion: string): Promise<DependencyVersion> {
    const originalVersion = mcVersion;
    const fallbackVersions = generateParchmentFallbackVersions(mcVersion);

    for (const currentVersion of fallbackVersions) {
      const url = API_URLS.PARCHMENT_BASE.replace("{version}", currentVersion);

      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) continue;

        const xml = await response.text();
        const metadata = parseMavenMetadata(xml);

        if (metadata.versions.length === 0) continue;

        const releaseVersions = metadata.versions.filter(
          (v: string) => !v.includes("nightly") && !v.includes("SNAPSHOT"),
        );
        if (releaseVersions.length === 0) continue;

        const sortedVersions = sortVersionsSemantically(releaseVersions);
        const version = sortedVersions[sortedVersions.length - 1];
        const fallbackUsed = currentVersion !== originalVersion;

        return {
          name: "parchment",
          loader: "universal",
          version,
          mc_version: currentVersion,
          source_url: `https://maven.parchmentmc.org/org/parchmentmc/data/parchment-${currentVersion}/`,
          icon_url: BUILT_IN_ICON_URLS.parchment,
          notes: fallbackUsed
            ? `Using Parchment mappings for ${currentVersion} (forwards compatible)`
            : undefined,
          fallback_used: fallbackUsed,
        };
      } catch (error) {
        console.warn(`Failed to fetch Parchment for ${currentVersion}:`, error);
        continue;
      }
    }

    throw new Error("No Parchment version found after trying all fallbacks");
  }

  // Fetch all dependencies for a Minecraft version
  async fetchAllDependencies(
    mcVersion: string,
    customProjects: string[] = [],
  ): Promise<DependencyVersion[]> {
    const allDependencyNames = [
      "forge",
      "neoforge",
      "fabric-loader",
      "parchment",
      "neoform",
      "moddev-gradle",
      "forgegradle",
      "loom",
      ...customProjects,
    ];

    const results = await Promise.allSettled(
      allDependencyNames.map((name) => this.fetchDependency(name, mcVersion)),
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<DependencyVersion> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
  }

  // Validate that query-supplied projects are real Modrinth projects
  async findInvalidModrinthProjects(projects: string[], mcVersion: string): Promise<string[]> {
    const uniqueProjects = [...new Set(projects.map((project) => project.trim()).filter(Boolean))];
    if (uniqueProjects.length === 0) return [];

    const invalidProjects: string[] = [];
    const encodedVersions = encodeURIComponent(JSON.stringify([mcVersion]));

    const validationResults = await Promise.allSettled(
      uniqueProjects.map(async (project) => {
        const url = `${API_URLS.MODRINTH_API}/${encodeURIComponent(project)}/version?game_versions=${encodedVersions}`;
        const response = await fetchWithTimeout(url);

        if (response.status === 404) {
          return project;
        }

        if (!response.ok) {
          throw new Error(
            `Unable to validate project "${project}" with Modrinth (status ${response.status})`,
          );
        }

        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) {
          throw new Error(`Unexpected Modrinth response while validating project "${project}"`);
        }

        return null;
      }),
    );

    validationResults.forEach((result) => {
      if (result.status === "rejected") {
        throw result.reason;
      }
      if (result.value) {
        invalidProjects.push(result.value);
      }
    });

    return invalidProjects;
  }

  // Create error version entry
  private createErrorVersion(name: string, mcVersion: string, error: string): DependencyVersion {
    const loader = LOADER_MAPPING[name] || "universal";

    const isModrinthProject = !BUILT_IN_DEPENDENCIES.includes(
      name as (typeof BUILT_IN_DEPENDENCIES)[number],
    );
    const coordinates = isModrinthProject ? null : undefined;

    return {
      name,
      loader,
      version: null,
      mc_version: mcVersion,
      source_url: this.getSourceUrl(name),
      icon_url: BUILT_IN_ICON_URLS[name] ?? null,
      ...(isModrinthProject && { coordinates }),
      notes: `Failed to fetch: ${error}`,
      fallback_used: false,
    };
  }

  // Create incompatible version entry
  private createIncompatibleVersion(name: string, mcVersion: string): DependencyVersion {
    const loader = LOADER_MAPPING[name] || "universal";
    const minVersion = MINIMUM_COMPATIBLE_VERSIONS[name];

    const isModrinthProject = !BUILT_IN_DEPENDENCIES.includes(
      name as (typeof BUILT_IN_DEPENDENCIES)[number],
    );

    return {
      name,
      loader,
      version: "N/A",
      mc_version: mcVersion,
      source_url: this.getSourceUrl(name),
      icon_url: BUILT_IN_ICON_URLS[name] ?? null,
      ...(isModrinthProject && { coordinates: null }),
      notes: `Not available for Minecraft ${mcVersion}. Requires ${minVersion} or later.`,
      fallback_used: false,
    };
  }

  // Check loader availability for multiple projects and versions
  async checkLoadersForProjects(
    projects: string[],
    mcVersions: string[],
  ): Promise<VersionedProjectCompatibility> {
    const result: VersionedProjectCompatibility = {};

    projects.forEach((project) => {
      result[project] = {};
      mcVersions.forEach((version) => {
        result[project][version] = {};
      });
    });

    const promises: Promise<void>[] = [];

    projects.forEach((project) => {
      mcVersions.forEach((mcVersion) => {
        promises.push(this.processProjectVersionWithVersions(project, mcVersion, result));
      });
    });

    await Promise.allSettled(promises);

    return result;
  }

  // Process a single project-version combination with versions
  private async processProjectVersionWithVersions(
    project: string,
    mcVersion: string,
    result: VersionedProjectCompatibility,
  ): Promise<void> {
    try {
      let dependency: DependencyVersion;

      if (BUILT_IN_DEPENDENCIES.includes(project as (typeof BUILT_IN_DEPENDENCIES)[number])) {
        dependency = await this.fetchDependency(project, mcVersion);
        const loaderVersions = this.extractLoaderVersionsFromBuiltInDependency(dependency, project);
        result[project][mcVersion] = loaderVersions;
      } else {
        dependency = await this.fetchModrinthProject(project, mcVersion);
        const loaderVersions = this.extractLoaderVersionsFromDependency(dependency);
        result[project][mcVersion] = loaderVersions;
      }
    } catch (error) {
      console.warn(`Failed to fetch version data for ${project} on MC ${mcVersion}:`, error);
      result[project][mcVersion] = {
        forge: null,
        neoforge: null,
        fabric: null,
      };
    }
  }

  // Extract loader versions from dependency data
  private extractLoaderVersionsFromDependency(
    dependency: DependencyVersion,
  ): Record<string, string | null> {
    const loaderVersions: Record<string, string | null> = {
      forge: null,
      neoforge: null,
      fabric: null,
    };

    if (dependency.loader_versions) {
      loaderVersions.forge = dependency.loader_versions.forge || null;
      loaderVersions.neoforge = dependency.loader_versions.neoforge || null;
      loaderVersions.fabric = dependency.loader_versions.fabric || null;
    }

    if (Object.values(loaderVersions).every((v) => v === null) && dependency.version) {
      loaderVersions[dependency.loader] = dependency.version;
    }

    return loaderVersions;
  }

  // Extract loader versions from built-in dependency data
  private extractLoaderVersionsFromBuiltInDependency(
    dependency: DependencyVersion,
    project: string,
  ): Record<string, string | null> {
    const loaderVersions: Record<string, string | null> = {
      forge: null,
      neoforge: null,
      fabric: null,
    };

    const loaderMapping: Record<string, string> = {
      forge: "forge",
      neoforge: "neoforge",
      "fabric-loader": "fabric",
      loom: "fabric",
      forgegradle: "forge",
      "moddev-gradle": "neoforge",
      parchment: "universal",
      neoform: "universal",
    };

    const targetLoader = loaderMapping[project];

    if (targetLoader) {
      loaderVersions[targetLoader] = this.formatVersion(dependency.version);
    }

    return loaderVersions;
  }

  // Format version string
  private formatVersion(version: string | null): string | null {
    if (!version || version === "N/A" || version === null) {
      return null;
    }
    return version;
  }
}

// Re-export MINIMUM_COMPATIBLE_VERSIONS for use in createIncompatibleVersion
import { MINIMUM_COMPATIBLE_VERSIONS } from "../utils/constants";
