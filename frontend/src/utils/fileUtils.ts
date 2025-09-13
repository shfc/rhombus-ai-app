/**
 * Utility functions for file operations
 */

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates if a file type is supported
 * @param fileName - Name of the file
 * @returns Boolean indicating if file type is valid
 */
export function isValidFileType(fileName: string): boolean {
  const validTypes = ['.csv', '.xlsx', '.xls'];
  return validTypes.some((type) => fileName.toLowerCase().endsWith(type));
}

/**
 * Validates file size
 * @param fileSize - Size in bytes
 * @param maxSizeMB - Maximum size in MB (default: 10)
 * @returns Boolean indicating if file size is valid
 */
export function isValidFileSize(
  fileSize: number,
  maxSizeMB: number = 10
): boolean {
  return fileSize <= maxSizeMB * 1024 * 1024;
}

/**
 * Gets file type from file name
 * @param fileName - Name of the file
 * @returns File type ('csv' or 'excel')
 */
export function getFileType(fileName: string): 'csv' | 'excel' {
  return fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
}

/**
 * Validates file for upload
 * @param file - File object
 * @param maxSizeMB - Maximum size in MB
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  if (!isValidFileType(file.name)) {
    return { isValid: false, error: 'Please upload a CSV or Excel file' };
  }

  if (!isValidFileSize(file.size, maxSizeMB)) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}
