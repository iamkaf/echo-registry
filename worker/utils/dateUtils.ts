/**
 * Format a date for API responses (ISO 8601 format)
 */
export function formatApiTimestamp(date?: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date || new Date();
  return dateObj.toISOString();
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(date?: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date || new Date();
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
