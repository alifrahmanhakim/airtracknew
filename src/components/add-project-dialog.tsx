
'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { Project, User } from '@/lib/types';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';
import { addProject } from '@/lib/actions';
import { findUserById } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
  projectType: z.enum(['Rulemaking', 'Tim Kerja'], { required_error: 'You must select a project type.' }),
  annex: z.string().optional(),
  casr: z.string().optional(),
  tags: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type AddProjectDialogProps = {
  allUsers: User[];
};

export function AddProjectDialog({ allUsers }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const userOptions: MultiSelectOption[] = allUsers.map(user => ({
    value: user.id,
    label: user.name,
  }));

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      team: [],
      projectType: 'Tim Kerja',
    },
  });

  const projectType = form.watch('projectType');

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    
    const ownerId = localStorage.getItem('loggedInUserId');
    if (!ownerId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not identify the current user. Please log in again.',
        });
        setIsSubmitting(false);
        return;
    }

    const teamMembers = data.team
      .map(userId => findUserById(userId))
      .filter((user): user is User => user !== undefined);

    const newProjectData: Omit<Project, 'id'> = {
      name: data.name,
      description: data.description,
      ownerId: ownerId,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
      status: 'On Track',
      team: teamMembers,
      tasks: [],
      subProjects: [],
      documents: [],
      notes: '',
      projectType: data.projectType,
      annex: data.annex,
      casr: data.casr,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
    };
    
    const result = await addProject(newProjectData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Project Added',
        description: `"${data.name}" has been successfully created.`,
      });
      setOpen(false);
      form.reset();
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to create the project.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the details for the new project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-2">
            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Project Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Tim Kerja" />
                        </FormControl>
                        <FormLabel className="font-normal">Tim Kerja</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Rulemaking" />
                        </FormControl>
                        <FormLabel className="font-normal">Rulemaking</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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

            {projectType === 'Rulemaking' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Popover>
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
                    <Popover>
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
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., High Priority, Core, Technical" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
