import { describe, it, expect } from 'vitest';
import { parseMcVersion, isVersionCompatible, extractMinorVersion, generateParchmentFallbackVersions, sortVersionsSemantically } from '../lib/utils/versionUtils';

describe('parseMcVersion', () => {
  it('should parse standard version format', () => {
    expect(parseMcVersion('1.21.1')).toEqual([1, 21, 1]);
    expect(parseMcVersion('1.20.6')).toEqual([1, 20, 6]);
    expect(parseMcVersion('1.19.4')).toEqual([1, 19, 4]);
  });

  it('should handle versions without patch number', () => {
    expect(parseMcVersion('1.21')).toEqual([1, 21, 0]);
    expect(parseMcVersion('1.20')).toEqual([1, 20, 0]);
    expect(parseMcVersion('2.0')).toEqual([2, 0, 0]);
  });

  it('should handle single digit versions', () => {
    expect(parseMcVersion('1.0')).toEqual([1, 0, 0]);
    expect(parseMcVersion('2.1')).toEqual([2, 1, 0]);
  });

  it('should throw error for invalid format', () => {
    expect(() => parseMcVersion('invalid')).toThrow('Invalid version format: invalid');
    expect(() => parseMcVersion('')).toThrow('Invalid version format: ');
    expect(() => parseMcVersion('1')).toThrow('Invalid version format: 1');
  });

  it('should handle non-numeric parts gracefully', () => {
    expect(parseMcVersion('1.abc.3')).toEqual([1, 0, 3]);
    expect(parseMcVersion('a.b.c')).toEqual([0, 0, 0]);
  });
});

describe('isVersionCompatible', () => {
  it('should correctly identify compatible versions', () => {
    expect(isVersionCompatible('1.21.1', '1.20.0')).toBe(true); // major is greater
    expect(isVersionCompatible('1.21.1', '1.21.0')).toBe(true); // major same, minor greater
    expect(isVersionCompatible('1.21.1', '1.21.1')).toBe(true); // major/minor same, patch same
    expect(isVersionCompatible('1.21.2', '1.21.1')).toBe(true); // major/minor same, patch greater
  });

  it('should correctly identify incompatible versions', () => {
    expect(isVersionCompatible('1.20.1', '1.21.0')).toBe(false); // major less
    expect(isVersionCompatible('1.20.1', '1.20.2')).toBe(false); // major same, minor less
    expect(isVersionCompatible('1.21.0', '1.21.1')).toBe(false); // major/minor same, patch less
  });

  it('should handle edge cases and invalid input', () => {
    expect(isVersionCompatible('1.21.1', 'invalid')).toBe(true); // should assume compatible for invalid min version
    expect(isVersionCompatible('invalid', '1.20.0')).toBe(true); // should assume compatible for invalid version
  });
});

describe('extractMinorVersion', () => {
  it('should extract minor version correctly', () => {
    expect(extractMinorVersion('1.21.1')).toBe('21.1');
    expect(extractMinorVersion('1.20.6')).toBe('20.6');
    expect(extractMinorVersion('2.5.3')).toBe('5.3');
  });

  it('should handle versions with only major.minor', () => {
    expect(extractMinorVersion('1.21')).toBe('21');
    expect(extractMinorVersion('2.0')).toBe('0');
  });

  it('should handle edge cases', () => {
    expect(extractMinorVersion('1')).toBe('1'); // Only major version
    expect(extractMinorVersion('invalid.version.format')).toBe('version.format'); // Takes parts[1].[2]
    expect(extractMinorVersion('single')).toBe('single'); // Returns original when only one part
  });
});

describe('generateParchmentFallbackVersions', () => {
  it('should generate fallback versions correctly', () => {
    const fallbacks = generateParchmentFallbackVersions('1.21.1');
    expect(fallbacks).toContain('1.21.1'); // original version first
    expect(fallbacks).toContain('1.21.0'); // patch versions
    expect(fallbacks).toContain('1.20.10'); // previous minor with latest patches
  });

  it('should handle pre-release versions', () => {
    const fallbacks = generateParchmentFallbackVersions('1.21.1-pre1');
    expect(fallbacks).toContain('1.21.1-pre1'); // pre-release first
    expect(fallbacks).toContain('1.21.1'); // base version
    expect(fallbacks).toContain('1.21.0'); // fallback versions
  });

  it('should handle snapshot versions', () => {
    const fallbacks = generateParchmentFallbackVersions('1.21.1-snapshot');
    expect(fallbacks).toContain('1.21.1-snapshot'); // snapshot first
    expect(fallbacks).toContain('1.21.1'); // base version
    expect(fallbacks).toContain('1.21.0'); // fallback versions
  });

  it('should handle invalid format gracefully', () => {
    const fallbacks = generateParchmentFallbackVersions('invalid');
    expect(fallbacks).toEqual(['invalid']); // just return original
  });
});

describe('sortVersionsSemantically', () => {
  it('should sort versions correctly', () => {
    const versions = ['1.20.0', '1.21.1', '1.21.0', '1.20.1', '2.0.0'];
    const sorted = sortVersionsSemantically(versions);
    expect(sorted).toEqual(['1.20.0', '1.20.1', '1.21.0', '1.21.1', '2.0.0']);
  });

  it('should handle pre-release versions correctly', () => {
    const versions = ['1.21.1', '1.21.1-pre1', '1.21.1-rc1', '1.21.1-snapshot'];
    const sorted = sortVersionsSemantically(versions);
    // Pre-releases should come before release
    expect(sorted.indexOf('1.21.1-pre1')).toBeLessThan(sorted.indexOf('1.21.1'));
    expect(sorted.indexOf('1.21.1-rc1')).toBeLessThan(sorted.indexOf('1.21.1'));
    expect(sorted.indexOf('1.21.1-snapshot')).toBeLessThan(sorted.indexOf('1.21.1'));
  });

  it('should handle edge cases', () => {
    const versions = ['invalid', '1.21.1', '1.20.0'];
    const sorted = sortVersionsSemantically(versions);
    // Should handle non-string values gracefully
    expect(sorted).toContain('1.20.0');
    expect(sorted).toContain('1.21.1');
  });

  it('should handle complex version patterns', () => {
    const versions = ['1.21.1-pre1', '1.21.1-pre2', '1.21.1-rc1', '1.21.1', '1.21.2'];
    const sorted = sortVersionsSemantically(versions);
    expect(sorted).toEqual([
      '1.21.1-pre1', '1.21.1-pre2', '1.21.1-rc1', '1.21.1', '1.21.2'
    ]);
  });
});