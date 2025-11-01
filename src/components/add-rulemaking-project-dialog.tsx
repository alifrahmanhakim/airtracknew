
'use client';

import { useState, useEffect } from 'react';
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
import type { User } from '@/lib/types';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';
import { addRulemakingProject } from '@/lib/actions/project';
import { Checkbox } from './ui/checkbox';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { projectSchema } from '@/lib/schemas';


type ProjectFormValues = z.infer<typeof projectSchema>;

type AddRulemakingProjectDialogProps = {
  allUsers: User[];
};

export function AddRulemakingProjectDialog({ allUsers: initialUsers }: AddRulemakingProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveUsers, setLiveUsers] = useState<User[]>(initialUsers);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setLiveUsers(usersFromDb);
    });
    return () => unsubscribe();
  }, [open]);

  const userOptions: MultiSelectOption[] = liveUsers.map(user => ({
    value: user.id,
    label: user.name || user.email || user.id,
  }));

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      jenisRegulasi: 'CASR/PKPS',
      team: [],
      annex: '',
      casr: '',
      casrRevision: '',
      tags: [],
      isHighPriority: false,
    },
  });

  const jenisRegulasi = form.watch('jenisRegulasi');

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    
    const ownerId = localStorage.getItem('loggedInUserId');
    if (!ownerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a project.',
      });
      setIsSubmitting(false);
      return;
    }
    
    const highPriorityTag = 'High Priority';
    
    let finalTags = data.tags ? [...data.tags] : [];
    if (data.isHighPriority) {
        if (!finalTags.some(tag => tag.toLowerCase() === highPriorityTag.toLowerCase())) {
            finalTags.push(highPriorityTag);
        }
    } else {
        finalTags = finalTags.filter(tag => tag.toLowerCase() !== highPriorityTag.toLowerCase());
    }

    const newProjectData = {
      ...data,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
      ownerId: ownerId,
      status: 'On Track' as const,
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
      router.refresh();
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
            <FormField
                control={form.control}
                name="jenisRegulasi"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Jenis Regulasi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Pilih jenis regulasi..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="CASR/PKPS">CASR/PKPS</SelectItem>
                                <SelectItem value="SI">SI</SelectItem>
                                <SelectItem value="AC">AC</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {jenisRegulasi === 'CASR/PKPS' && (
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
