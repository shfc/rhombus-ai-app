import { Card, CardContent } from '@/components/ui/card';
import { formatFileSize } from '@/utils/fileUtils';
import { FileText } from 'lucide-react';

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

interface FileInfoSummaryProps {
  file: UploadedFileInfo;
  onUploadDifferentFile: () => void;
}

export function FileInfoSummary({
  file,
  onUploadDifferentFile,
}: FileInfoSummaryProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* File Info Header with Upload Different File Button */}
          <div className="flex items-center justify-between">
            {/* <h3 className="font-medium text-lg">Uploaded File</h3> */}
            {/* <Button 
              onClick={onUploadDifferentFile}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Different File
            </Button> */}

            {/* <h2 className="text-xl font-semibold">File Info</h2> */}
            <button
              onClick={onUploadDifferentFile}
              className="text-sm text-muted-foreground hover:text-foreground underline ml-auto"
            >
              Upload a different file
            </button>
          </div>

          {/* Concise File Info */}
          <div className="space-y-2 bg-muted p-3 rounded-md">
            {/* First line: name, size, columns, rows */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {file.name}
              </span>
              <span className="text-muted-foreground">
                {formatFileSize(file.file_size)}
              </span>
              <span className="text-muted-foreground">
                {file.headers?.length || 0} columns
              </span>
              <span className="text-muted-foreground">
                {file.row_count?.toLocaleString() || 0} rows
              </span>
            </div>

            {/* Second line: headers */}
            {file.headers && file.headers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.headers.map((header, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-background text-foreground rounded text-xs font-mono"
                  >
                    {header}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
