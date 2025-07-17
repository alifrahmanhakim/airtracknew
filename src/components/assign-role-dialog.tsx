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
import { updateUserRole } from '@/lib/actions/user';

const roleSchema = z.object({
  role: z.enum(['Sub-Directorate Head', 'Team Lead', 'PIC', 'PIC Assistant', 'Functional']),
});

type RoleFormValues = z.infer<typeof roleSchema>;

type AssignRoleDialogProps = {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
};

const userRoles: User['role'][] = ['Sub-Directorate Head', 'Team Lead', 'PIC', 'PIC Assistant', 'Functional'];

export function AssignRoleDialog({ user, onUserUpdate }: AssignRoleDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: user.role,
    },
  });

  const onSubmit = async (data: RoleFormValues) => {
    if (data.role === user.role) {
      setOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    const result = await updateUserRole(user.id, data.role);
    setIsSubmitting(false);

    if (result.success) {
      onUserUpdate({ ...user, role: data.role });
      toast({
        title: 'Role Updated',
        description: `${user.name}'s role has been changed to ${data.role}.`,
      });
      setOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to update user role.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="mr-2 h-4 w-4" />
          Assign Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role to {user.name}</DialogTitle>
          <DialogDescription>
            Select a new role for this user. This will affect their permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                      {userRoles.map((role) => (
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
