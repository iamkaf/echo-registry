import { describe, it, expect } from "vitest";
import { API_URLS, POPULAR_MODRINTH_PROJECTS } from "../../utils/constants";
import { parseMavenMetadata } from "../../utils/xmlParser";

const MC_VERSION = "1.21.4";
const HEADERS = { "User-Agent": "EchoRegistry/1.0" };

describe("External API Integration", () => {
  // -------------------------------------------------------------------------
  // Minecraft
  // -------------------------------------------------------------------------

  it.concurrent("Minecraft manifest returns versions array with required fields", async () => {
    const res = await fetch(API_URLS.MINECRAFT_MANIFEST, { headers: HEADERS });
    expect(res.status).toBe(200);

    const data = (await res.json()) as { versions: unknown[] };
    expect(data.versions).toBeInstanceOf(Array);
    expect(data.versions.length).toBeGreaterThan(0);

    const v = data.versions[0] as Record<string, unknown>;
    expect(v).toHaveProperty("id");
    expect(v).toHaveProperty("type");
    expect(v).toHaveProperty("releaseTime");
    expect(typeof v.id).toBe("string");
    expect(typeof v.releaseTime).toBe("string");
  });

  // -------------------------------------------------------------------------
  // Fabric Loader
  // -------------------------------------------------------------------------

  it.concurrent("Fabric loader returns versioned array with loader.version", async () => {
    const res = await fetch(`${API_URLS.FABRIC_LOADER}/${MC_VERSION}`, { headers: HEADERS });
    expect(res.status).toBe(200);

    const data = (await res.json()) as Array<{ loader: { version: string } }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(typeof data[0].loader.version).toBe("string");
  });

  // -------------------------------------------------------------------------
  // Modrinth — one test per popular project
  // -------------------------------------------------------------------------

  for (const slug of POPULAR_MODRINTH_PROJECTS) {
    it.concurrent(`Modrinth [${slug}] returns valid version array for MC ${MC_VERSION}`, async () => {
      const gameVersions = encodeURIComponent(JSON.stringify([MC_VERSION]));
      const url = `${API_URLS.MODRINTH_API}/${slug}/version?game_versions=${gameVersions}`;
      const res = await fetch(url, { headers: HEADERS });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);

      // If the project has no releases for this MC version the array is empty,
      // but the shape must still be an array (not an error object).
      if (Array.isArray(data) && data.length > 0) {
        const v = data[0] as Record<string, unknown>;
        expect(typeof v.version_number).toBe("string");
        expect(Array.isArray(v.loaders)).toBe(true);
        expect(Array.isArray(v.files)).toBe(true);
        expect(typeof v.date_published).toBe("string");
      }
    });
  }

  // -------------------------------------------------------------------------
  // NeoForge Maven metadata
  // -------------------------------------------------------------------------

  it.concurrent("NeoForge maven-metadata.xml has 1.21.x versions", async () => {
    const res = await fetch(API_URLS.NEOFORGE_METADATA, { headers: HEADERS });
    expect(res.status).toBe(200);

    const { versions } = parseMavenMetadata(await res.text());
    expect(versions.length).toBeGreaterThan(0);

    const mc121 = versions.filter((v) => v.startsWith("21."));
    expect(mc121.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // NeoForm Maven metadata
  // -------------------------------------------------------------------------

  it.concurrent("NeoForm maven-metadata.xml has 1.21.x versions", async () => {
    const res = await fetch(API_URLS.NEOFORM_METADATA, { headers: HEADERS });
    expect(res.status).toBe(200);

    const { versions } = parseMavenMetadata(await res.text());
    const mc121 = versions.filter((v) => v.startsWith("1.21"));
    expect(mc121.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // ForgeGradle Maven metadata
  // -------------------------------------------------------------------------

  it.concurrent("ForgeGradle maven-metadata.xml is parseable and has versions", async () => {
    const res = await fetch(API_URLS.FORGEGRADLE_METADATA, { headers: HEADERS });
    expect(res.status).toBe(200);

    const { versions } = parseMavenMetadata(await res.text());
    expect(versions.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Fabric Loom Maven metadata
  // -------------------------------------------------------------------------

  it.concurrent("Fabric Loom maven-metadata.xml has SNAPSHOT versions", async () => {
    const res = await fetch(API_URLS.LOOM_METADATA, { headers: HEADERS });
    expect(res.status).toBe(200);

    const { versions } = parseMavenMetadata(await res.text());
    const snapshots = versions.filter((v) => v.includes("SNAPSHOT"));
    expect(snapshots.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // ModDev Gradle Maven metadata
  // -------------------------------------------------------------------------

  it.concurrent("ModDev Gradle maven-metadata.xml has a <latest> tag and versions", async () => {
    const res = await fetch(API_URLS.MODDEV_GRADLE_METADATA, { headers: HEADERS });
    expect(res.status).toBe(200);

    const { latest, versions } = parseMavenMetadata(await res.text());
    expect(versions.length).toBeGreaterThan(0);
    expect(typeof latest).toBe("string");
  });

  // -------------------------------------------------------------------------
  // Parchment Maven metadata (with fallback across minor versions)
  // -------------------------------------------------------------------------

  it.concurrent(
    "Parchment maven-metadata.xml has stable versions for some 1.21.x MC version",
    async () => {
      // Mirror the worker's fallback strategy: try 1.21.4, then older minors
      const candidates = ["1.21.4", "1.21.3", "1.21.2", "1.21.1", "1.21"];
      let found = false;

      for (const mcVer of candidates) {
        const url = API_URLS.PARCHMENT_BASE.replace("{version}", mcVer);
        const res = await fetch(url, { headers: HEADERS });

        if (res.ok) {
          const { versions } = parseMavenMetadata(await res.text());
          const stable = versions.filter(
            (v) => !v.includes("SNAPSHOT") && !v.toLowerCase().includes("nightly"),
          );
          if (stable.length > 0) {
            found = true;
            break;
          }
        }
      }

      expect(found, "No stable Parchment versions found for any 1.21.x candidate").toBe(true);
    },
  );

  // -------------------------------------------------------------------------
  // Forge HTML index (regex scraping)
  // -------------------------------------------------------------------------

  it.concurrent(
    "Forge HTML index has extractable Recommended and Latest version strings",
    async () => {
      const url = `${API_URLS.FORGE_BASE}/index_${MC_VERSION}.html`;
      const res = await fetch(url, { headers: HEADERS });
      expect(res.status).toBe(200);

      const html = await res.text();

      // Replicate the exact regexes from dependencyService.ts
      const recommendedMatch = /Recommended:\s*([0-9.]+)/.exec(html);
      const latestMatch = /Latest:\s*([0-9.]+)/.exec(html);

      expect(recommendedMatch).not.toBeNull();
      expect(latestMatch).not.toBeNull();
      expect(recommendedMatch![1]).toMatch(/^\d+\.\d+\.\d/);
      expect(latestMatch![1]).toMatch(/^\d+\.\d+\.\d/);
    },
  );
});
