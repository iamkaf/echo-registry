import { DependencyVersion } from '@/types/dependency';

// Cache TTL (milliseconds)
export const CACHE_TTL_DEPENDENCIES = 5 * 60 * 1000; // 5 minutes
export const CACHE_TTL_MINECRAFT = 60 * 60 * 1000; // 1 hour

// HTTP Client Configuration
export const HTTP_TIMEOUT = 30000; // 30 seconds
export const USER_AGENT = 'EchoRegistry/1.0';

// External API URLs
export const API_URLS = {
  FORGE_BASE: 'https://files.minecraftforge.net/net/minecraftforge/forge',
  NEOFORGE_METADATA:
    'https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml',
  FABRIC_LOADER: 'https://meta.fabricmc.net/v2/versions/loader',
  MODRINTH_API: 'https://api.modrinth.com/v2/project',
  PARCHMENT_BASE:
    'https://maven.parchmentmc.org/org/parchmentmc/data/parchment-{version}/maven-metadata.xml',
  NEOFORM_METADATA: 'https://maven.neoforged.net/releases/net/neoforged/neoform/maven-metadata.xml',
  FORGEGRADLE_METADATA:
    'https://maven.minecraftforge.net/net/minecraftforge/gradle/ForgeGradle/maven-metadata.xml',
  MODDEV_GRADLE_METADATA:
    'https://maven.neoforged.net/releases/net/neoforged/moddev-gradle/maven-metadata.xml',
  MINECRAFT_MANIFEST: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
} as const;

// Popular Modrinth projects (pre-configured)
export const POPULAR_MODRINTH_PROJECTS = [
  'amber',
  'fabric-api',
  'modmenu',
  'rei',
  'architectury-api',
  'forge-config-api-port',
] as const;

// Minimum compatible versions for each dependency
export const MINIMUM_COMPATIBLE_VERSIONS: Record<string, string> = {
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
  forge: '1.2.5', // Forge has been around since very early versions
  parchment: '1.16.0',
} as const;

// Loader type mapping
export const LOADER_MAPPING: Record<string, DependencyVersion['loader']> = {
  forge: 'forge',
  neoforge: 'neoforge',
  'fabric-loader': 'fabric',
  forgegradle: 'forge',
  neoform: 'universal',
  'moddev-gradle': 'universal',
  parchment: 'universal',
  'fabric-api': 'fabric',
  modmenu: 'fabric',
  rei: 'universal',
  'architectury-api': 'universal',
  amber: 'universal',
} as const;
