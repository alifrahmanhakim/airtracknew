
'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, FileSpreadsheet } from 'lucide-react';
import type { PqFormValues } from './pqs-shared-form-fields';
import { importPqRecords } from '@/lib/actions';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const csvHeaders = [
    "pqNumber", "protocolQuestion", "guidance", "icaoReferences", 
    "ppq", "criticalElement", "remarks", "evidence", "answer", "poc", 
    "icaoStatus", "cap", "sspComponent", "status"
];

export function ImportPqsCsvDialog() {
  const [open, setOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<PqFormValues[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setFileName(file.name);

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      escapeChar: '"',
      complete: (results) => {
        if (results.errors.length) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setParsedData([]);
        } else {
          // Validate headers
          const headers = results.meta.fields || [];
          const missingHeaders = csvHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
              setError(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
              setParsedData([]);
          } else {
              setParsedData(results.data as PqFormValues[]);
          }
        }
        setIsParsing(false);
      },
      error: (err) => {
        setError(`Failed to parse file: ${err.message}`);
        setIsParsing(false);
      },
    });
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No data to import',
            description: 'Please select a valid CSV file with data.',
        });
        return;
    }

    setIsSubmitting(true);
    const result = await importPqRecords(parsedData);
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: 'Import Successful!',
            description: `${result.count} records have been imported.`,
        });
        resetState();
    } else {
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: result.error || 'An unknown error occurred.',
        });
    }
  }

  const resetState = () => {
    setOpen(false);
    setIsParsing(false);
    setIsSubmitting(false);
    setFileName('');
    setParsedData([]);
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UploadCloud className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import PQs from CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to import. The file must contain the following headers: {csvHeaders.join(', ')}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-full gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={isParsing || isSubmitting}/>
            </div>

            {isParsing && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Parsing file...</div>}

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {parsedData.length > 0 && (
                <>
                    <p className='text-sm font-medium'>Found {parsedData.length} records in <span className='font-bold'>{fileName}</span>. Please review the data below before importing.</p>
                    <div className="flex-grow border rounded-md relative">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className='sticky top-0 bg-muted/80 backdrop-blur-sm'>
                                    <TableRow>
                                        <TableHead>PQ Number</TableHead>
                                        <TableHead>Protocol Question</TableHead>
                                        <TableHead>Critical Element</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{row.pqNumber}</TableCell>
                                            <TableCell className="font-medium truncate max-w-xs">{row.protocolQuestion}</TableCell>
                                            <TableCell>{row.criticalElement}</TableCell>
                                            <TableCell>{row.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </>
            )}

            {parsedData.length === 0 && !isParsing && !error && (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg">
                    <FileSpreadsheet className="h-12 w-12 mb-4" />
                    <p className="font-semibold">Ready to Import</p>
                    <p className="text-sm">Please select a CSV file to begin.</p>
                </div>
            )}
        </div>
        
        <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleImport} disabled={isSubmitting || parsedData.length === 0 || !!error}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Import {parsedData.length > 0 ? `${parsedData.length} Records` : ''}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
