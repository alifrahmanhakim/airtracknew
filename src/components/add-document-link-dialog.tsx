'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Link as LinkIcon } from 'lucide-react';
import type { Document as ProjectDocument, Project } from '@/lib/types';
import { addDocument } from '@/lib/actions/project';

const documentLinkSchema = z.object({
  name: z.string().min(1, 'Document name is required.'),
  url: z.string().url('Please enter a valid URL.'),
});

type DocumentLinkFormValues = z.infer<typeof documentLinkSchema>;

type AddDocumentLinkDialogProps = {
  projectId: string;
  projectType: Project['projectType'];
  onDocumentAdd: (newDocument: ProjectDocument) => void;
};

export function AddDocumentLinkDialog({ projectId, projectType, onDocumentAdd }: AddDocumentLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DocumentLinkFormValues>({
    resolver: zodResolver(documentLinkSchema),
    defaultValues: {
      name: '',
      url: '',
    },
  });

  const onSubmit = async (data: DocumentLinkFormValues) => {
    setIsSubmitting(true);
    
    const result = await addDocument(projectId, data, projectType);
    
    setIsSubmitting(false);

    if (result.success && result.data) {
      onDocumentAdd(result.data);
      toast({
        title: 'Document Link Added',
        description: `"${data.name}" has been successfully linked.`,
      });
      setOpen(false);
      form.reset();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to add document link.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Document Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Document Link</DialogTitle>
          <DialogDescription>
            Enter the name and URL of the document you want to link.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Proposal.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://docs.google.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Add Link
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
