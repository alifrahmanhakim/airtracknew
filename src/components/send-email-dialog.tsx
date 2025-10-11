
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { MultiSelect, type MultiSelectOption } from './ui/multi-select';
import { SidebarMenuButton } from './ui/sidebar';

const emailSchema = z.object({
  recipients: z.array(z.string()).min(1, 'At least one recipient is required.'),
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string().min(1, 'Email body is required.'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

type SendEmailDialogProps = {
  allUsers: User[];
  currentUser: User;
};

export function SendEmailDialog({ allUsers, currentUser }: SendEmailDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();

  const userOptions: MultiSelectOption[] = allUsers
    .filter(user => user.id !== currentUser.id && user.email)
    .map(user => ({
      value: user.email!,
      label: `${user.name} (${user.email})`,
    }));

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipients: [],
      subject: '',
      body: '',
    },
  });

  const onSubmit = (data: EmailFormValues) => {
    setIsSending(true);
    const { recipients, subject, body } = data;
    const recipientString = recipients.join(',');
    
    const mailtoLink = `mailto:${recipientString}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // This will open the user's default email client
    window.location.href = mailtoLink;
    
    setIsSending(false);
    toast({
        title: "Redirecting to Email Client",
        description: "Your default email client has been opened to send the message.",
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton>
            <MessageSquare />
            <span>Compose Email</span>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Write a message to your colleagues. This will open your default email client.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select recipients..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
