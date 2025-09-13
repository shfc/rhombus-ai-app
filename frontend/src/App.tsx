import { useState } from 'react';
import { DataPreview } from './components/DataPreview';
import { FileInfoSummary } from './components/FileInfoSummary';
import { FileUpload } from './components/FileUpload';
import { ModificationInstructionPanel } from './components/ModificationInstructionPanel';
import { Navbar } from './components/Navbar';

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

function App() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(
    null
  );
  const [modificationResult, setModificationResult] =
    useState<ModificationResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUploaded = (file: UploadedFileInfo) => {
    setUploadedFile(file);
    setModificationResult(null);
    setError('');
  };

  const handleNewFile = () => {
    setUploadedFile(null);
    setModificationResult(null);
    setError('');
  };

  const handleModificationResult = (result: ModificationResult | null) => {
    setModificationResult(result);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-7 gap-6">
          {/* Left side - Main content */}
          <div className="col-span-5 space-y-6">
            {uploadedFile ? (
              <>
                {/* <h2 className="text-xl font-semibold">File Processing</h2> */}
                <DataPreview
                  file={uploadedFile}
                  modificationResult={modificationResult}
                  error={error}
                  onClearModification={() => setModificationResult(null)}
                  onClearError={() => setError('')}
                />
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4">
                    Welcome to Rhombus AI
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Upload a file to get started with intelligent data
                    processing
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Use the upload panel on the right to begin →
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Upload and Modification panel */}
          <div className="col-span-2 space-y-6">
            {/* Upload section or File Info Summary */}
            <div>
              {uploadedFile ? (
                <FileInfoSummary
                  file={uploadedFile}
                  onUploadDifferentFile={handleNewFile}
                />
              ) : (
                <FileUpload onFileUploaded={handleFileUploaded} />
              )}
            </div>

            {/* Modification panel */}
            <div>
              <ModificationInstructionPanel
                fileId={uploadedFile?.id}
                onModificationResult={handleModificationResult}
                onError={handleError}
                disabled={!uploadedFile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
