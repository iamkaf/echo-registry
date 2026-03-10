function uniquePreservingOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  values.forEach((value) => {
    if (!seen.has(value)) {
      seen.add(value);
      normalized.push(value);
    }
  });

  return normalized;
}

function sortForCacheKey(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function normalizeDependencyProjects(projects: string[]): {
  requestProjects: string[];
  cacheProjects: string[];
} {
  const requestProjects = uniquePreservingOrder(
    projects.map((project) => project.trim()).filter(Boolean),
  );

  if (!requestProjects.includes("fabric-api")) {
    requestProjects.push("fabric-api");
  }

  return {
    requestProjects,
    cacheProjects: sortForCacheKey(requestProjects),
  };
}

export function normalizeCompatibilityInputs(
  projects: string[],
  versions: string[],
): {
  requestProjects: string[];
  requestVersions: string[];
  cacheProjects: string[];
  cacheVersions: string[];
} {
  const requestProjects = uniquePreservingOrder(
    projects.map((project) => project.trim()).filter(Boolean),
  );
  const requestVersions = uniquePreservingOrder(
    versions.map((version) => version.trim()).filter(Boolean),
  );

  return {
    requestProjects,
    requestVersions,
    cacheProjects: sortForCacheKey(requestProjects),
    cacheVersions: sortForCacheKey(requestVersions),
  };
}

export function createDependencyCacheKey(mcVersion: string, cacheProjects: string[]): string {
  const projectsKey = cacheProjects.length > 0 ? cacheProjects.join(",") : "_";
  return `dependencies/${mcVersion}?projects=${projectsKey}`;
}

export function createCompatibilityCacheKey(
  cacheProjects: string[],
  cacheVersions: string[],
): string {
  const projectsKey = cacheProjects.length > 0 ? cacheProjects.join(",") : "_";
  const versionsKey = cacheVersions.length > 0 ? cacheVersions.join(",") : "_";
  return `compatibility?projects=${projectsKey}&versions=${versionsKey}`;
}
