import { MINIMUM_COMPATIBLE_VERSIONS, VERSION_UTILS } from './constants';

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

        if (mcMajor !== minMajor) return mcMajor > minMajor;
        if (mcMinor !== minMinor) return mcMinor > minMinor;
        return mcPatch >= minPatch;
    } catch {
        console.warn(`Version parsing failed for ${mcVersion} or ${minVersion}, assuming compatible`);
        return true;
    }
}

// Check if a dependency is compatible with the given Minecraft version
export function isDependencyCompatible(dependencyName: string, mcVersion: string): boolean {
    const minVersion = MINIMUM_COMPATIBLE_VERSIONS[dependencyName];
    if (!minVersion) {
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

// Check whether a version starts with a prefix on a segment boundary.
export function matchesVersionPrefix(prefix: string, version: string): boolean {
    if (!version.startsWith(prefix)) {
        return false;
    }
    if (version.length === prefix.length) {
        return true;
    }
    const nextChar = version.charAt(prefix.length);
    return nextChar === '.' || nextChar === '-';
}

// Generate intelligent fallback versions for Parchment
export function generateParchmentFallbackVersions(mcVersion: string): string[] {
    const versions: string[] = [mcVersion];

    const parts: string[] = mcVersion.split('.');
    if (parts.length < 2) {
        return versions;
    }

    const major: number = parseInt(parts[0]) || 1;
    const minor: number = parseInt(parts[1]) || 21;

    if (mcVersion.includes('-pre') || mcVersion.includes('-rc') || mcVersion.includes('-snapshot')) {
        const baseVersion = mcVersion.split('-')[0];
        if (baseVersion !== mcVersion) {
            versions.push(baseVersion);
        }
    }

    const patch: number = parts.length >= 3 ? parseInt(parts[2].split('-')[0]) || 0 : 0;

    for (let p = patch - 1; p >= 0; p--) {
        versions.push(`${major}.${minor}.${p}`);
    }

    for (let m = Math.max(0, minor - VERSION_UTILS.MAX_PREVIOUS_MINOR_VERSIONS); m < minor; m++) {
        for (
            let p = VERSION_UTILS.MAX_PATCH_VERSIONS_PER_MINOR;
            p >= VERSION_UTILS.DEFAULT_PATCH_START;
            p--
        ) {
            versions.push(`${major}.${m}.${p}`);
        }
    }

    return versions;
}

// Sort versions semantically (handles pre-release versions)
export function sortVersionsSemantically(versions: string[]): string[] {
    return versions.sort((a, b) => {
        if (typeof a !== 'string' || typeof b !== 'string') {
            return 0;
        }

        const aParts: number[] = a.split(/[.\-]/).map((s) => parseInt(s) || 0);
        const bParts: number[] = b.split(/[.\-]/).map((s) => parseInt(s) || 0);

        const maxLength = Math.max(aParts.length, bParts.length);
        const aPadded = [...aParts, ...Array(maxLength - aParts.length).fill(0)];
        const bPadded = [...bParts, ...Array(maxLength - bParts.length).fill(0)];

        for (let i = 0; i < maxLength; i++) {
            if (aPadded[i] !== bPadded[i]) {
                return aPadded[i] - bPadded[i];
            }
        }

        const aHasDash = a.includes('-');
        const bHasDash = b.includes('-');

        if (!aHasDash && bHasDash) return 1;
        if (aHasDash && !bHasDash) return -1;

        return a.localeCompare(b);
    });
}
