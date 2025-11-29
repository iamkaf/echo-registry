import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window and document globals
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});