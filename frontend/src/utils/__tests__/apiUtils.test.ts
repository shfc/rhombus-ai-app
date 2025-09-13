import {
  buildFileApiUrl,
  createApiHeaders,
  createUploadFormData,
  handleApiError,
} from '../apiUtils';

// Mock the config module
jest.mock('@/config/env', () => ({
  default: {
    apiUrl: 'http://localhost:8000',
  },
}));

describe('apiUtils', () => {
  describe('buildFileApiUrl', () => {
    it('should build correct API URL for file operations', () => {
      const fileId = 123;
      const endpoint = 'preview' as const;
      const result = buildFileApiUrl(fileId, endpoint);
      expect(result).toBe('http://localhost:8000/api/files/123/preview/');
    });

    it('should handle different endpoints', () => {
      expect(buildFileApiUrl(456, 'modify')).toBe(
        'http://localhost:8000/api/files/456/modify/'
      );
      expect(buildFileApiUrl(789, 'apply')).toBe(
        'http://localhost:8000/api/files/789/apply/'
      );
    });
  });

  describe('createUploadFormData', () => {
    it('should create FormData with CSV file', () => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

      const formData = createUploadFormData(file);

      expect(formData.get('file')).toBe(file);
      expect(formData.get('file_type')).toBe('csv');
    });

    it('should create FormData with Excel file', () => {
      const file = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const formData = createUploadFormData(file);

      expect(formData.get('file')).toBe(file);
      expect(formData.get('file_type')).toBe('excel');
    });
  });

  describe('createApiHeaders', () => {
    it('should return headers with Content-Type by default', () => {
      const headers = createApiHeaders();
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should return headers with Content-Type when explicitly requested', () => {
      const headers = createApiHeaders(true);
      expect(headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should return empty headers when Content-Type is excluded', () => {
      const headers = createApiHeaders(false);
      expect(headers).toEqual({});
    });
  });

  describe('handleApiError', () => {
    it('should handle error response with error field', async () => {
      const response = new Response(
        JSON.stringify({ error: 'Test error message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );

      const result = await handleApiError(response);
      expect(result).toBe('Test error message');
    });

    it('should handle error response without error field', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Different field' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );

      const result = await handleApiError(response);
      expect(result).toBe('An error occurred');
    });

    it('should handle non-JSON response', async () => {
      const response = new Response('Not JSON', { status: 500 });

      const result = await handleApiError(response);
      expect(result).toBe('An error occurred');
    });
  });
});
