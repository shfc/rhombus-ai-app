/**
 * Utility functions for modification operations
 */

/**
 * Calculates confidence level category
 * @param confidence - Confidence value between 0 and 1
 * @returns Object with category and styles
 */
export function getConfidenceLevel(confidence: number): {
  category: 'high' | 'medium' | 'low';
  percentage: number;
  styles: string;
} {
  const percentage = Math.round(confidence * 100);

  if (confidence > 0.8) {
    return {
      category: 'high',
      percentage,
      styles: 'bg-green-100 text-green-800',
    };
  } else if (confidence > 0.5) {
    return {
      category: 'medium',
      percentage,
      styles: 'bg-yellow-100 text-yellow-800',
    };
  } else {
    return {
      category: 'low',
      percentage,
      styles: 'bg-red-100 text-red-800',
    };
  }
}

/**
 * Checks if modification confidence is acceptable
 * @param confidence - Confidence value between 0 and 1
 * @param threshold - Minimum acceptable confidence (default: 0.3)
 * @returns Boolean indicating if confidence is acceptable
 */
export function isConfidenceAcceptable(
  confidence: number,
  threshold: number = 0.3
): boolean {
  return confidence >= threshold;
}

/**
 * Formats modification rate as percentage
 * @param rate - Rate value between 0 and 1
 * @returns Percentage string
 */
export function formatModificationRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Creates a summary of modification statistics
 * @param stats - Modification statistics
 * @returns Formatted summary object
 */
export function createModificationSummary(stats: {
  total_rows: number;
  modified_rows: number;
  modification_rate: number;
}): {
  totalRows: string;
  modifiedRows: string;
  changeRate: string;
  hasChanges: boolean;
} {
  return {
    totalRows: stats.total_rows.toLocaleString(),
    modifiedRows: stats.modified_rows.toLocaleString(),
    changeRate: formatModificationRate(stats.modification_rate),
    hasChanges: stats.modified_rows > 0,
  };
}
