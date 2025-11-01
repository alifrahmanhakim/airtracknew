
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
import { Loader2, Mail, Save, User as UserIcon, CheckCircle, ExternalLink } from 'lucide-react';
import type { User } from '@/lib/types';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { updateUserProfile, sendPasswordReset } from '@/lib/actions/user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { getGoogleAuthUrl } from '@/lib/actions/google';
import { useRouter, useSearchParams } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);


export function ProfilePageClient() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = React.useState(false);
  const [hasDriveAccess, setHasDriveAccess] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
    },
  });
  
  React.useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (status === 'google_connected') {
        toast({
            title: "Google Account Connected!",
            description: "You have successfully granted access.",
            className: "bg-green-500 text-white",
        });
        router.replace('/profile', {scroll: false});
    }
    if (error) {
         toast({
            variant: 'destructive',
            title: "Google Connection Failed",
            description: "Something went wrong while connecting your Google account.",
        });
        router.replace('/profile', {scroll: false});
    }

  }, [searchParams, toast, router]);

  React.useEffect(() => {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) {
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Not logged in.' });
      return;
    }

    const userUnsub = onSnapshot(doc(db, 'users', userId), (userSnap) => {
        setIsLoading(true);
        if (userSnap.exists()) {
            const userData = { id: userSnap.id, ...userSnap.data() } as User;
            setCurrentUser(userData);
            form.reset({ name: userData.name });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        }
        setIsLoading(false);
    });
    
    const tokenUnsub = onSnapshot(doc(db, 'user_tokens', userId), (tokenSnap) => {
        if (tokenSnap.exists() && tokenSnap.data()?.hasDriveAccess) {
            setHasDriveAccess(true);
        } else {
            setHasDriveAccess(false);
        }
    });

    return () => {
        userUnsub();
        tokenUnsub();
    };
  }, [form, toast]);
  
  React.useEffect(() => {
    if (currentUser?.lastOnline) {
      const lastOnlineDate = new Date(currentUser.lastOnline);
      const now = new Date();
      const diffInMinutes = (now.getTime() - lastOnlineDate.getTime()) / (1000 * 60);
      setIsOnline(diffInMinutes < 5);
    }
  }, [currentUser]);
  
   const handleConnectGoogle = async () => {
    if (!currentUser) return;
    setIsConnectingGoogle(true);
    const result = await getGoogleAuthUrl(currentUser.id);
    if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Could not initiate Google connection.',
        });
        setIsConnectingGoogle(false);
    }
   }

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
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect your account to other services.</CardDescription>
            </CardHeader>
            <CardContent>
                {hasDriveAccess ? (
                     <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <GoogleIcon />
                            <p className="font-medium text-green-800 dark:text-green-300">Google Drive Connected</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                            <GoogleIcon />
                            <div>
                                <p className="font-medium">Google Drive</p>
                                <p className="text-sm text-muted-foreground">Link documents directly from your Drive.</p>
                            </div>
                        </div>
                        <Button onClick={handleConnectGoogle} disabled={isConnectingGoogle}>
                            {isConnectingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                            Connect
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
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
