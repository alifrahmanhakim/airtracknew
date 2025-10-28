
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
import { Pencil } from 'lucide-react';
import type { RulemakingRecord } from '@/lib/types';
import { RulemakingForm } from './rulemaking-form';

interface EditRulemakingRecordDialogProps {
  record: RulemakingRecord;
}

export function EditRulemakingRecordDialog({ record }: EditRulemakingRecordDialogProps) {
    const [open, setOpen] = React.useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Record</DialogTitle>
                    <DialogDescription>
                        Update the details for "{record.perihal.substring(0, 50)}...".
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[65vh] pr-6 -mr-6">
                    <div className="py-4">
                      <RulemakingForm record={record} onFormSubmit={() => setOpen(false)} />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
