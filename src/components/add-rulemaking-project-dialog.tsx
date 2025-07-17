
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
import type { User } from '@/lib/types';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';
import { addRulemakingProject } from '@/lib/actions';
import { Checkbox } from './ui/checkbox';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().min(1, 'Description is required.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  team: z.array(z.string()).min(1, 'At least one team member must be selected.'),
  annex: z.string().min(1, 'Annex is required.'),
  casr: z.string().min(1, 'CASR is required.'),
  tags: z.string().optional(),
  isHighPriority: z.boolean().default(false),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type AddRulemakingProjectDialogProps = {
  allUsers: User[];
};

export function AddRulemakingProjectDialog({ allUsers }: AddRulemakingProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const userOptions: MultiSelectOption[] = allUsers.map(user => ({
    value: user.id,
    label: user.name || user.email || user.id,
  }));

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      team: [],
      annex: '',
      casr: '',
      tags: '',
      isHighPriority: false,
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    
    // Asumsi `ownerId` akan diambil dari sesi pengguna di server,
    // jadi kita tidak perlu lagi mengambilnya dari localStorage.
    // Ini lebih aman.
    const ownerId = "some-placeholder-id"; // Ini akan diganti di server action jika perlu

    const teamMembers = data.team
      .map(userId => allUsers.find(u => u.id === userId))
      .filter((user): user is User => user !== undefined)
      .map(user => ({ // Pastikan struktur objek sesuai
          id: user.id,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl
      }));

    if (teamMembers.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Team is empty',
            description: 'Please select at least one team member.',
        });
        setIsSubmitting(false);
        return;
    }

    const highPriorityTag = 'High Priority';
    const baseTags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    let finalTags = baseTags.filter(tag => tag.toLowerCase() !== highPriorityTag.toLowerCase());
    if (data.isHighPriority) {
        finalTags.push(highPriorityTag);
    }

    const newProjectData = {
      name: data.name,
      description: data.description,
      ownerId: teamMembers[0].id, // Default owner ke anggota tim pertama
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
      status: 'On Track' as const,
      team: teamMembers,
      annex: data.annex,
      casr: data.casr,
      tags: finalTags,
    };
    
    const result = await addRulemakingProject(newProjectData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Project Added',
        description: `"${data.name}" has been successfully created.`,
      });
      setOpen(false);
      form.reset();
      router.refresh(); // Cara Next.js modern untuk refresh data
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Project',
        description: result.error || 'An unknown error occurred on the server.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Rulemaking Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Rulemaking Project</DialogTitle>
          <DialogDescription>
            Fill in the details for the new rulemaking project.
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
            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      placeholder="Select team members..."
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                  <FormLabel>Other Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Core, Technical" {...field} />
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
