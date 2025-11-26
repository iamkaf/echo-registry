import { XMLParser } from 'fast-xml-parser';

// XML parser configuration
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
};

export const xmlParser = new XMLParser(parserOptions);

// Parse Maven metadata XML to extract versions
export function parseMavenMetadata(xmlContent: string): {
  versions: string[];
  latest?: string;
} {
  try {
    const parsed = xmlParser.parse(xmlContent);
    const metadata = parsed.metadata || parsed;

    const versioning = metadata.versioning || {};
    const versions = versioning.versions?.version || [];
    const latest = versioning.latest;

    // Ensure versions is an array
    const versionArray = Array.isArray(versions) ? versions : versions ? [versions] : [];

    return {
      versions: versionArray,
      latest: typeof latest === 'string' ? latest : undefined,
    };
  } catch (error) {
    console.error('Failed to parse Maven metadata XML:', error);
    return { versions: [] };
  }
}

// Simple XML parsing for version tags (fallback method)
export function extractVersionTags(xmlContent: string, versionPrefix?: string): string[] {
  const versions: string[] = [];
  const versionRegex = /<version>(.*?)<\/version>/g;
  let match;

  while ((match = versionRegex.exec(xmlContent)) !== null) {
    const version = match[1].trim();
    if (!versionPrefix || version.startsWith(versionPrefix)) {
      versions.push(version);
    }
  }

  return versions;
}

// Find specific tag content in XML
export function findTagContent(xmlContent: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 'i');
  const match = regex.exec(xmlContent);
  return match ? match[1].trim() : null;
}
