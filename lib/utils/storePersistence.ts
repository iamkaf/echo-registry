/**
 * localStorage persistence utilities for Zustand store
 * Provides SSR-safe operations with proper error handling
 */

export const STORAGE_KEY = 'echo-registry-projects';

/**
 * Safely retrieves stored projects from localStorage
 * @returns Array of project names, empty array if unavailable or invalid
 */
export const getStoredProjects = (): string[] => {
  // SSR protection
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    // Validate that it's an array of strings
    return Array.isArray(parsed)
      ? parsed.filter(item => typeof item === 'string' && item.trim().length > 0)
      : [];
  } catch (error) {
    console.warn('Error reading projects from localStorage:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (cleanupError) {
      console.warn('Failed to clear corrupted localStorage data:', cleanupError);
    }
    return [];
  }
};

/**
 * Safely saves projects to localStorage
 * @param projects - Array of project names to save
 */
export const setStoredProjects = (projects: string[]): void => {
  // SSR protection
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Validate input
    const validProjects = projects.filter(p => typeof p === 'string' && p.trim().length > 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validProjects));
  } catch (error) {
    console.warn('Error saving projects to localStorage:', error);
    // Could implement fallback strategy here (e.g., session storage)
  }
};

/**
 * Checks if localStorage is available and has quota
 * @returns true if localStorage is available and functional
 */
export const checkStorageQuota = (): boolean => {
  if (typeof window === 'undefined') return true;

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('Storage quota exceeded or localStorage unavailable:', error);
    return false;
  }
};