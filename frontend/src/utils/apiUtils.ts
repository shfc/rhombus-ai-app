/**
 * Utility functions for API operations
 */

import config from '@/config/env';

/**
 * Builds API URL for file operations
 * @param fileId - File ID
 * @param endpoint - Endpoint name ('preview', 'modify', 'apply')
 * @returns Complete API URL
 */
export function buildFileApiUrl(
  fileId: number,
  endpoint: 'preview' | 'modify' | 'apply'
): string {
  return `${config.apiUrl}/api/files/${fileId}/${endpoint}/`;
}

/**
 * Builds upload API URL
 * @returns Upload API URL
 */
export function buildUploadApiUrl(): string {
  return `${config.apiUrl}/api/upload/`;
}

/**
 * Creates FormData for file upload
 * @param file - File to upload
 * @returns FormData object
 */
export function createUploadFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file);

  // Determine file type based on extension
  const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
  formData.append('file_type', fileType);

  return formData;
}

/**
 * Handles API error responses
 * @param response - Fetch response
 * @returns Error message
 */
export async function handleApiError(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.error || 'An error occurred';
  } catch {
    return 'An error occurred';
  }
}

/**
 * Creates headers for API requests
 * @param includeContentType - Whether to include Content-Type header
 * @returns Headers object
 */
export function createApiHeaders(
  includeContentType: boolean = true
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}
