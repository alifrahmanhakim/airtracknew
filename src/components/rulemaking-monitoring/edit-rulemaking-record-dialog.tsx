
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { RulemakingRecord } from '@/lib/types';
import { RulemakingForm } from './rulemaking-form';

interface EditRulemakingRecordDialogProps {
  record: RulemakingRecord;
  onRecordUpdate: (updatedRecord: RulemakingRecord) => void;
  onDelete: (record: RulemakingRecord) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRulemakingRecordDialog({ record, onRecordUpdate, onDelete, open, onOpenChange }: EditRulemakingRecordDialogProps) {

    const handleFormSubmit = (updatedRecord: RulemakingRecord) => {
        onRecordUpdate(updatedRecord);
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onOpenChange(true); }}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                <DialogHeader className="flex-row items-start justify-between">
                    <div>
                        <DialogTitle>Edit Record</DialogTitle>
                        <DialogDescription>
                            Update the details for "{record.perihal.substring(0, 50)}...".
                        </DialogDescription>
                    </div>
                     <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(record);
                            onOpenChange(false);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </DialogHeader>
                <ScrollArea className="h-[65vh] pr-6 -mr-6">
                    <div className="py-4">
                      <RulemakingForm record={record} onFormSubmit={handleFormSubmit} />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
