import {
  formatFileSize,
  getFileType,
  isValidFileSize,
  isValidFileType,
  validateFile,
} from '../fileUtils';

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should handle decimal values correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('isValidFileType', () => {
    it('should return true for valid file types', () => {
      expect(isValidFileType('test.csv')).toBe(true);
      expect(isValidFileType('test.xlsx')).toBe(true);
      expect(isValidFileType('test.xls')).toBe(true);
      expect(isValidFileType('TEST.CSV')).toBe(true);
      expect(isValidFileType('data.XLSX')).toBe(true);
    });

    it('should return false for invalid file types', () => {
      expect(isValidFileType('test.txt')).toBe(false);
      expect(isValidFileType('test.pdf')).toBe(false);
      expect(isValidFileType('test.docx')).toBe(false);
      expect(isValidFileType('test')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file size correctly with default max size', () => {
      const oneGB = 1024 * 1024 * 1024;
      expect(isValidFileSize(0)).toBe(true);
      expect(isValidFileSize(oneGB)).toBe(true);
      expect(isValidFileSize(oneGB - 1)).toBe(true);
      expect(isValidFileSize(oneGB + 1)).toBe(false);
    });

    it('should validate file size correctly with custom max size', () => {
      const fiveMB = 5 * 1024 * 1024;
      expect(isValidFileSize(fiveMB, 5)).toBe(true);
      expect(isValidFileSize(fiveMB + 1, 5)).toBe(false);
    });
  });

  describe('getFileType', () => {
    it('should return correct file type', () => {
      expect(getFileType('test.csv')).toBe('csv');
      expect(getFileType('test.xlsx')).toBe('excel');
      expect(getFileType('test.xls')).toBe('excel');
      expect(getFileType('TEST.CSV')).toBe('csv');
      expect(getFileType('data.XLSX')).toBe('excel');
    });
  });

  describe('validateFile', () => {
    const createMockFile = (name: string): File => {
      return new File([''], name, { type: 'text/plain' });
    };

    it('should validate a valid file', () => {
      const file = createMockFile('test.csv');
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file type', () => {
      const file = createMockFile('test.txt');
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please upload a CSV or Excel file');
    });

    it('should reject oversized file', () => {
      const file = createMockFile('test.csv');
      Object.defineProperty(file, 'size', { value: 1025 * 1024 * 1024 }); // 1025MB > 1GB

      const result = validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 1024MB');
    });

    it('should use custom max size', () => {
      const file = createMockFile('test.csv');
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

      const result = validateFile(file, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 5MB');
    });
  });
});
