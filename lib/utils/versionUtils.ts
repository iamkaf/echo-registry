import { MINIMUM_COMPATIBLE_VERSIONS } from './constants';

// Parse Minecraft version into components (major, minor, patch)
export function parseMcVersion(version: string): [number, number, number] {
  const parts: string[] = version.split('.');
  if (parts.length < 2) {
    throw new Error(`Invalid version format: ${version}`);
  }

  const major: number = parseInt(parts[0]) || 0;
  const minor: number = parseInt(parts[1]) || 0;
  const patch: number = parts.length > 2 ? parseInt(parts[2]) || 0 : 0;

  return [major, minor, patch];
}

// Check if a version is compatible with a minimum version
export function isVersionCompatible(mcVersion: string, minVersion: string): boolean {
  try {
    const [mcMajor, mcMinor, mcPatch] = parseMcVersion(mcVersion);
    const [minMajor, minMinor, minPatch] = parseMcVersion(minVersion);

    // Compare versions lexicographically
    if (mcMajor !== minMajor) return mcMajor > minMajor;
    if (mcMinor !== minMinor) return mcMinor > minMinor;
    return mcPatch >= minPatch;
  } catch {
    // If we can't parse, assume compatible to be safe
    console.warn(`Version parsing failed for ${mcVersion} or ${minVersion}, assuming compatible`);
    return true;
  }
}

// Check if a dependency is compatible with the given Minecraft version
export function isDependencyCompatible(dependencyName: string, mcVersion: string): boolean {
  const minVersion = MINIMUM_COMPATIBLE_VERSIONS[dependencyName];
  if (!minVersion) {
    // For custom projects, assume compatible
    return true;
  }

  return isVersionCompatible(mcVersion, minVersion);
}

// Extract minor version from MC version (e.g., "1.21.1" -> "21.1")
export function extractMinorVersion(mcVersion: string): string {
  const parts: string[] = mcVersion.split('.');
  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}`;
  } else if (parts.length === 2) {
    return parts[1];
  } else {
    return mcVersion;
  }
}

// Generate intelligent fallback versions for Parchment
export function generateParchmentFallbackVersions(mcVersion: string): string[] {
  const versions: string[] = [mcVersion]; // Start with requested version

  // Parse the version
  const parts: string[] = mcVersion.split('.');
  if (parts.length < 2) {
    return versions; // Invalid format, just return original
  }

  const major: number = parseInt(parts[0]) || 1;
  const minor: number = parseInt(parts[1]) || 21;

  // If it's a pre-release version, first try the base version
  if (mcVersion.includes('-pre') || mcVersion.includes('-rc') || mcVersion.includes('-snapshot')) {
    const baseVersion = mcVersion.split('-')[0];
    if (baseVersion !== mcVersion) {
      versions.push(baseVersion);
    }
  }

  // Generate fallback versions by decrementing patch version
  const patch: number = parts.length >= 3 ? parseInt(parts[2].split('-')[0]) || 0 : 0;

  // Try patch versions from current down to 0
  for (let p = patch - 1; p >= 0; p--) {
    versions.push(`${major}.${minor}.${p}`);
  }

  // Try previous minor versions (up to 5 versions back)
  for (let m = Math.max(0, minor - 5); m < minor; m++) {
    // Try the latest patch versions for previous minors
    for (let p = 10; p >= 0; p--) {
      versions.push(`${major}.${m}.${p}`);
    }
  }

  return versions;
}

// Sort versions semantically (handles pre-release versions)
export function sortVersionsSemantically(versions: string[]): string[] {
  return versions.sort((a, b) => {
    // Guard against non-string values
    if (typeof a !== 'string' || typeof b !== 'string') {
      return 0;
    }

    // Extract numeric parts, treating dashes as separators
    const aParts: number[] = a.split(/[\.-]/).map((s) => parseInt(s) || 0);
    const bParts: number[] = b.split(/[\.-]/).map((s) => parseInt(s) || 0);

    // Pad shorter array with zeros
    const maxLength = Math.max(aParts.length, bParts.length);
    const aPadded = [...aParts, ...Array(maxLength - aParts.length).fill(0)];
    const bPadded = [...bParts, ...Array(maxLength - bParts.length).fill(0)];

    // Compare numerically
    for (let i = 0; i < maxLength; i++) {
      if (aPadded[i] !== bPadded[i]) {
        return aPadded[i] - bPadded[i];
      }
    }

    // If numeric parts are equal, prefer release over pre-release
    const aHasDash = a.includes('-');
    const bHasDash = b.includes('-');

    if (!aHasDash && bHasDash) return 1; // a is release, b is pre-release
    if (aHasDash && !bHasDash) return -1; // a is pre-release, b is release

    return a.localeCompare(b);
  });
}
