
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
import { Pencil } from 'lucide-react';
import type { SubProject } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const subProjectSchema = z.object({
  name: z.string().min(1, 'Nama sub-proyek harus diisi.'),
  description: z.string().min(1, 'Deskripsi harus diisi.'),
  status: z.enum(['Sesuai Jalur', 'Beresiko', 'Keluar Jalur', 'Selesai']),
});

type SubProjectFormValues = z.infer<typeof subProjectSchema>;

type EditSubProjectDialogProps = {
  subProject: SubProject;
  onSubProjectUpdate: (newSubProject: SubProject) => void;
};

export function EditSubProjectDialog({ subProject, onSubProjectUpdate }: EditSubProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SubProjectFormValues>({
    resolver: zodResolver(subProjectSchema),
    defaultValues: {
      name: subProject.name,
      description: subProject.description,
      status: subProject.status,
    },
  });

  const onSubmit = (data: SubProjectFormValues) => {
    const updatedSubProject: SubProject = {
      ...subProject,
      ...data,
    };
    onSubProjectUpdate(updatedSubProject);
    toast({
      title: 'Sub-Proyek Diperbarui',
      description: `"${data.name}" berhasil diperbarui.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit Sub-Proyek</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Sub-Proyek</DialogTitle>
          <DialogDescription>
            Lakukan perubahan pada sub-proyek. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sub-Proyek</FormLabel>
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
            <DialogFooter>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
