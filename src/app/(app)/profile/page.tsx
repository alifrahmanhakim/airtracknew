'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Save, User as UserIcon } from 'lucide-react';
import type { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { updateUserProfile, sendPasswordReset } from '@/lib/actions/user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';

const profileSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
    },
  });

  React.useEffect(() => {
    const fetchUser = async (userId: string) => {
      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = { id: userSnap.id, ...userSnap.data() } as User;
          setCurrentUser(userData);
          form.reset({ name: userData.name });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user data.' });
      } finally {
        setIsLoading(false);
      }
    };

    const userId = localStorage.getItem('loggedInUserId');
    if (userId) {
      fetchUser(userId);
    } else {
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Not logged in.' });
    }
  }, [form, toast]);
  
  React.useEffect(() => {
    if (currentUser?.lastOnline) {
      const lastOnlineDate = new Date(currentUser.lastOnline);
      const now = new Date();
      const diffInMinutes = (now.getTime() - lastOnlineDate.getTime()) / (1000 * 60);
      setIsOnline(diffInMinutes < 5);
    }
  }, [currentUser]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!currentUser) return;
    setIsSaving(true);
    const result = await updateUserProfile(currentUser.id, data.name);
    setIsSaving(false);

    if (result.success) {
      setCurrentUser((prev) => (prev ? { ...prev, name: data.name } : null));
      toast({ title: 'Profile Updated', description: 'Your name has been successfully updated.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };
  
  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'No email address found for your account.' });
        return;
    }
    setIsSendingEmail(true);
    const result = await sendPasswordReset(currentUser.email);
    setIsSendingEmail(false);

    if (result.success) {
        toast({ title: 'Email Sent', description: 'A password reset link has been sent to your email address.' });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }


  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="p-4 md:p-8">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load user profile. Please try logging in again.</AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto grid gap-6">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar online={isOnline} className="h-16 w-16">
                            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                            <AvatarFallback>
                                <UserIcon className="h-8 w-8" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Manage your personal information.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input {...field} className="pl-9" />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input value={currentUser.email} disabled className="pl-9" />
                            </div>
                        </FormItem>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
        <Card>
            <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">If you've forgotten your password or want to change it, you can request a reset link to be sent to your email.</p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" onClick={handlePasswordReset} disabled={isSendingEmail}>
                    {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send Password Reset Email
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
