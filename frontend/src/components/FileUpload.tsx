import { cn } from '@/lib/utils';
import {
  buildUploadApiUrl,
  createUploadFormData,
  handleApiError,
} from '@/utils/apiUtils';
import { validateFile } from '@/utils/fileUtils';
import { FileText, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

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

interface FileUploadProps {
  onFileUploaded: (file: UploadedFileInfo) => void;
  className?: string;
}

export function FileUpload({ onFileUploaded, className }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = createUploadFormData(file);

      try {
        const response = await fetch(buildUploadApiUrl(), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(response);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        onFileUploaded(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [onFileUploaded]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const validation = validateFile(file, 1024);
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        await uploadFile(file);
      } finally {
        setUploading(false);
      }
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
          uploading && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploading and processing...</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full animate-pulse"
                style={{ width: '60%' }}
              />
            </div>
          </div>
        ) : isDragActive ? (
          <p className="text-sm font-medium">Drop the file here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Supports CSV, XLSX, and XLS files (max 1GB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
