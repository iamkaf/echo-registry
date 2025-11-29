import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyService } from '../lib/services/dependencyService';

// Mock ModrinthVersion interface for testing
interface ModrinthVersion {
  version_number: string;
  date_published: string;
  loaders: string[];
  files: Array<{
    hashes: {
      sha1: string;
      sha512: string;
    };
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type: string | null;
  }>;
}

// Helper type for accessing private methods
type ServiceMethods = {
  groupVersionsByLoader: (versions: ModrinthVersion[]) => Record<string, ModrinthVersion[]>;
  findLatestVersionForLoader: (versions: ModrinthVersion[]) => ModrinthVersion | null;
  extractLatestDownloadsByLoader: (versions: ModrinthVersion[]) => Record<string, string | null>;
};

describe('DependencyService - Refactored Methods', () => {
  let service: DependencyService;

  beforeEach(() => {
    service = new DependencyService();
  });

  describe('groupVersionsByLoader', () => {
    it('should group versions by supported loaders correctly', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge', 'fabric'],
          files: []
        },
        {
          version_number: '1.0.1',
          date_published: '2024-01-02T00:00:00Z',
          loaders: ['neoforge'],
          files: []
        },
        {
          version_number: '1.0.2',
          date_published: '2024-01-03T00:00:00Z',
          loaders: ['forge', 'neoforge'],
          files: []
        }
      ];

      const grouped = (service as unknown as ServiceMethods).groupVersionsByLoader(mockVersions);

      expect(grouped.forge).toHaveLength(2);
      expect(grouped.fabric).toHaveLength(1);
      expect(grouped.neoforge).toHaveLength(2);

      expect(grouped.forge.map((v: ModrinthVersion) => v.version_number)).toEqual(['1.0.0', '1.0.2']);
      expect(grouped.fabric.map((v: ModrinthVersion) => v.version_number)).toEqual(['1.0.0']);
      expect(grouped.neoforge.map((v: ModrinthVersion) => v.version_number)).toEqual(['1.0.1', '1.0.2']);
    });

    it('should handle versions with no loaders', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: [],
          files: []
        },
        {
          version_number: '1.0.1',
          date_published: '2024-01-02T00:00:00Z',
          loaders: null as string[] | null,
          files: []
        }
      ];

      const grouped = (service as unknown as ServiceMethods).groupVersionsByLoader(mockVersions);

      expect(grouped.forge).toHaveLength(0);
      expect(grouped.fabric).toHaveLength(0);
      expect(grouped.neoforge).toHaveLength(0);
    });

    it('should ignore unsupported loaders', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['quilt', 'unsupported-loader'],
          files: []
        },
        {
          version_number: '1.0.1',
          date_published: '2024-01-02T00:00:00Z',
          loaders: ['forge', 'quilt'],
          files: []
        }
      ];

      const grouped = (service as unknown as ServiceMethods).groupVersionsByLoader(mockVersions);

      expect(grouped.forge).toHaveLength(1);
      expect(grouped.fabric).toHaveLength(0);
      expect(grouped.neoforge).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const grouped = (service as unknown as ServiceMethods).groupVersionsByLoader([]);

      expect(grouped.forge).toHaveLength(0);
      expect(grouped.fabric).toHaveLength(0);
      expect(grouped.neoforge).toHaveLength(0);
    });
  });

  describe('findLatestVersionForLoader', () => {
    it('should return the most recent version by date', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge'],
          files: []
        },
        {
          version_number: '1.0.1',
          date_published: '2024-01-02T00:00:00Z',
          loaders: ['forge'],
          files: []
        },
        {
          version_number: '1.0.2',
          date_published: '2024-01-01T12:00:00Z',
          loaders: ['forge'],
          files: []
        }
      ];

      const latest = (service as unknown as ServiceMethods).findLatestVersionForLoader(mockVersions);

      expect(latest?.version_number).toBe('1.0.1');
    });

    it('should return null for empty array', () => {
      const latest = (service as unknown as ServiceMethods).findLatestVersionForLoader([]);
      expect(latest).toBeNull();
    });

    it('should handle single version', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge'],
          files: []
        }
      ];

      const latest = (service as unknown as ServiceMethods).findLatestVersionForLoader(mockVersions);

      expect(latest?.version_number).toBe('1.0.0');
    });

    it('should handle versions with same date (should return first one due to reduce behavior)', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge'],
          files: []
        },
        {
          version_number: '1.0.1',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge'],
          files: []
        }
      ];

      const latest = (service as unknown as ServiceMethods).findLatestVersionForLoader(mockVersions);

      // When dates are equal, reduce() returns the first element (no change means first wins)
      expect(latest?.version_number).toBe('1.0.0');
    });
  });

  describe('extractLatestDownloadsByLoader Integration', () => {
    it('should integrate both methods correctly', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge'],
          files: [
            {
              hashes: { sha1: 'abc', sha512: 'def' },
              url: 'https://example.com/forge-1.0.0.jar',
              filename: 'forge-1.0.0.jar',
              primary: true,
              size: 1000,
              file_type: 'jar'
            }
          ]
        },
        {
          version_number: '1.0.1',
          date_published: '2024-01-02T00:00:00Z',
          loaders: ['fabric'],
          files: [
            {
              hashes: { sha1: 'ghi', sha512: 'jkl' },
              url: 'https://example.com/fabric-1.0.1.jar',
              filename: 'fabric-1.0.1.jar',
              primary: true,
              size: 2000,
              file_type: 'jar'
            }
          ]
        },
        {
          version_number: '1.0.2',
          date_published: '2024-01-03T00:00:00Z',
          loaders: ['neoforge'],
          files: [
            {
              hashes: { sha1: 'mno', sha512: 'pqr' },
              url: 'https://example.com/neoforge-1.0.2.jar',
              filename: 'neoforge-1.0.2.jar',
              primary: true,
              size: 3000,
              file_type: 'jar'
            }
          ]
        }
      ];

      const downloads = (service as unknown as ServiceMethods).extractLatestDownloadsByLoader(mockVersions);

      expect(downloads.forge).toBe('https://example.com/forge-1.0.0.jar');
      expect(downloads.fabric).toBe('https://example.com/fabric-1.0.1.jar');
      expect(downloads.neoforge).toBe('https://example.com/neoforge-1.0.2.jar');
    });

    it('should return null for loaders with no versions', () => {
      const mockVersions: ModrinthVersion[] = [
        {
          version_number: '1.0.0',
          date_published: '2024-01-01T00:00:00Z',
          loaders: ['forge'],
          files: []
        }
      ];

      const downloads = (service as unknown as ServiceMethods).extractLatestDownloadsByLoader(mockVersions);

      expect(downloads.forge).toBeNull();
      expect(downloads.fabric).toBeNull();
      expect(downloads.neoforge).toBeNull();
    });
  });
});