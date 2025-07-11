
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import type { SubProject } from '@/lib/types';
import { addSubProject } from '@/lib/actions';

const subProjectSchema = z.object({
  name: z.string().min(1, 'Sub-project name is required.'),
  description: z.string().min(1, 'Description is required.'),
});

type SubProjectFormValues = z.infer<typeof subProjectSchema>;

type AddSubProjectDialogProps = {
  projectId: string;
  onSubProjectAdd: (newSubProject: SubProject) => void;
};

export function AddSubProjectDialog({ projectId, onSubProjectAdd }: AddSubProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SubProjectFormValues>({
    resolver: zodResolver(subProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: SubProjectFormValues) => {
    setIsSubmitting(true);
    const newSubProject: SubProject = {
      id: `subproj-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: 'On Track', 
    };
    
    const result = await addSubProject(projectId, newSubProject);
    setIsSubmitting(false);

    if (result.success) {
      onSubProjectAdd(newSubProject);
      toast({
        title: 'Sub-Project Added',
        description: `"${data.name}" has been successfully added.`,
      });
      setOpen(false);
      form.reset();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to add sub-project.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Sub-Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Sub-Project</DialogTitle>
          <DialogDescription>
            Fill in the details for your new sub-project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Sub-Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
