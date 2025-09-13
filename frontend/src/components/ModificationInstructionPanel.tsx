import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  buildFileApiUrl,
  createApiHeaders,
  handleApiError,
} from '@/utils/apiUtils';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';

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

interface ModificationInstructionPanelProps {
  fileId?: number;
  onModificationResult: (result: ModificationResult | null) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function ModificationInstructionPanel({
  fileId,
  onModificationResult,
  onError,
  disabled = false,
}: ModificationInstructionPanelProps) {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleModifyColumn = async () => {
    if (!instruction.trim() || !fileId) return;

    setIsProcessing(true);
    onError(''); // Clear any previous errors

    try {
      const response = await fetch(buildFileApiUrl(fileId, 'modify'), {
        method: 'POST',
        headers: createApiHeaders(),
        body: JSON.stringify({
          instruction: instruction.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = await handleApiError(response);
        throw new Error(errorMessage);
      }

      onModificationResult(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInstruction('');
    onModificationResult(null);
    onError('');
  };

  return (
    <Card className="h-fit sticky top-4 w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Modify Column Data
        </CardTitle>
        <CardDescription>
          Describe how you want to modify a specific column using natural
          language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled && !fileId && (
          <div className="p-3 bg-muted rounded-md border-2 border-dashed border-muted-foreground/20">
            <p className="text-sm text-muted-foreground text-center">
              Upload a file to start modifying column data
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="instruction">Modification Instruction</Label>
          <textarea
            id="instruction"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
            placeholder="e.g., Find email addresses in the Email column and replace them with 'REDACTED'."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleModifyColumn();
              }
            }}
            disabled={isProcessing || disabled}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleModifyColumn}
            disabled={
              !instruction.trim() || isProcessing || disabled || !fileId
            }
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Preview
              </>
            )}
          </Button>

          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
