/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) {
    return '';
  }
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(target.getTime())) {
    return '';
  }
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Format date to readable string (e.g., "Jan 1, 2024")
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) {
    return '';
  }
  const target = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(target.getTime())) {
    return '';
  }
  return target.toLocaleDateString(
    'en-US',
    options || {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

/**
 * Format date and time (e.g., "Jan 1, 2024 at 10:30 AM")
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  const target = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(target.getTime())) {
    return '';
  }
  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) {
    return false;
  }
  const target = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(target.getTime())) {
    return false;
  }
  const today = new Date();
  return (
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
}
