
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { RulemakingRecord } from '@/lib/types';
import { RulemakingForm } from './rulemaking-form';
import { cn } from '@/lib/utils';

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
            <DialogContent className={cn(
                "sm:max-w-4xl max-h-[90vh] flex flex-col",
                "bg-gradient-to-br from-background via-muted/50 to-background"
            )}>
                <DialogHeader>
                    <div>
                        <DialogTitle>Edit Record</DialogTitle>
                        <DialogDescription>
                            Update the details for "{record.perihal.substring(0, 50)}...".
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <ScrollArea className="h-[65vh] pr-6 -mr-6 flex-grow">
                    <div className="py-4">
                      <RulemakingForm record={record} onFormSubmit={handleFormSubmit} />
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t flex-shrink-0 justify-between">
                    <Button
                        variant="destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(record);
                            onOpenChange(false);
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button type="submit" form={`rulemaking-form-${record.id}`}>Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
