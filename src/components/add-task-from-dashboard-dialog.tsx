
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import type { Task, User, Project } from '@/lib/types';
import { CalendarIcon, Loader2, Plus, GanttChartSquare, FolderKanban } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { addTask } from '@/lib/actions/project';
import { Combobox } from './ui/combobox';
import { rulemakingTaskOptions, timKerjaTaskOptions } from '@/lib/data';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const taskSchema = z.object({
  title: z.string().min(1, 'Task name is required.'),
  assigneeIds: z.array(z.string()).min(1, 'At least one assignee is required.'),
  startDate: z.date({ required_error: "Start date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  namaSurat: z.string().optional(),
  tanggalPelaksanaan: z.date().optional(),
}).refine(data => data.dueDate >= data.startDate, {
  message: "End date cannot be earlier than start date.",
  path: ["dueDate"],
});

type TaskFormValues = z.infer<typeof taskSchema>;

type AddTaskFromDashboardDialogProps = {
  teamMembers: User[];
};

export function AddTaskFromDashboardDialog({ teamMembers }: AddTaskFromDashboardDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [allProjects, setAllProjects] = React.useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  React.useEffect(() => {
    if (!open) return; // Only fetch when dialog is open

    const timKerjaUnsub = onSnapshot(collection(db, 'timKerjaProjects'), (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, projectType: 'Tim Kerja' } as Project));
        setAllProjects(prev => [...prev.filter(p => p.projectType !== 'Tim Kerja'), ...projects]);
    });
    
    const rulemakingUnsub = onSnapshot(collection(db, 'rulemakingProjects'), (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, projectType: 'Rulemaking' } as Project));
        setAllProjects(prev => [...prev.filter(p => p.projectType !== 'Rulemaking'), ...projects]);
    });

    return () => {
        timKerjaUnsub();
        rulemakingUnsub();
    }
  }, [open]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      assigneeIds: [],
      namaSurat: '',
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      assigneeIds: data.assigneeIds,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      status: 'To Do',
      parentId: null,
      subTasks: [],
      namaSurat: data.namaSurat,
      tanggalPelaksanaan: data.tanggalPelaksanaan ? format(data.tanggalPelaksanaan, 'yyyy-MM-dd') : undefined,
    };
    
    const result = await addTask(selectedProject.id, newTask, selectedProject.projectType, null, '');
    setIsSubmitting(false);

    if (result.success && result.tasks) {
      toast({
        title: 'Task Added',
        description: `"${data.title}" has been added to project "${selectedProject.name}".`,
      });
      setOpen(false);
      form.reset();
      setSelectedProject(null);
      router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to add task.',
        });
    }
  };
  
  const userOptions: MultiSelectOption[] = teamMembers.map(user => ({
    value: user.id,
    label: user.name,
  }));
  
  const taskOptions = selectedProject?.projectType === 'Rulemaking' ? rulemakingTaskOptions : timKerjaTaskOptions;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GanttChartSquare className="h-6 w-6" /> Add New Task
          </DialogTitle>
          <DialogDescription>
            First select a project, then fill in the task details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                    <FolderKanban className="h-4 w-4" /> Step 1: Select Project
                </Label>
                 <Select onValueChange={(projectId) => setSelectedProject(allProjects.find(p => p.id === projectId) || null)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a project to add the task to..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allProjects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name} ({project.projectType})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
           
            {selectedProject && (
                <div className="pt-4 border-t">
                     <p className="font-semibold mb-4 flex items-center gap-2">
                        <GanttChartSquare className="h-4 w-4" /> Step 2: Task Details
                    </p>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Task Name</FormLabel>
                            <Combobox 
                                options={taskOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select a task or type a new one..."
                            />
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
                                <Popover modal={false}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={'outline'}
                                        className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                    >
                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                                <Popover modal={false}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={'outline'}
                                        className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                    >
                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                        <FormField
                            control={form.control}
                            name="assigneeIds"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assignees</FormLabel>
                                <MultiSelect
                                options={userOptions}
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                placeholder="Select team members..."
                                />
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Separator />
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">Optional Details</p>
                            <FormField
                                control={form.control}
                                name="namaSurat"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nama Surat</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Undangan Rapat..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="tanggalPelaksanaan"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Pelaksanaan</FormLabel>
                                    <Popover modal={false}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={'outline'}
                                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                        >
                                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                         <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Task
                            </Button>
                        </DialogFooter>
                    </form>
                    </Form>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
