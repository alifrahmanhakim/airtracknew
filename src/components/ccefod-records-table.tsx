
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CcefodFormValues } from './ccefod-form';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type CcefodRecordsTableProps = {
  records: CcefodFormValues[];
};

export function CcefodRecordsTable({ records }: CcefodRecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
        <p className="font-semibold">No records found.</p>
        <p className="text-sm">Submit the form to add a new record.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Annex</TableHead>
              <TableHead>Annex Reference</TableHead>
              <TableHead>Implementation Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{record.annex}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{record.annex}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>{record.annexReference}</TableCell>
                <TableCell>{record.implementationLevel}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.status === 'Final'
                        ? 'default'
                        : record.status === 'Draft'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
