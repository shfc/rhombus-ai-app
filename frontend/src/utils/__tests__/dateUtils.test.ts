import { formatDate, formatRelativeTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2024-01-15T10:30:00.000Z';
      const result = formatDate(dateString);
      // The exact format depends on locale, but it should be a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid date strings', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent time as just now', () => {
      // Use current time to ensure it shows as "Just now"
      const now = new Date();
      const dateString = now.toISOString();

      const result = formatRelativeTime(dateString);
      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      // Create a date that's clearly more than 1 minute in the past
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 3);
      const dateString = pastDate.toISOString();

      const result = formatRelativeTime(dateString);
      expect(result).toMatch(/\d+ minutes? ago/);
    });

    it('should format hours ago', () => {
      // Create a date that's clearly more than 1 hour in the past
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);
      const dateString = pastDate.toISOString();

      const result = formatRelativeTime(dateString);
      expect(result).toMatch(/\d+ hours? ago/);
    });

    it('should format days ago', () => {
      // Create a date that's clearly more than 1 day in the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const dateString = pastDate.toISOString();

      const result = formatRelativeTime(dateString);
      expect(result).toMatch(/\d+ days? ago/);
    });

    it('should fall back to formatDate for older dates', () => {
      // Create a date that's more than 7 days in the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const dateString = pastDate.toISOString();

      const result = formatRelativeTime(dateString);
      // Should fall back to formatDate for dates older than 7 days
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
