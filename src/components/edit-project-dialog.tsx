
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
  FormDescription,
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
import { CalendarIcon, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';

const projectSchema = z.object({
  name: z.string().min(1, 'Nama proyek harus diisi.'),
  description: z.string().min(1, 'Deskripsi harus diisi.'),
  status: z.enum(['Sesuai Jalur', 'Beresiko', 'Keluar Jalur', 'Selesai']),
  startDate: z.date(),
  endDate: z.date(),
  notes: z.string().optional(),
  team: z.array(z.string()).min(1, 'Minimal satu anggota tim harus dipilih.'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type EditProjectDialogProps = {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
  allUsers: User[];
};

export function EditProjectDialog({ project, onProjectUpdate, allUsers }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const userOptions: MultiSelectOption[] = allUsers.map(user => ({
    value: user.id,
    label: user.name,
  }));

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
      notes: project.notes,
      team: project.team.map(user => user.id),
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    const updatedTeam = data.team.map(userId => allUsers.find(u => u.id === userId)).filter(Boolean) as User[];
    
    const updatedProject = { 
        ...project, 
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        team: updatedTeam,
    };
    onProjectUpdate(updatedProject);
    toast({
        title: 'Proyek Diperbarui',
        description: `"${project.name}" berhasil diperbarui.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Proyek
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Proyek</DialogTitle>
          <DialogDescription>
            Lakukan perubahan pada proyek Anda di sini. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Proyek</FormLabel>
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
                  <FormLabel>Deskripsi</FormLabel>
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
                    <FormLabel>Tanggal Mulai</FormLabel>
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
                              <span>Pilih tanggal</span>
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
                    <FormLabel>Tanggal Selesai</FormLabel>
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
                              <span>Pilih tanggal</span>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sesuai Jalur">Sesuai Jalur</SelectItem>
                      <SelectItem value="Beresiko">Beresiko</SelectItem>
                      <SelectItem value="Keluar Jalur">Keluar Jalur</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
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
                  <FormLabel>Anggota Tim</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Pilih anggota tim..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Tambahkan catatan proyek yang relevan di sini..."/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Simpan perubahan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
