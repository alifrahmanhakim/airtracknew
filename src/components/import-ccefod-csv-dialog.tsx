
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
import { importCcefodRecords } from '@/lib/actions/ccefod';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { CcefodRecord } from '@/lib/types';

export function ImportCcefodCsvDialog() {
  const [open, setOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<Partial<CcefodRecord>[]>([]);
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
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length) {
          const firstError = results.errors[0];
          setError(`Error parsing CSV on row ${firstError.row}: ${firstError.message}`);
          setParsedData([]);
        } else {
          // Map to ensure all fields exist, even if null/undefined from CSV
           const requiredKeys: (keyof CcefodRecord)[] = [
            'annex', 'annexReference', 'standardPractice', 'legislationReference', 'implementationLevel', 'status', 'adaPerubahan'
          ];
          const dataWithAllKeys = results.data.map(row => {
            const newRow: Partial<CcefodRecord> = {};
            requiredKeys.forEach(key => {
                newRow[key] = row[key] === undefined || row[key] === '' ? null : row[key];
            })
            return newRow;
          });
          setParsedData(dataWithAllKeys as Partial<CcefodRecord>[]);
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
    const result = await importCcefodRecords(parsedData);
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import CCEFOD Records from CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to import. Headers must match schema: annex, annexReference, standardPractice, legislationReference, implementationLevel, status, adaPerubahan, etc.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex flex-col gap-4 py-4 min-h-0">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={isParsing || isSubmitting}/>
            </div>

            {isParsing && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Parsing file...</div>}

            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            {parsedData.length > 0 && (
                <>
                    <p className='text-sm font-medium'>Found {parsedData.length} records in <span className='font-bold'>{fileName}</span>. Please review the data below before importing.</p>
                    <div className="flex-grow border rounded-md relative min-h-0">
                        <ScrollArea className="absolute inset-0">
                            <Table>
                                <TableHeader className='sticky top-0 bg-muted/80 backdrop-blur-sm z-10'>
                                    <TableRow>
                                        <TableHead>Annex</TableHead>
                                        <TableHead>Annex Ref</TableHead>
                                        <TableHead>Standard/Practice</TableHead>
                                        <TableHead>Legislation Ref</TableHead>
                                        <TableHead>Implementation</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium truncate max-w-[200px]">{row.annex || 'N/A'}</TableCell>
                                            <TableCell className="truncate max-w-[150px]">{row.annexReference  || 'N/A'}</TableCell>
                                            <TableCell className="truncate max-w-[300px]">{row.standardPractice  || 'N/A'}</TableCell>
                                            <TableCell className="truncate max-w-[200px]">{row.legislationReference  || 'N/A'}</TableCell>
                                            <TableCell>{row.implementationLevel || 'N/A'}</TableCell>
                                            <TableCell>{row.status || 'N/A'}</TableCell>
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
        
        <DialogFooter className="border-t pt-4 flex-shrink-0">
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
