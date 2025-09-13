import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  buildFileApiUrl,
  createApiHeaders,
  handleApiError,
} from '@/utils/apiUtils';
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  Wand2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UploadedFileInfo {
  id: number;
  name: string;
  file_type: string;
  file_size: number;
  headers: string[] | null;
  row_count: number | null;
  uploaded_at: string;
  file_url: string;
}

interface ModificationResult {
  modification: {
    column_name: string;
    regex_pattern: string;
    replacement: string;
    description: string;
    confidence: number;
  };
  preview: {
    data: Record<string, unknown>[];
    stats: {
      total_rows: number;
      modified_rows: number;
      modification_rate: number;
      pattern: string;
      replacement: string;
      error?: string;
    };
    columns: string[];
  };
}

interface ProcessedFileInfo {
  id: number;
  name: string;
  file_url: string;
  created_at: string;
  stats: {
    total_rows: number;
    modified_rows: number;
  };
  modification: {
    column_name: string;
    description: string;
  };
}

interface FileInfoProps {
  file: UploadedFileInfo;
  modificationResult: ModificationResult | null;
  error: string;
  onClearModification: () => void;
  onClearError: () => void;
}

interface OriginalFilePreview {
  data: Record<string, unknown>[];
  columns: string[];
  total_rows: number;
}

export function DataPreview({
  file,
  modificationResult,
  error,
  onClearModification,
  onClearError,
}: FileInfoProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFileInfo[]>([]);
  const [originalPreview, setOriginalPreview] =
    useState<OriginalFilePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load original file preview when component mounts
  useEffect(() => {
    const loadOriginalPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const response = await fetch(buildFileApiUrl(file.id, 'preview'));
        if (response.ok) {
          const data = await response.json();
          setOriginalPreview(data);
        }
      } catch (error) {
        console.error('Failed to load file preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    loadOriginalPreview();
  }, [file.id]);

  const handleApplyModification = async () => {
    if (!modificationResult) return;

    setIsApplying(true);
    onClearError(); // Clear any previous errors

    try {
      const response = await fetch(buildFileApiUrl(file.id, 'apply'), {
        method: 'POST',
        headers: createApiHeaders(),
        body: JSON.stringify({
          modification: modificationResult.modification,
        }),
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(response);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Add the processed file to our list instead of auto-downloading
      if (result.processed_file) {
        const processedFileInfo: ProcessedFileInfo = {
          id: result.processed_file.id,
          name: result.processed_file.name,
          file_url: result.processed_file.file_url,
          created_at: new Date().toISOString(),
          stats: {
            total_rows: result.stats.total_rows,
            modified_rows: result.stats.modified_rows,
          },
          modification: {
            column_name: modificationResult.modification.column_name,
            description: modificationResult.modification.description,
          },
        };

        setProcessedFiles((prev) => [processedFileInfo, ...prev]);
      }

      // Reset the form
      onClearModification();

      // Clear any previous errors
      onClearError();
    } catch (err) {
      onClearError();
      onClearModification();
      // Handle error - could be shown in a toast or error state
      console.error('Application failed:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {modificationResult
              ? 'Modified Data Preview'
              : 'Original Data Preview'}
          </CardTitle>
          <CardDescription>
            {modificationResult
              ? 'Review the changes before applying to the entire file'
              : 'Preview of your uploaded file data'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Modification Details - only show when there's a modification result */}
          {modificationResult && (
            <div className="space-y-2">
              <h4 className="font-medium">Modification Details</h4>
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p>
                  <span className="font-medium">Column:</span>{' '}
                  {modificationResult.modification.column_name}
                </p>
                <p>
                  <span className="font-medium">Pattern:</span>{' '}
                  <code className="bg-background px-1 rounded">
                    {modificationResult.modification.regex_pattern}
                  </code>
                </p>
                <p>
                  <span className="font-medium">Replacement:</span>{' '}
                  <code className="bg-background px-1 rounded">
                    {modificationResult.modification.replacement}
                  </code>
                </p>
                <p>
                  <span className="font-medium">Description:</span>{' '}
                  {modificationResult.modification.description}
                </p>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Confidence:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      modificationResult.modification.confidence > 0.8
                        ? 'bg-green-100 text-green-800'
                        : modificationResult.modification.confidence > 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {Math.round(
                      modificationResult.modification.confidence * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats - show modification stats or original file stats */}
          {modificationResult ? (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <strong>{modificationResult.preview.stats.total_rows}</strong>{' '}
                preview rows
              </span>
              <span>
                <strong>
                  {modificationResult.preview.stats.modified_rows}
                </strong>{' '}
                modified
              </span>
              <span>
                <strong>
                  {Math.round(
                    modificationResult.preview.stats.modification_rate * 100
                  )}
                  %
                </strong>{' '}
                change rate
              </span>
            </div>
          ) : (
            originalPreview && <div />
          )}

          {/* Data Table - show modified data or original data */}
          <div>
            <h4 className="font-medium mb-2">
              {modificationResult
                ? 'Modified Data Preview (First 10 rows)'
                : 'Original Data (First 10 rows)'}
            </h4>

            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading preview...
                </div>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {(modificationResult
                          ? modificationResult.preview.columns
                          : originalPreview?.columns || []
                        ).map((col, index) => (
                          <th
                            key={index}
                            className="px-3 py-2 text-left font-medium"
                          >
                            {col}
                            {modificationResult &&
                              col ===
                                modificationResult.modification.column_name && (
                                <span className="ml-1 text-xs bg-primary text-primary-foreground px-1 rounded">
                                  Modified
                                </span>
                              )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(modificationResult
                        ? modificationResult.preview.data
                        : originalPreview?.data || []
                      )
                        .slice(0, 10)
                        .map((row, index) => (
                          <tr key={index} className="border-t">
                            {(modificationResult
                              ? modificationResult.preview.columns
                              : originalPreview?.columns || []
                            ).map((col, colIndex) => (
                              <td key={colIndex} className="px-3 py-2">
                                {String(row[col] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - only show when there's a modification result */}
          {modificationResult && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleApplyModification}
                disabled={
                  isApplying || modificationResult.modification.confidence < 0.3
                }
                className="flex items-center gap-2"
              >
                {isApplying ? (
                  <>
                    <Wand2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Apply to Entire File
                  </>
                )}
              </Button>

              <Button onClick={onClearModification} variant="outline">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Low confidence warning */}
          {modificationResult &&
            modificationResult.modification.confidence < 0.3 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Low Confidence:</strong> Rhombus AI is not very
                  confident about this modification. Please review the preview
                  carefully or try rephrasing your instruction.
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Success Display */}
      {/* {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Success</p>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Files */}
      {processedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Processed Files
            </CardTitle>
            <CardDescription>
              Download your processed files from the modifications you've
              applied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {processedFiles.map((processedFile, index) => (
              <div
                key={processedFile.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">
                      {processedFile.name}
                    </span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    {processedFile.modification.description}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Modified {processedFile.stats.modified_rows} out of{' '}
                    {processedFile.stats.total_rows} rows in column '
                    {processedFile.modification.column_name}'
                  </p>
                </div>
                <Button
                  onClick={() => window.open(processedFile.file_url, '_blank')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
