import {
  createModificationSummary,
  formatModificationRate,
  getConfidenceLevel,
  isConfidenceAcceptable,
} from '../modificationUtils';

describe('modificationUtils', () => {
  describe('getConfidenceLevel', () => {
    it('should return high confidence for scores above 0.8', () => {
      const result = getConfidenceLevel(0.9);
      expect(result.category).toBe('high');
      expect(result.percentage).toBe(90);
      expect(result.styles).toBe('bg-green-100 text-green-800');
    });

    it('should return medium confidence for scores between 0.5 and 0.8', () => {
      const result = getConfidenceLevel(0.7);
      expect(result.category).toBe('medium');
      expect(result.percentage).toBe(70);
      expect(result.styles).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return low confidence for scores below 0.5', () => {
      const result = getConfidenceLevel(0.3);
      expect(result.category).toBe('low');
      expect(result.percentage).toBe(30);
      expect(result.styles).toBe('bg-red-100 text-red-800');
    });

    it('should handle boundary values correctly', () => {
      expect(getConfidenceLevel(0.8).category).toBe('medium');
      expect(getConfidenceLevel(0.81).category).toBe('high');
      expect(getConfidenceLevel(0.5).category).toBe('low');
      expect(getConfidenceLevel(0.51).category).toBe('medium');
    });
  });

  describe('isConfidenceAcceptable', () => {
    it('should return true for confidence above default threshold', () => {
      expect(isConfidenceAcceptable(0.5)).toBe(true);
      expect(isConfidenceAcceptable(0.3)).toBe(true);
    });

    it('should return false for confidence below default threshold', () => {
      expect(isConfidenceAcceptable(0.2)).toBe(false);
    });

    it('should respect custom threshold', () => {
      expect(isConfidenceAcceptable(0.6, 0.7)).toBe(false);
      expect(isConfidenceAcceptable(0.8, 0.7)).toBe(true);
    });
  });

  describe('formatModificationRate', () => {
    it('should format rate as percentage', () => {
      expect(formatModificationRate(0.5)).toBe('50%');
      expect(formatModificationRate(0.123)).toBe('12%');
      expect(formatModificationRate(1.0)).toBe('100%');
      expect(formatModificationRate(0)).toBe('0%');
    });
  });

  describe('createModificationSummary', () => {
    it('should create summary for modifications with changes', () => {
      const stats = {
        total_rows: 1000,
        modified_rows: 150,
        modification_rate: 0.15,
      };

      const result = createModificationSummary(stats);

      expect(result.totalRows).toBe('1,000');
      expect(result.modifiedRows).toBe('150');
      expect(result.changeRate).toBe('15%');
      expect(result.hasChanges).toBe(true);
    });

    it('should create summary for modifications without changes', () => {
      const stats = {
        total_rows: 500,
        modified_rows: 0,
        modification_rate: 0,
      };

      const result = createModificationSummary(stats);

      expect(result.totalRows).toBe('500');
      expect(result.modifiedRows).toBe('0');
      expect(result.changeRate).toBe('0%');
      expect(result.hasChanges).toBe(false);
    });

    it('should handle large numbers with localized formatting', () => {
      const stats = {
        total_rows: 1234567,
        modified_rows: 98765,
        modification_rate: 0.08,
      };

      const result = createModificationSummary(stats);

      expect(result.totalRows).toBe('1,234,567');
      expect(result.modifiedRows).toBe('98,765');
      expect(result.changeRate).toBe('8%');
      expect(result.hasChanges).toBe(true);
    });
  });
});
