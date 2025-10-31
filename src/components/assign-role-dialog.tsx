
'use client';

import * as React from 'react';
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
import type { User } from '@/lib/types';
import { Loader2, UserCog } from 'lucide-react';
import { updateUser } from '@/lib/actions/user';
import { userDepartments } from '@/lib/data';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  role: z.enum(['Administrator', 'Sub-Directorate Head', 'Team Lead', 'PIC', 'PIC Assistant', 'Functional']),
  department: z.enum(['Pegawai STD', 'PEL', 'AIR', 'SPU', 'OPS', 'DGCA', 'K/L lain']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AssignRoleDialogProps = {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  isAdmin: boolean;
};

const baseRoles: User['role'][] = ['Team Lead', 'PIC', 'PIC Assistant', 'Functional'];
const adminRoles: User['role'][] = ['Administrator', 'Sub-Directorate Head'];

export function AssignRoleDialog({ user, onUserUpdate, isAdmin }: AssignRoleDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      role: user.role,
      department: user.department || undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (data.role === user.role && data.department === user.department && data.name === user.name) {
      setOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    const result = await updateUser(user.id, data);
    setIsSubmitting(false);

    if (result.success) {
      onUserUpdate({ ...user, ...data });
      toast({
        title: 'User Updated',
        description: `${user.name}'s profile has been updated.`,
      });
      setOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update user.',
      });
    }
  };

  const availableRoles = isAdmin ? [...adminRoles, ...baseRoles] : baseRoles;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="mr-2 h-4 w-4" />
          Edit User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>
            Change the role and department for this user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
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
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userDepartments.map((dep) => (
                        <SelectItem key={dep} value={dep}>
                          {dep}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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
