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
import { Loader2, Pencil } from 'lucide-react';
import type { Project, SubProject } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { updateSubProject } from '@/lib/actions/project';

const subProjectSchema = z.object({
  name: z.string().min(1, 'Sub-project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  status: z.enum(['On Track', 'At Risk', 'Off Track', 'Completed']),
});

type SubProjectFormValues = z.infer<typeof subProjectSchema>;

type EditSubProjectDialogProps = {
  projectId: string;
  projectType: Project['projectType'];
  subProject: SubProject;
  onSubProjectUpdate: (newSubProject: SubProject) => void;
};

export function EditSubProjectDialog({ projectId, projectType, subProject, onSubProjectUpdate }: EditSubProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SubProjectFormValues>({
    resolver: zodResolver(subProjectSchema),
    defaultValues: {
      name: subProject.name,
      description: subProject.description,
      status: subProject.status,
    },
  });

  const onSubmit = async (data: SubProjectFormValues) => {
    setIsSubmitting(true);
    const updatedSubProject: SubProject = {
      ...subProject,
      ...data,
    };
    
    const result = await updateSubProject(projectId, updatedSubProject, projectType);
    setIsSubmitting(false);

    if (result.success) {
      onSubProjectUpdate(updatedSubProject);
      toast({
        title: 'Sub-Project Updated',
        description: `"${data.name}" has been successfully updated.`,
      });
      setOpen(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to update sub-project.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Sub-Project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Sub-Project</DialogTitle>
          <DialogDescription>
            Make changes to the sub-project. Click save when you're done.
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
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="On Track">On Track</SelectItem>
                      <SelectItem value="At Risk">At Risk</SelectItem>
                      <SelectItem value="Off Track">Off Track</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
