
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Task, User, Attachment } from '@/lib/types';
import { CalendarIcon, Loader2, Pencil, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format, parseISO } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { updateTask } from '@/lib/actions';
import { Separator } from './ui/separator';

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required.'),
  url: z.string().url('Must be a valid URL.'),
});

const taskSchema = z.object({
  title: z.string().min(1, 'Task name is required.'),
  assigneeId: z.string().min(1, 'Assignee is required.'),
  startDate: z.date({ required_error: "Start date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  status: z.enum(['Done', 'In Progress', 'To Do', 'Blocked']),
  doneDate: z.date().optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine(data => data.dueDate >= data.startDate, {
  message: "End date cannot be earlier than start date.",
  path: ["dueDate"],
});

type TaskFormValues = z.infer<typeof taskSchema>;

type EditTaskDialogProps = {
  projectId: string;
  projectType: 'Rulemaking' | 'Tim Kerja';
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
  teamMembers: User[];
};

export function EditTaskDialog({ projectId, projectType, task, onTaskUpdate, teamMembers }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      assigneeId: task.assigneeId,
      startDate: parseISO(task.startDate || task.dueDate),
      dueDate: parseISO(task.dueDate),
      status: task.status,
      doneDate: task.doneDate ? parseISO(task.doneDate) : undefined,
      attachments: task.attachments || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'attachments',
  });
  
  const watchedStatus = form.watch('status');
  
  const handleStatusChange = (status: Task['status']) => {
    form.setValue('status', status);
    if (status === 'Done' && !form.getValues('doneDate')) {
        form.setValue('doneDate', new Date());
    }
  }


  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    const updatedTask: Task = {
      ...task,
      ...data,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      doneDate: data.doneDate ? format(data.doneDate, 'yyyy-MM-dd') : undefined,
      attachments: data.attachments,
    };
    
    const result = await updateTask(projectId, updatedTask, projectType);
    setIsSubmitting(false);

    if (result.success) {
      onTaskUpdate(updatedTask);
      toast({
        title: 'Task Updated',
        description: `"${data.title}" has been successfully updated.`,
      });
      setOpen(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to update task.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Task</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to the task. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={handleStatusChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {watchedStatus === 'Done' && (
                    <FormField
                        control={form.control}
                        name="doneDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Completion Date</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, 'PPP')
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>

            <Separator />

            <div>
              <FormLabel>Attachments (e.g., Google Drive, OneDrive links)</FormLabel>
              <div className="space-y-3 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                     <LinkIcon className="h-4 w-4 text-muted-foreground" />
                     <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                        <FormField
                            control={form.control}
                            name={`attachments.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input placeholder="Attachment Name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`attachments.${index}.url`}
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className='text-destructive hover:text-destructive'>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: `att-${Date.now()}`, name: '', url: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>
            </div>

            <DialogFooter className='pt-4'>
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

    