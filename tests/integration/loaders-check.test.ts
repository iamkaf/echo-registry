import { describe, it, expect } from 'vitest';

describe('Project Compatibility API Integration', () => {
  it('should return 200 and proper project compatibility data', async () => {
    // Test the project compatibility check endpoint with valid parameters
    const response = await fetch(
      'http://localhost:3000/api/projects/compatibility?projects=fabric-api&versions=1.21.1',
    );

    // Verify the response status
    expect(response.status).toBe(200);

    // Parse and validate the response data
    const data = await response.json();

    // Check response structure matches expected API format
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('cached_at');

    // Verify we have actual loader availability data
    expect(data.data).toBeDefined();
    expect(data.data).not.toBeNull();

    // Verify the nested structure format
    if (data.data && typeof data.data === 'object') {
      // Should have fabric-api as the project key
      expect(data.data).toHaveProperty('fabric-api');

      // fabric-api should have 1.21.1 as version key
      if (data.data['fabric-api'] && typeof data.data['fabric-api'] === 'object') {
        expect(data.data['fabric-api']).toHaveProperty('1.21.1');

        // The version should have an array of loaders
        if (Array.isArray(data.data['fabric-api']['1.21.1'])) {
          // fabric-api should be available for fabric loader
          expect(data.data['fabric-api']['1.21.1']).toContain('fabric');
        }
      }
    }

    // Verify the timestamp is a valid ISO string
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify the cached_at is a valid ISO string
    if (data.cached_at) {
      expect(data.cached_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  it('should handle multiple projects and versions', async () => {
    // Test with multiple projects and versions
    const response = await fetch(
      'http://localhost:3000/api/projects/compatibility?projects=fabric-api,amber&versions=1.21.1,1.20.1',
    );

    // Verify the response status
    expect(response.status).toBe(200);

    // Parse and validate the response data
    const data = await response.json();

    // Check response structure
    expect(data).toHaveProperty('data');
    expect(data.data).toBeDefined();

    // Verify we have both projects
    if (data.data && typeof data.data === 'object') {
      expect(data.data).toHaveProperty('fabric-api');
      expect(data.data).toHaveProperty('amber');

      // Verify each project has both versions
      expect(data.data['fabric-api']).toHaveProperty('1.21.1');
      expect(data.data['fabric-api']).toHaveProperty('1.20.1');
      expect(data.data['amber']).toHaveProperty('1.21.1');
      expect(data.data['amber']).toHaveProperty('1.20.1');

      // Verify version objects with all three loaders are present
      expect(typeof data.data['fabric-api']['1.21.1']).toBe('object');
      expect(typeof data.data['fabric-api']['1.20.1']).toBe('object');
      expect(typeof data.data['amber']['1.21.1']).toBe('object');
      expect(typeof data.data['amber']['1.20.1']).toBe('object');

      // Verify all three loaders are present for each project
      expect(data.data['fabric-api']['1.21.1']).toHaveProperty('forge');
      expect(data.data['fabric-api']['1.21.1']).toHaveProperty('neoforge');
      expect(data.data['fabric-api']['1.21.1']).toHaveProperty('fabric');
    }
  });

  it('should return 400 for missing projects parameter', async () => {
    // Test with missing projects parameter
    const response = await fetch('http://localhost:3000/api/projects/compatibility?versions=1.21.1');

    // Verify the response status is 400
    expect(response.status).toBe(400);

    // Parse and validate the error response
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('timestamp');
    expect(data.error).toContain('Projects parameter is required');
  });

  it('should return 400 for missing versions parameter', async () => {
    // Test with missing versions parameter
    const response = await fetch('http://localhost:3000/api/projects/compatibility?projects=fabric-api');

    // Verify the response status is 400
    expect(response.status).toBe(400);

    // Parse and validate the error response
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('timestamp');
    expect(data.error).toContain('Versions parameter is required');
  });

  it('should return 400 for empty projects parameter', async () => {
    // Test with empty projects parameter
    const response = await fetch(
      'http://localhost:3000/api/projects/compatibility?projects=&versions=1.21.1',
    );

    // Verify the response status is 400
    expect(response.status).toBe(400);

    // Parse and validate the error response
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('timestamp');
    expect(data.error).toContain('Projects parameter is required');
  });

  it('should return 400 for empty versions parameter', async () => {
    // Test with empty versions parameter
    const response = await fetch(
      'http://localhost:3000/api/projects/compatibility?projects=fabric-api&versions=',
    );

    // Verify the response status is 400
    expect(response.status).toBe(400);

    // Parse and validate the error response
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('timestamp');
    expect(data.error).toContain('Versions parameter is required');
  });

  it('should handle invalid project names gracefully', async () => {
    // Test with invalid/non-existent project name
    const response = await fetch(
      'http://localhost:3000/api/projects/compatibility?projects=invalid-project-name-12345&versions=1.21.1',
    );

    // Should still return 200, but with empty arrays for the invalid project
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toBeDefined();

    // Should have the project key but with null values for all loaders
    if (data.data && typeof data.data === 'object') {
      expect(data.data).toHaveProperty('invalid-project-name-12345');
      if (data.data['invalid-project-name-12345']) {
        expect(typeof data.data['invalid-project-name-12345']['1.21.1']).toBe('object');
        // Should have null for all loaders for invalid project
        expect(data.data['invalid-project-name-12345']['1.21.1']).toEqual({
          forge: null,
          neoforge: null,
          fabric: null,
        });
      }
    }
  });

  it('should handle whitespace in parameters correctly', async () => {
    // Test with whitespace in parameters
    const response = await fetch(
      'http://localhost:3000/api/projects/compatibility?projects=fabric-api,%20%20amber%20%20&versions=1.21.1,%20%201.20.1%20%20',
    );

    // Verify the response status
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');

    // Should handle whitespace correctly and return clean data
    if (data.data && typeof data.data === 'object') {
      expect(data.data).toHaveProperty('fabric-api');
      expect(data.data).toHaveProperty('amber');
      expect(data.data['fabric-api']).toHaveProperty('1.21.1');
      expect(data.data['fabric-api']).toHaveProperty('1.20.1');
      expect(data.data['amber']).toHaveProperty('1.21.1');
      expect(data.data['amber']).toHaveProperty('1.20.1');
    }
  });
});
