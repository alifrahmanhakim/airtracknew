
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Task, User } from '@/lib/types';
import { CalendarIcon, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format, parseISO } from 'date-fns';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(1, 'Nama tugas harus diisi.'),
  assigneeId: z.string().min(1, 'Penanggung jawab harus dipilih.'),
  dueDate: z.date({ required_error: "Batas waktu harus diisi." }),
  status: z.enum(['Selesai', 'Sedang Berjalan', 'Akan Dikerjakan', 'Terhambat']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type EditTaskDialogProps = {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
  teamMembers: User[];
};

export function EditTaskDialog({ task, onTaskUpdate, teamMembers }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      assigneeId: task.assigneeId,
      dueDate: parseISO(task.dueDate),
      status: task.status,
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    const updatedTask: Task = {
      ...task,
      ...data,
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
    };
    onTaskUpdate(updatedTask);
    toast({
      title: 'Tugas Diperbarui',
      description: `"${data.title}" berhasil diperbarui.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Tugas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Tugas</DialogTitle>
          <DialogDescription>
            Lakukan perubahan pada tugas. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tugas</FormLabel>
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
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penanggung Jawab</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih anggota tim" />
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
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Batas Waktu</FormLabel>
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
                      <SelectItem value="Akan Dikerjakan">Akan Dikerjakan</SelectItem>
                      <SelectItem value="Sedang Berjalan">Sedang Berjalan</SelectItem>
                      <SelectItem value="Terhambat">Terhambat</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
