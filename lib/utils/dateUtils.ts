import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Define consistent date formats for the application
export const DATE_FORMATS = {
  // API timestamp format (ISO 8601 with timezone)
  API_TIMESTAMP: "yyyy-MM-dd'T'HH:mm:ssxxx",

  // Display formats
  DISPLAY_DATE: 'PPP', // e.g., 'Jan 1, 2024'
  DISPLAY_DATETIME: 'PPPpp', // e.g., 'Jan 1, 2024 at 12:00 PM'
  DISPLAY_SHORT_DATE: 'MMM d, yyyy', // e.g., 'Jan 1, 2024'
  DISPLAY_SHORT_DATETIME: 'MMM d, yyyy HH:mm', // e.g., 'Jan 1, 2024 12:00'

  // Relative time format (used internally by formatDistanceToNow)
  RELATIVE: 'relative',
} as const;

/**
 * Format a date for API responses (ISO 8601 format)
 * @param date - Date to format (optional, defaults to current time)
 * @returns ISO 8601 formatted timestamp string
 */
export function formatApiTimestamp(date?: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : (date || new Date());
  return format(dateObj, DATE_FORMATS.API_TIMESTAMP);
}

/**
 * Format a date for general display purposes
 * @param date - Date to format (optional, defaults to current time)
 * @returns User-friendly date and time string
 */
export function formatDateForDisplay(date?: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : (date || new Date());
  return format(dateObj, DATE_FORMATS.DISPLAY_DATETIME);
}

/**
 * Format a date for short display (compact format)
 * @param date - Date to format (optional, defaults to current time)
 * @returns Compact date and time string
 */
export function formatDateShort(date?: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : (date || new Date());
  return format(dateObj, DATE_FORMATS.DISPLAY_SHORT_DATETIME);
}

/**
 * Format a date for short display without time
 * @param date - Date to format (optional, defaults to current time)
 * @returns Compact date string
 */
export function formatDateOnly(date?: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : (date || new Date());
  return format(dateObj, DATE_FORMATS.DISPLAY_SHORT_DATE);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param date - Date to format (optional, defaults to current time)
 * @returns Relative time string
 */
export function formatRelativeTime(date?: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : (date || new Date());
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Add minutes to a date
 * @param date - Base date
 * @param minutes - Number of minutes to add
 * @returns New date with minutes added
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Add milliseconds to a date
 * @param date - Base date
 * @param milliseconds - Number of milliseconds to add
 * @returns New date with milliseconds added
 */
export function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds);
}

/**
 * Check if a timestamp is expired
 * @param timestamp - Timestamp to check (ISO string or Date)
 * @param ttlMs - Time to live in milliseconds
 * @returns True if expired, false otherwise
 */
export function isExpired(timestamp: string | Date, ttlMs: number): boolean {
  const dateObj = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
  const expirationTime = dateObj.getTime() + ttlMs;
  return Date.now() > expirationTime;
}

/**
 * Get cache expiration date
 * @param createdAt - When the cache was created
 * @param ttlMs - Cache TTL in milliseconds
 * @returns Expiration date
 */
export function getCacheExpiration(createdAt: Date | string, ttlMs: number): Date {
  const dateObj = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt;
  return addMilliseconds(dateObj, ttlMs);
}

/**
 * Parse a date string or return current date if invalid
 * @param dateInput - Date string, Date object, or undefined
 * @returns Valid Date object
 */
export function safeParseDate(dateInput?: string | Date): Date {
  if (!dateInput) {
    return new Date();
  }

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  }

  try {
    const parsed = parseISO(dateInput);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  } catch {
    return new Date();
  }
}