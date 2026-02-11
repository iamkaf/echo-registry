import { describe, it, expect } from 'vitest';

describe('Dependencies API Integration', () => {
  it('should return 200 and non-empty dependencies data', async () => {
    // Test the main dependencies endpoint that users rely on
    const response = await fetch('http://localhost:3000/api/versions/dependencies/1.21.1');

    // Verify the response status
    expect(response.status).toBe(200);

    // Parse and validate the response data
    const data = await response.json();

    // Check response structure matches expected API format
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('timestamp');

    // Verify we have actual dependencies data
    expect(data.data).toBeDefined();
    expect(data.data).not.toBeNull();

    // Verify we have the expected data structure
    if (data.data && typeof data.data === 'object') {
      expect(data.data).toHaveProperty('mc_version');
      expect(data.data).toHaveProperty('dependencies');

      // Verify we have actual dependency entries
      if (Array.isArray(data.data.dependencies)) {
        expect(data.data.dependencies.length).toBeGreaterThan(0);

        // Verify dependency entries have required fields
        const firstDependency = data.data.dependencies[0];
        expect(firstDependency).toHaveProperty('name');
        expect(firstDependency).toHaveProperty('loader');
        expect(firstDependency).toHaveProperty('version');
        expect(firstDependency).toHaveProperty('mc_version');
        expect(firstDependency).toHaveProperty('source_url');
      }
    }

    // Verify the timestamp is a valid ISO string
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should return 400 when projects includes non-Modrinth values', async () => {
    const response = await fetch('http://localhost:3000/api/versions/dependencies/1.21.1?projects=forge');

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid projects parameter');
    expect(data.error).toContain('forge');
  });
});
