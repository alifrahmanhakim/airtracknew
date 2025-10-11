
'use client';

import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Project, User } from '@/lib/types';
import { CalendarIcon, Loader2, Pencil, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format, parseISO, isAfter, differenceInDays, startOfToday } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';
import { Checkbox } from './ui/checkbox';
import { updateProject } from '@/lib/actions/project';
import { countAllTasks } from '@/lib/data-utils';
import { Badge } from './ui/badge';

const editProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  status: z.enum(['On Track', 'At Risk', 'Off Track', 'Completed']),
  startDate: z.date(),
  endDate: z.date(),
  notes: z.string().optional(),
  team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
  ownerId: z.string().min(1, 'Project Manager is required.'),
  annex: z.string().optional(),
  casr: z.string().optional(),
  casrRevision: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isHighPriority: z.boolean().default(false),
});


type ProjectFormValues = z.infer<typeof editProjectSchema>;

type EditProjectDialogProps = {
  project: Project;
  allUsers: User[];
};

const getEffectiveStatus = (project: Project): Project['status'] => {
    const { total, completed, hasCritical } = countAllTasks(project.tasks || []);
    const progress = total > 0 ? (completed / total) * 100 : 0;
  
    if (progress === 100 || project.status === 'Completed') {
      return 'Completed';
    }
  
    const today = startOfToday();
    const projectEnd = parseISO(project.endDate);
  
    if (isAfter(today, projectEnd)) {
      return 'Off Track';
    }
  
    if (hasCritical) {
      return 'At Risk';
    }
    
    const projectStart = parseISO(project.startDate);
    const totalDuration = differenceInDays(projectEnd, projectStart);
  
    if (totalDuration > 0) {
      const elapsedDuration = differenceInDays(today, projectStart);
      const timeProgress = (elapsedDuration / totalDuration) * 100;
  
      if (progress < timeProgress - 20) {
        return 'At Risk';
      }
    }
    
    return 'On Track';
};


export function EditProjectDialog({ project, allUsers }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const userOptions: MultiSelectOption[] = allUsers.map(user => ({
    value: user.id,
    label: user.name || user.email || user.id,
  }));
  
  const highPriorityTag = 'High Priority';
  
  const effectiveStatus = getEffectiveStatus(project);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description,
      status: effectiveStatus,
      startDate: parseISO(project.startDate),
      endDate: parseISO(project.endDate),
      notes: project.notes,
      team: project.team.map(user => user.id),
      ownerId: project.ownerId,
      annex: project.annex,
      casr: project.casr,
      casrRevision: project.casrRevision || '',
      tags: project.tags?.filter(t => t.toLowerCase() !== highPriorityTag.toLowerCase()) || [],
      isHighPriority: project.tags?.some(t => t.toLowerCase() === highPriorityTag.toLowerCase()),
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    
    const updatedTeam = data.team.map(userId => {
        const user = allUsers.find(u => u.id === userId);
        return {
            id: userId,
            name: user?.name || 'Unnamed User',
            role: user?.role || 'Functional',
            avatarUrl: user?.avatarUrl || `https://placehold.co/100x100.png`
        };
    });
    
    let finalTags = data.tags ? [...data.tags] : [];
    if (data.isHighPriority) {
        if (!finalTags.some(t => t.toLowerCase() === highPriorityTag.toLowerCase())) {
            finalTags.push(highPriorityTag);
        }
    } else {
        finalTags = finalTags.filter(t => t.toLowerCase() !== highPriorityTag.toLowerCase());
    }

    const projectUpdateData: Partial<Omit<Project, 'id'>> = { 
        name: data.name,
        description: data.description,
        status: effectiveStatus,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        notes: data.notes ?? '',
        team: updatedTeam,
        ownerId: data.ownerId,
        tags: finalTags,
    };

    if (project.projectType === 'Rulemaking') {
      projectUpdateData.annex = data.annex;
      projectUpdateData.casr = data.casr;
      projectUpdateData.casrRevision = data.casrRevision;
    }
    
    const result = await updateProject(project.id, project.projectType, projectUpdateData);
    
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: 'Project Updated',
            description: `"${project.name}" has been successfully updated.`,
        });
        setOpen(false);
        router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to update the project.',
        });
    }
  };

  const statusConfig: { [key in Project['status']]: { icon: React.ElementType, style: string, label: string } } = {
    'Completed': { icon: CheckCircle, style: 'border-transparent bg-green-100 text-green-800', label: 'Completed' },
    'On Track': { icon: Clock, style: 'border-transparent bg-blue-100 text-blue-800', label: 'On Track' },
    'At Risk': { icon: AlertTriangle, style: 'border-transparent bg-yellow-100 text-yellow-800', label: 'At Risk' },
    'Off Track': { icon: AlertCircle, style: 'border-transparent bg-red-100 text-red-800', label: 'Off Track' },
  };
  const currentStatusInfo = statusConfig[effectiveStatus];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {project.projectType} Project</DialogTitle>
          <DialogDescription>
            Make changes to your project here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {project.projectType === 'Rulemaking' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="annex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annex</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="casr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CASR</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 61" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="casrRevision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revisi CASR Ke</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover modal={false}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
            
             <FormItem>
                <FormLabel>Project Status</FormLabel>
                <div className="p-3 border rounded-md bg-muted/50">
                     <Badge variant="outline" className={cn("text-base font-semibold gap-2", currentStatusInfo.style)}>
                        <currentStatusInfo.icon className="h-4 w-4" />
                        {currentStatusInfo.label}
                    </Badge>
                </div>
                 <p className="text-xs text-muted-foreground">Status is determined automatically based on task progress and deadlines.</p>
            </FormItem>

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Manager</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select team members..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Other Tags</FormLabel>
                    <FormControl>
                         <MultiSelect
                            options={[
                                { value: "Core", label: "Core" },
                                { value: "Technical", label: "Technical" },
                                { value: "Operational", label: "Operational" },
                                { value: "Safety", label: "Safety" }
                            ]}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            placeholder="Select tags..."
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <FormField
              control={form.control}
              name="isHighPriority"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3 shadow-sm">
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                           Mark as High Priority
                        </FormLabel>
                    </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Add relevant project notes here..."/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
