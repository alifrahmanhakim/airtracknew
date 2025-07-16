
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils';
import { Eraser, Save } from 'lucide-react';

interface SignaturePadDialogProps {
  onSave: (signature: string) => void;
  trigger: React.ReactNode;
}

export function SignaturePadDialog({ onSave, trigger }: SignaturePadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const sigPad = React.useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigPad.current?.clear();
  };

  const handleSave = () => {
    if (sigPad.current?.isEmpty()) {
      onSave('');
    } else {
      const dataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
      if(dataUrl) {
          onSave(dataUrl);
      }
    }
    setOpen(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Clear the canvas when the dialog is closed without saving
    if (!isOpen) {
        handleClear();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draw Signature</DialogTitle>
          <DialogDescription>
            Use your mouse or touchscreen to draw your signature below.
          </DialogDescription>
        </DialogHeader>
        <div className="relative mx-auto mt-4 w-full h-48 rounded-md border bg-background">
          <SignatureCanvas
            ref={sigPad}
            penColor="black"
            canvasProps={{
              className: 'w-full h-full',
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            <Eraser className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
